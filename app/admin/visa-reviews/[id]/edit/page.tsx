import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { VisaPlanCreator } from "../../../components/visa-plan-creator"

export const dynamic = "force-dynamic"

export default async function AdminVisaPlanEditPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // ビザタイプを取得
    const { data: visaTypes, error: visaTypesError } = await supabase
      .from("visa_types")
      .select(`
        *,
        requirements:visa_requirements!visa_requirements_visa_type_id_fkey(*)
      `)
      .order("order_index", { ascending: true })

    if (visaTypesError) {
      console.error("Error fetching visa types:", visaTypesError)
      return <div>ビザタイプの取得中にエラーが発生しました。</div>
    }

    // 既存のビザプランを取得
    const { data: plan, error: planError } = await supabase
      .from("visa_plans")
      .select(`
        *,
        visa_plan_items(*)
      `)
      .eq("id", params.id)
      .single()

    if (planError) {
      console.error("Error fetching visa plan:", planError)
      redirect("/admin/visa-reviews")
    }

    // ユーザー情報を取得
    const { data: selectedUser, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", plan.user_id)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return <div>ユーザー情報の取得中にエラーが発生しました。</div>
    }

    // すべてのユーザーを取得
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("email", { ascending: true })

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return <div>ユーザー情報の取得中にエラーが発生しました。</div>
    }

    return (
      <div className="container py-6">
        <VisaPlanCreator
          visaTypes={visaTypes}
          users={users}
          selectedUser={selectedUser}
          initialPlan={plan}
        />
      </div>
    )
  } catch (error) {
    console.error("予期せぬエラーが発生しました:", error)
    return <div>データの取得中にエラーが発生しました。しばらくしてから再度お試しください。</div>
  }
} 