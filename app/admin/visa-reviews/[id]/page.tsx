import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { VisaReviewDetail } from "../components/visa-review-detail"

export const dynamic = "force-dynamic"

export default async function AdminVisaReviewDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  // まずビザレビューの基本情報を取得
  const { data: review, error: reviewError } = await supabase
    .from("visa_plan_reviews")
    .select(`
      *,
      visa_plans!inner (
        id,
        name,
        description,
        visa_plan_items (
          id,
          visa_type_id,
          order_index,
          notes,
          admin_memo,
          visa_types (
            id,
            name,
            category,
            description,
            average_processing_time,
            requirements
          )
        )
      )
    `)
    .eq("id", params.id)
    .single()

  if (reviewError || !review) {
    console.error("ビザレビューの読み込みエラー:", reviewError)
    redirect("/admin/visa-reviews")
  }

  // 関連するユーザーIDを収集
  const userIds = [
    review.user_id,
    review.admin_id
  ].filter(Boolean)

  // プロファイル情報を一括取得
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  // プロファイル情報をマッピング
  const profileMap = new Map(profiles?.map(profile => [profile.id, profile]))

  // レビュー情報を整形
  const enrichedReview = {
    ...review,
    user: profileMap.get(review.user_id),
    admin: profileMap.get(review.admin_id)
  }

  return <VisaReviewDetail review={enrichedReview} />
}