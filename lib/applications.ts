import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * コース申し込みのステータスを更新する
 * @param applicationId 申し込みID
 * @param status 新しいステータス
 * @param adminNotes 管理者メモ（オプション）
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: 'reviewing' | 'approved' | 'rejected',
  adminNotes?: string
) {
  const supabase = createClientComponentClient()

  try {
    const updateData: {
      status: string;
      admin_notes?: string;
    } = { status }

    if (adminNotes) {
      updateData.admin_notes = adminNotes
    }

    const { error } = await supabase
      .from('course_applications')
      .update(updateData)
      .eq('id', applicationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * 未処理のコース申し込みの数を取得する
 */
export async function getPendingApplicationCount() {
  const supabase = createClientComponentClient()

  try {
    const { count, error } = await supabase
      .from("course_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted")

    if (error) {
      throw error
    }

    return count || 0
  } catch (error) {
    return 0
  }
} 