import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Layout from "@/app/components/layout"
import ClientPage from "./client-page"

export const dynamic = "force-dynamic"

// サーバーコンポーネント
export default async function LearningPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  // Check if user is a member
  const { data: profile } = await supabase
    .from("profiles")
    .select("*") // 必要なフィールドをすべて取得するように変更
    .eq("id", session.user.id)
    .single()

  const isSubscribed = profile?.is_member || false
  const hasStripeCustomer = !!profile?.stripe_customer_id
  const subscriptionStatus = profile?.subscription_status
  const subscriptionPeriodEnd = profile?.subscription_period_end

  return (
    <Layout>
      <ClientPage 
        isSubscribed={isSubscribed}
        userId={session.user.id}
        subscriptionStatus={subscriptionStatus}
        subscriptionPeriodEnd={subscriptionPeriodEnd}
        hasStripeCustomer={hasStripeCustomer}
      />
    </Layout>
  )
}