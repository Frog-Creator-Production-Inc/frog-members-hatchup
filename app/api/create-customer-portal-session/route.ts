import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10"
})

export async function POST(req: Request) {
  try {
    const { customerId } = await req.json()

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating customer portal session:", error)
    return new NextResponse(
      JSON.stringify({ error: "Failed to create customer portal session" }),
      { status: 500 }
    )
  }
} 