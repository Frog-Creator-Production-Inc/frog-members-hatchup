import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia"
});

// Stripeウェブフックのシークレットキー
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ランタイム設定
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  console.log("Webhook received at:", new Date().toISOString());

  try {
    // リクエストヘッダーをログに出力
    console.log(
      "Request headers:",
      Object.fromEntries(req.headers.entries())
    );

    const rawBody = await req.text();
    console.log("Raw body length:", rawBody.length);

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe signature found");
      return new NextResponse("No signature", { status: 400 });
    }

    console.log(
      "Attempting to construct event with signature:",
      signature.substring(0, 10) + "..."
    );

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
      console.log("Event constructed successfully");
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error constructing event:", error.message);
      return new NextResponse(
        JSON.stringify({
          error: "Webhook signature verification failed",
          details: error.message,
        }),
        { status: 400 }
      );
    }

    // イベントオブジェクトの型を適切に処理
    const eventObject = event.data.object;
    console.log("Webhook event:", {
      type: event.type,
      id: event.id,
      object: {
        id: "id" in eventObject ? eventObject.id : undefined,
        customer: "customer" in eventObject ? eventObject.customer : undefined,
        subscription:
          "subscription" in eventObject ? eventObject.subscription : undefined,
        metadata: "metadata" in eventObject ? eventObject.metadata : undefined,
        status: "status" in eventObject ? eventObject.status : undefined,
      },
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // セッションの完全な情報を取得
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ['subscription', 'customer'],
          }
        );

        console.log("Processing checkout.session.completed:", {
          sessionId: session.id,
          metadata: session.metadata,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        // メタデータからユーザーIDを取得
        const userId = checkoutSession.metadata?.userId || checkoutSession.client_reference_id;
        if (!userId) {
          console.error("No userId in metadata or client_reference_id");
          return new NextResponse("No userId found", { status: 400 });
        }

        // サブスクリプションIDとカスタマーIDを取得（文字列のIDのみを確保）
        let subscriptionId = typeof checkoutSession.subscription === 'string' 
          ? checkoutSession.subscription 
          : checkoutSession.subscription?.id;
        
        let customerId = typeof checkoutSession.customer === 'string'
          ? checkoutSession.customer
          : checkoutSession.customer?.id;

        // オブジェクトの場合はIDを抽出
        if (typeof subscriptionId === 'object' && subscriptionId !== null) {
          subscriptionId = (subscriptionId as { id: string }).id;
        }
        
        if (typeof customerId === 'object' && customerId !== null) {
          customerId = (customerId as { id: string }).id;
        }
        if (!subscriptionId || !customerId) {
          console.error("Missing subscription or customer ID", { 
            subscriptionId: subscriptionId,
            customerId: customerId
          });
          return new NextResponse("Missing subscription or customer ID", { status: 400 });
        }

        try {
          // サブスクリプション情報を取得して期間終了日を設定
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          console.log("Attempting to update profile with service role:", {
            userId,
            customerId,
            subscriptionId,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          });

          // Supabaseでプロファイルを更新
          const { data, error: updateError } = await supabase
            .from("profiles")
            .update({
              is_member: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: subscription.status,
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
            .select();

          if (updateError) {
            console.error("Profile update error:", updateError);
            throw updateError;
          }

          console.log("Profile update result:", data);

          return new NextResponse("Success", { status: 200 });
        } catch (error) {
          console.error("Error updating profile:", error);
          return new NextResponse(
            JSON.stringify({ error: "Failed to update profile" }),
            { status: 500 }
          );
        }
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("Processing subscription.deleted:", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status
        });
        
        // ユーザーを見つける
        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError) {
          console.error("Error finding profile by subscription ID:", findError);
          
          // サブスクリプションIDで見つからない場合は顧客IDで試す
          const { data: profileByCustomer, error: customerFindError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", subscription.customer)
            .single();
            
          if (customerFindError) {
            console.error("Error finding profile by customer ID:", customerFindError);
            return NextResponse.json({ 
              success: false, 
              error: "User not found" 
            }, { status: 404 });
          }
          
          // 顧客IDで見つかった場合はそのプロファイルを更新
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              is_member: false,
              subscription_status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", profileByCustomer.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
            return NextResponse.json({ 
              success: false, 
              error: "Failed to update profile" 
            }, { status: 500 });
          }
          
          console.log("Profile updated by customer ID:", profileByCustomer.id);
          return NextResponse.json({ success: true });
        }

        // プロファイルを更新（メンバーシップを無効化）
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            is_member: false,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          return NextResponse.json({ 
            success: false, 
            error: "Failed to update profile" 
          }, { status: 500 });
        }
        
        console.log("Profile updated successfully:", profile.id);
        return NextResponse.json({ success: true });
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("Processing subscription.updated:", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        });
        
        // サブスクリプションがキャンセル予定の場合
        if (subscription.cancel_at_period_end) {
          // ユーザーを見つける
          const { data: profile, error: findError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (findError) {
            console.error("Error finding profile by subscription ID:", findError);
            
            // サブスクリプションIDで見つからない場合は顧客IDで試す
            const { data: profileByCustomer, error: customerFindError } = await supabase
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", subscription.customer)
              .single();
              
            if (customerFindError) {
              console.error("Error finding profile by customer ID:", customerFindError);
              return NextResponse.json({ 
                success: false, 
                error: "User not found" 
              }, { status: 404 });
            }
            
            // 顧客IDで見つかった場合はそのプロファイルを更新
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                subscription_status: "canceling",
                subscription_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", profileByCustomer.id);

            if (updateError) {
              console.error("Error updating profile:", updateError);
              return NextResponse.json({ 
                success: false, 
                error: "Failed to update profile" 
              }, { status: 500 });
            }
            
            console.log("Profile updated by customer ID:", profileByCustomer.id);
            return NextResponse.json({ success: true });
          }

          // プロファイルを更新（キャンセル予定としてマーク）
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "canceling",
              subscription_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
            return NextResponse.json({ 
              success: false, 
              error: "Failed to update profile" 
            }, { status: 500 });
          }
          
          console.log("Profile marked as canceling:", profile.id);
        } else {
          // サブスクリプションが再開または更新された場合
          const { data: profile, error: findError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (findError) {
            console.error("Error finding profile by subscription ID:", findError);
            
            // サブスクリプションIDで見つからない場合は顧客IDで試す
            const { data: profileByCustomer, error: customerFindError } = await supabase
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", subscription.customer)
              .single();
              
            if (customerFindError) {
              console.error("Error finding profile by customer ID:", customerFindError);
              return NextResponse.json({ 
                success: false, 
                error: "User not found" 
              }, { status: 404 });
            }
            
            // 顧客IDで見つかった場合はそのプロファイルを更新
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                is_member: true,
                stripe_subscription_id: subscription.id, // サブスクリプションIDを更新
                subscription_status: subscription.status,
                subscription_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", profileByCustomer.id);

            if (updateError) {
              console.error("Error updating profile:", updateError);
              return NextResponse.json({ 
                success: false, 
                error: "Failed to update profile" 
              }, { status: 500 });
            }
            
            console.log("Profile updated by customer ID:", profileByCustomer.id);
            return NextResponse.json({ success: true });
          }

          // プロファイルを更新
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              is_member: true,
              subscription_status: subscription.status,
              subscription_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
            return NextResponse.json({ 
              success: false, 
              error: "Failed to update profile" 
            }, { status: 500 });
          }
          
          console.log("Profile updated with active subscription:", profile.id);
        }
        
        return NextResponse.json({ success: true });
      }

      // 他のイベントは無視
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new NextResponse("Success", { status: 200 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Webhook handler failed:", err.message);
    return new NextResponse(
      JSON.stringify({
        error: "Webhook handler failed",
        message: err.message,
      }),
      { status: 500 }
    );
  }
} 