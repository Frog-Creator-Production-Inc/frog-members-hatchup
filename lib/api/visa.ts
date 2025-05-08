import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { VisaType } from "@/types/supabase"

export async function getVisaTypes() {
  const supabase = createClientComponentClient()

  try {
    const { data, error } = await supabase
      .from("visa_types")
      .select("*")
      .order("name")

    if (error) throw error

    return data || []
  } catch (error) {
    throw error
  }
}

export async function createVisaPlan({
  userId,
  name,
  description,
  visaTypes,
}: {
  userId: string
  name: string
  description?: string
  visaTypes: { visaTypeId: string; orderIndex: number }[]
}) {
  const supabase = createClientComponentClient()

  try {
    // プランを作成
    const { data: plan, error: planError } = await supabase
      .from("visa_plans")
      .insert({
        user_id: userId,
        name,
        description,
        status: "draft",
      })
      .select()
      .single()

    if (planError) throw planError

    // プランアイテムを作成
    const { error: itemsError } = await supabase.from("visa_plan_items").insert(
      visaTypes.map((item) => ({
        plan_id: plan.id,
        visa_type_id: item.visaTypeId,
        order_index: item.orderIndex,
      })),
    )

    if (itemsError) throw itemsError

    return plan
  } catch (error) {
    throw error
  }
}

export async function updateVisaPlanItems(planId: string, visaTypes: { visaTypeId: string; orderIndex: number }[]) {
  const supabase = createClientComponentClient()

  try {
    // 既存のアイテムを削除
    const { error: deleteError } = await supabase
      .from("visa_plan_items")
      .delete()
      .eq("plan_id", planId)

    if (deleteError) throw deleteError

    // 新しいアイテムを追加
    const { error: insertError } = await supabase.from("visa_plan_items").insert(
      visaTypes.map((item) => ({
        plan_id: planId,
        visa_type_id: item.visaTypeId,
        order_index: item.orderIndex,
      })),
    )

    if (insertError) throw insertError
  } catch (error) {
    throw error
  }
}