import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia"
});

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    console.log("Cancelling subscription for user:", userId);
    
    const supabase = createRouteHandlerClient({ cookies });

    // ユーザープロファイルの取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_subscription_id, stripe_customer_id, email")
      .eq("id", userId)
      .single();

    console.log("User profile:", profile, "Error:", profileError);

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (!profile.stripe_subscription_id) {
      console.error("No subscription ID found for user");
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    console.log("Attempting to cancel subscription:", profile.stripe_subscription_id);

    // Stripeサブスクリプションのキャンセル
    try {
      // サブスクリプションの存在確認
      const subscription = await stripe.subscriptions.retrieve(
        profile.stripe_subscription_id
      );
      
      console.log("Retrieved subscription:", subscription.id, "Status:", subscription.status);
      
      // すでにキャンセル済みの場合は成功として扱う
      if (subscription.status === 'canceled') {
        console.log("Subscription already canceled");
        
        // プロファイルの更新
        await supabase
          .from("profiles")
          .update({
            is_member: false,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
          
        return NextResponse.json({ 
          success: true, 
          message: "Subscription was already cancelled" 
        });
      }
      
      // サブスクリプションのキャンセル
      const deletedSubscription = await stripe.subscriptions.cancel(
        profile.stripe_subscription_id
      );
      
      console.log("Subscription cancelled:", deletedSubscription.id);
    } catch (stripeError: any) {
      console.error("Stripe cancellation error:", stripeError);
      
      // Stripeエラーの詳細をログに出力
      if (stripeError.type && stripeError.message) {
        console.error(`Stripe error type: ${stripeError.type}, message: ${stripeError.message}`);
      }
      
      // サブスクリプションが見つからない場合は、プロファイルだけ更新する
      if (stripeError.code === 'resource_missing') {
        console.log("Subscription not found in Stripe, updating profile only");
        
        await supabase
          .from("profiles")
          .update({
            is_member: false,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
          
        return NextResponse.json({ 
          success: true, 
          message: "Profile updated, but subscription was not found in Stripe" 
        });
      }
      
      return NextResponse.json(
        { error: "Failed to cancel subscription with Stripe", details: stripeError.message },
        { status: 500 }
      );
    }

    // プロファイルの更新
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_member: false,
        subscription_status: "canceled",
        updated_at: new Date().toISOString(),
        // stripe_customer_idとstripe_subscription_idは保持
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Subscription cancelled" });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription", details: error.message },
      { status: 500 }
    );
  }
} 