import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Layout from "@/app/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, ArrowRight } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CancelSuccessPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gradient-to-r from-muted/50 to-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Info className="h-6 w-6 text-primary" />
              メンバーシップの解約が完了しました
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              メンバーシップの解約が完了しました。学習コンテンツへのアクセスは終了しています。
            </p>

            <div className="space-y-4">
              <h3 className="font-medium">解約後について</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 学習コンテンツへのアクセスは即座に終了しています</li>
                <li>• いつでも再登録が可能です</li>
                <li>• 再登録すると、すべてのコンテンツに再びアクセスできます</li>
                <li>• ご不明点があれば、サポートまでお問い合わせください</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/learning" className="flex items-center gap-2">
                  トップページに戻る
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