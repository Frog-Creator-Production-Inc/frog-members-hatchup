import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ProfileForm from "./components/profile-form"
import Layout from "../components/layout"
import { SubscriptionManagement } from "./components/subscription-management"
import { SubscriptionStatus } from "./components/subscription-status"
import { Settings } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Error fetching profile:", error)
    // エラーハンドリングを適切に行う（例：エラーページにリダイレクト）
    redirect("/dashboard?error=profile_fetch")
  }

  const isSubscribed = profile?.is_member || false
  const hasStripeCustomer = !!profile?.stripe_customer_id
  const subscriptionStatus = profile?.subscription_status
  const subscriptionPeriodEnd = profile?.subscription_period_end

  return (
    <Layout>
      <div className="space-y-10">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">アカウント設定</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            プロフィール情報やサブスクリプション設定を管理します。個人情報の更新やメンバーシップの管理が可能です。
          </p>
        </div>

        {/* プロフィール設定セクション */}
        <div>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">プロフィール設定</h2>
          <ProfileForm initialProfile={profile} />
        </div>
        
        {/* サブスクリプション管理セクション */}
        {isSubscribed && (
          <div className="mt-12 pt-6">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b">サブスクリプション管理</h2>
            <div className="space-y-6">
              <SubscriptionStatus 
                isSubscribed={isSubscribed}
                status={subscriptionStatus}
                periodEnd={subscriptionPeriodEnd}
              />
              
              <SubscriptionManagement 
                isSubscribed={isSubscribed}
                hasStripeCustomer={hasStripeCustomer}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

