import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10"
})

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    const supabase = createRouteHandlerClient({ cookies })

    // ユーザーのプロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .single()

    if (profileError || !profile.stripe_subscription_id) {
      throw new Error("Subscription not found")
    }

    // Stripeの購読をキャンセル
    const deletedSubscription = await stripe.subscriptions.cancel(profile.stripe_subscription_id)

    if (!deletedSubscription) {
      throw new Error("Failed to cancel subscription")
    }

    // プロフィールを更新
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_member: false,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      throw updateError
    }

    return new NextResponse("Subscription cancelled", { status: 200 })
  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return new NextResponse(
      JSON.stringify({ error: "Failed to cancel subscription", details: error.message }),
      { status: 500 }
    )
  }
} 