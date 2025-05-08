import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "../client";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });

    // ユーザープロファイルの取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_member, email, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // メンバーでない場合は何もしない
    if (!profile.is_member) {
      return NextResponse.json(
        { message: "User is not a member" },
        { status: 200 }
      );
    }

    // Stripe情報が既に存在する場合は何もしない
    if (profile.stripe_customer_id && profile.stripe_subscription_id) {
      return NextResponse.json(
        { message: "Stripe information already exists" },
        { status: 200 }
      );
    }

    // Stripeから顧客情報を検索
    const customers = await stripe.customers.list({
      email: profile.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: "No Stripe customer found for this email" },
        { status: 404 }
      );
    }

    const customerId = customers.data[0].id;
    
    // 顧客のサブスクリプションを取得
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "No active subscription found for this customer" },
        { status: 404 }
      );
    }

    const subscriptionId = subscriptions.data[0].id;
    
    // プロファイルを更新
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stripe information updated",
      data: {
        customerId,
        subscriptionId
      }
    });
  } catch (error) {
    console.error("Error updating Stripe information:", error);
    return NextResponse.json(
      { error: "Failed to update Stripe information" },
      { status: 500 }
    );
  }
} 