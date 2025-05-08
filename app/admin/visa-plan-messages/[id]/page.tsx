import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { VisaPlanMessages } from "../components/visa-plan-messages"

export const dynamic = "force-dynamic"

export default async function AdminVisaPlanMessageDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  // ビザプラン情報を取得
  const { data: plan, error: planError } = await supabase
    .from("visa_plans")
    .select(`
      *,
      profiles:user_id(
        id,
        email,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("id", params.id)
    .single()

  if (planError || !plan) {
    console.error("ビザプランの読み込みエラー:", planError)
    redirect("/admin/visa-plan-messages")
  }

  // ビザプランに関連するレビュー/メッセージを取得
  const { data: messages, error: messagesError } = await supabase
    .from("visa_plan_reviews")
    .select(`
      id,
      plan_id,
      user_id,
      admin_id,
      status,
      title,
      comment,
      admin_comment,
      created_at,
      updated_at,
      user_profile:profiles!visa_plan_reviews_user_id_fkey (
        id,
        email,
        first_name,
        last_name,
        avatar_url
      ),
      admin_profile:profiles!visa_plan_reviews_admin_id_fkey (
        id,
        email,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("plan_id", params.id)
    .order("created_at", { ascending: true })

  if (messagesError) {
    console.error("メッセージの読み込みエラー:", messagesError)
    return <div>メッセージの読み込みに失敗しました</div>
  }

  // 管理者のプロフィール情報を取得（現在のログインユーザー）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!adminProfile) {
    return <div>管理者情報の取得に失敗しました</div>
  }

  return (
    <VisaPlanMessages 
      plan={plan} 
      messages={messages || []} 
      adminProfile={adminProfile} 
    />
  )
} 