import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { JobPositionManagement } from "./components/job-position-management"

export const dynamic = "force-dynamic"

export default async function AdminJobPositionsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  // 管理者権限の確認
  const { data: adminRole } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", session.user.id)
    .single()

  if (!adminRole) {
    redirect("/dashboard")
  }

  // 職種情報の取得
  const { data: jobPositions } = await supabase
    .from("job_positions")
    .select("*")
    .order("title")

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">職種情報管理</h1>
      <JobPositionManagement 
        initialJobPositions={jobPositions || []} 
      />
    </div>
  )
} 