import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia"
})

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    const supabase = createRouteHandlerClient({ cookies })

    // Check if user exists and is not already a member
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_member, email, subscription_status")
      .eq("id", userId)
      .single()

    if (profileError) {
      throw new Error("User not found")
    }

    // すでにアクティブなサブスクリプションがある場合は作成しない
    if (profile.is_member && profile.subscription_status !== "canceled") {
      throw new Error("User is already a member")
    }

    // Create Stripe Checkout Session
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
    })

    console.log('Created checkout session:', {
      sessionId: session.id,
      metadata: session.metadata,
      userId: userId
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error("Subscription error:", error)
    return NextResponse.json(
      { error: "Failed to create subscription", message: error.message },
      { status: 500 }
    )
  }
}