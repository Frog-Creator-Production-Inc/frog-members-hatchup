"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { toast } from "react-hot-toast"

interface SubscriptionCardProps {
  userId: string
}

export function SubscriptionCard({ userId }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      })

      if (!response.ok) throw new Error("Subscription creation failed")

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
        return
      }

      const { sessionId } = data
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripe) throw new Error("Stripe failed to load")

      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) throw error

    } catch (error) {
      console.error("Error:", error)
      toast.error("サブスクリプションの作成に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold">メンバーシップに登録</h3>
            <p className="text-muted-foreground mt-2">
              すべての学習コンテンツにアクセスして、渡航準備を始めましょう
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-3xl font-bold">¥500<span className="text-base font-normal text-muted-foreground">/月</span></p>
              <p className="text-sm text-muted-foreground">いつでもキャンセル可能</p>
            </div>

            <ul className="space-y-2">
              {[
                "すべての学習コンテンツにアクセス",
                "渡航準備から現地生活まで網羅的に学習",
                "実践的な演習と資料",
                "定期的な新コンテンツの追加",
                "コミュニティへのアクセス",
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full"
          >
            {loading ? "処理中..." : "メンバーシップに登録"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            登録することで、利用規約とプライバシーポリシーに同意したことになります。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}