import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { DashboardStats } from "./components/dashboard-stats"
import { SchoolOverview } from "./components/school-overview"
import { RecentChats } from "./components/recent-chats"
import { RecentVisaReviews } from "./components/recent-visa-reviews"
import { LearningOverview } from "./components/learning-overview"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies })
  
  // 認証情報の取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user || userError) {
    console.log("未認証ユーザーが管理者ページにアクセス: /authへリダイレクト")
    return redirect("/auth")
  }
  
  // 管理者権限のチェック
  const { data: adminRole } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .single()
  
  // 管理者でない場合はダッシュボードにリダイレクト
  if (!adminRole) {
    console.log("非管理者ユーザーが管理者ページにアクセス: /dashboardへリダイレクト")
    return redirect("/dashboard")
  }
  
  console.log("管理者ユーザーの管理者ページアクセス: 表示許可")

  // 各種データの取得（認証チェックはlayoutで行うため省略）
  const [
    { data: schools },
    { data: courses },
    { data: chats },
    { data: reviews },
    { data: learningContent }
  ] = await Promise.all([
    supabase.from("schools").select("count").single(),
    supabase.from("courses").select("count").single(),
    supabase.from("chat_sessions").select("*").eq("status", "unread").limit(5),
    supabase.from("visa_plan_reviews").select("*").eq("status", "pending").limit(5),
    supabase.from("video_sections").select("count").single()
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
      
      <DashboardStats
        schoolCount={schools?.count || 0}
        courseCount={courses?.count || 0}
        contentCount={learningContent?.count || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SchoolOverview />
        <RecentChats chats={chats || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentVisaReviews reviews={reviews || []} />
        <LearningOverview />
      </div>
    </div>
  )
}