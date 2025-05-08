import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia"
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ユーザープロファイルを取得
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 }
      );
    }

    console.log("Creating portal session for customer:", profile.stripe_customer_id);

    try {
      // Stripeカスタマーポータルセッションを作成
      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
      });

      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError);
      
      // Stripeの設定エラーの場合は特別なメッセージを返す
      if (stripeError.type === 'StripeInvalidRequestError' && 
          stripeError.raw?.message?.includes('No configuration provided')) {
        return NextResponse.json(
          { 
            error: "Stripe customer portal not configured", 
            message: "Please configure the Stripe customer portal in the Stripe dashboard.",
            details: stripeError.raw?.message
          },
          { status: 400 }
        );
      }
      
      throw stripeError; // その他のエラーは外側のcatchブロックで処理
    }
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { 
        error: "Failed to create portal session",
        message: error.message || "An unknown error occurred"
      },
      { status: 500 }
    );
  }
} 