import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// ランタイム設定
export const runtime = 'nodejs'
export const maxDuration = 60

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
})

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new NextResponse('No signature', { status: 400 })
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return new NextResponse(
        JSON.stringify({ error: 'Webhook signature verification failed', details: (err as Error).message }), 
        { status: 400 }
      );
    }

    // イベントオブジェクトの型を適切に処理
    const eventObject = event.data.object

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // セッションの完全な情報を取得
        const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['subscription']
        })

        // メタデータからユーザーIDを取得
        const userId = checkoutSession.metadata?.userId
        if (!userId) {
          return new NextResponse('No userId found', { status: 400 })
        }

        try {
          // プロフィール更新前にデータを確認
          const { data: existingProfile, error: selectError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single()

          // プロフィールを更新
          const subscriptionId = typeof checkoutSession.subscription === 'string' 
            ? checkoutSession.subscription 
            : checkoutSession.subscription?.id

          const { data, error: updateError } = await supabase
            .from("profiles")
            .update({
              is_member: true,
              stripe_customer_id: checkoutSession.customer as string,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
            .select()

          if (updateError) {
            throw updateError
          }

          return new NextResponse('Success', { status: 200 })
        } catch (error) {
          return new NextResponse(
            JSON.stringify({ error: 'Failed to update profile' }), 
            { status: 500 }
          )
        }
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user by Stripe customer ID and update membership status
        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single()

        if (findError) {
          return NextResponse.json(
            { error: "Failed to find user" },
            { status: 500 }
          )
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            is_member: false,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id)

        if (updateError) {
          return NextResponse.json(
            { error: "Failed to update membership" },
            { status: 500 }
          )
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        if (!subscription.cancel_at_period_end) {
          try {
            const { data: profile, error: findError } = await supabase
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", subscription.customer)
              .single()

            if (findError) {
              return new NextResponse('Success', { status: 200 })
            }

            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                is_member: true,
                stripe_subscription_id: subscription.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", profile.id)
          } catch (error) {
            // エラー処理は行うが、ログは出力しない
          }
        }
        return new NextResponse('Success', { status: 200 })
      }

      // 他のイベントは無視
      default:
        return new NextResponse('Success', { status: 200 })
    }
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Webhook handler failed', message: (error as Error).message }), 
      { status: 500 }
    )
  }
}
