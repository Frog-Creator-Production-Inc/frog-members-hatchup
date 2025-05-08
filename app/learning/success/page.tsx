import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Layout from "@/app/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { stripe } from "@/app/api/stripe/client"

export const dynamic = "force-dynamic"

export default async function LearningSuccessPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  // プロファイル情報を取得
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_member, stripe_customer_id, stripe_subscription_id")
    .eq("id", session.user.id)
    .single();

  // Stripe情報が不足している場合は、最新のサブスクリプション情報を取得して更新
  if (!profileError && profile && profile.is_member && 
      (!profile.stripe_customer_id || !profile.stripe_subscription_id)) {
    
    try {
      // Stripeから顧客情報を検索
      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        
        // 顧客のサブスクリプションを取得
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscriptionId = subscriptions.data[0].id;
          
          // プロファイルを更新
          await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.user.id);
            
          console.log("Updated profile with Stripe info:", {
            customerId,
            subscriptionId
          });
        }
      }
    } catch (error) {
      console.error("Error retrieving Stripe information:", error);
    }
  }

  // 支払い成功後にプロファイルを更新
  const { error } = await supabase
    .from("profiles")
    .update({
      is_member: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id)

  if (error) {
    console.error("Error updating profile:", error)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Check className="h-6 w-6 text-primary" />
              メンバーシップの登録が完了しました！
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Frog Membersへようこそ！これから一緒に海外就職への道を歩んでいきましょう。
            </p>

            <div className="space-y-4">
              <h3 className="font-medium">次のステップ</h3>
              <ul className="space-y-2">
                {[
                  "学習コンテンツをチェック",
                  "ビザプランを作成",
                  "コミュニティに参加",
                  "プロフィールを完成させる",
                ].map((step, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/learning" className="flex items-center gap-2">
                  学習を始める
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}