import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import UserDistribution from "./components/user-distribution"
import SchoolStats from "./components/school-stats"
import Layout from "../components/layout"
import { BarChart3, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

export default async function StatisticsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile?.onboarding_completed) {
    redirect("/onboarding")
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">統計情報</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            ユーザー分布や学校統計など、プラットフォーム全体の統計情報を確認できます。データは定期的に更新されます。
          </p>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">データ収集中</AlertTitle>
          <AlertDescription className="text-amber-700">
            現在、十分なデータが集まるまでの間は仮のデータを表示しています。表示されている全ての統計情報はサンプルデータであり、実際の値ではありません。
            正確な統計情報は近日公開予定です。
          </AlertDescription>
        </Alert>
        
        <UserDistribution />
        <SchoolStats />
      </div>
    </Layout>
  )
}

