import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Metadata } from "next"

import { TemplateList } from "./components/template-list"

export const metadata: Metadata = {
  title: "Content Snare管理 | Admin",
  description: "Content Snareのテンプレートとリクエストを管理します",
}

export default async function ContentSnarePage() {
  const supabase = createServerComponentClient({ cookies })
  
  // セッションチェック
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect("/auth")
  }
  
  // 管理者権限チェック
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single()
  
  if (!adminRole) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Snare管理</h1>
        <p className="text-muted-foreground mt-2">
          Content Snareのテンプレートとリクエストを管理します。現在のテンプレート一覧を表示しています。
        </p>
      </div>
      <div className="space-y-6">
        <TemplateList />
      </div>
    </div>
  )
} 