import { Sidebar } from "./components/sidebar"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  
  // 認証情報の取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user || userError) {
    console.log("未認証ユーザーが管理者ページにアクセス: ログインページにリダイレクト")
    redirect("/auth")
  }
  
  // 管理者かどうかの確認
  try {
    const { data: adminRole, error } = await supabase
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .single()
    
    if (error || !adminRole) {
      console.log("管理者権限なし: ダッシュボードにリダイレクト")
      redirect("/dashboard")
    }
  } catch (error) {
    console.error("管理者権限確認エラー:", error)
    redirect("/dashboard")
  }
  
  return (
    <div className="flex bg-gray-100">
      <div className="fixed h-screen">
        <Sidebar />
      </div>
      <div className="flex-1 ml-64">
        <main className="overflow-x-hidden overflow-y-auto bg-gray-100 min-h-screen">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

