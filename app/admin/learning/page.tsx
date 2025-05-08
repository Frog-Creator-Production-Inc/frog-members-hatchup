import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { LearningManagement } from "./components/learning-management"
import { redirect } from "next/navigation"

export default async function LearningPage() {
  const supabase = createServerComponentClient({ cookies })

  // セッションチェック
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // 管理者権限チェック
  const { data: adminRole } = await supabase
    .from("admin_roles")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  if (!adminRole) {
    redirect("/")
  }

  // video_sectionsとlearning_videos、video_resourcesを結合して取得
  const { data: sections, error } = await supabase
    .from("video_sections")
    .select(`
      *,
      videos:learning_videos(
        *,
        video_resources(*)
      )
    `)
    .order('order_index')

  if (error) {
    console.error("Error fetching sections:", error)
    return <div>エラーが発生しました</div>
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">学習コンテンツ管理</h1>
      <LearningManagement initialSections={sections || []} />
    </div>
  )
}