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
      .select("is_member, email")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error("User not found");
    }

    if (profile.is_member) {
      throw new Error("User is already a member");
    }

    // Stripeチェックアウトセッションの作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/learning/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/learning`,
      customer_email: profile.email,
      metadata: {
        userId: userId,
      },
      client_reference_id: userId,
    });

    console.log("Created checkout session:", {
      sessionId: session.id,
      url: session.url,
      metadata: session.metadata,
      userId: userId,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
} 