import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { VisaManagement } from "./components/visa-management"

export const dynamic = "force-dynamic"

export default async function AdminVisasPage() {
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

  // ビザ情報の取得
  const { data: visaTypes } = await supabase
    .from("visa_types")
    .select("*")
    .order("name")

  // ビザ要件の取得
  const { data: visaRequirements } = await supabase
    .from("visa_requirements")
    .select("*")
    .order("visa_type_id, order_index")

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">ビザ情報管理</h1>
      <VisaManagement 
        initialVisaTypes={visaTypes || []} 
        initialVisaRequirements={visaRequirements || []} 
      />
    </div>
  )
} 