import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, User, Plus, Edit, MessageSquare } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function AdminVisaReviewsPage() {
  const supabase = createServerComponentClient({ cookies })

  // ユーザープロフィールを取得
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error("プロフィールの読み込みエラー:", profilesError)
    return <div>ユーザー情報の読み込みに失敗しました</div>
  }

  // ビザプランを取得
  const { data: plans, error } = await supabase
    .from("visa_plans")
    .select(`
      *,
      profiles:user_id(
        email,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching visa plans:", error)
    return <div>ビザプランの取得中にエラーが発生しました。</div>
  }

  // ビザレビューを取得
  const { data: reviews, error: reviewsError } = await supabase
    .from("visa_plan_reviews")
    .select("id, plan_id, status, created_at")
    .order("created_at", { ascending: false })

  if (reviewsError) {
    console.error("Error fetching visa reviews:", reviewsError)
  }

  // プランIDごとのレビュー数をカウント
  const reviewCountByPlan = reviews?.reduce((acc, review) => {
    if (!acc[review.plan_id]) {
      acc[review.plan_id] = 0
    }
    acc[review.plan_id]++
    return acc
  }, {} as Record<string, number>) || {}

  // ユーザー名を表示用に整形する関数
  const getUserDisplayName = (profile: any) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    return profile?.email || "不明なユーザー"
  }

  // ステータスに応じたバッジの色を返す
  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "draft" ? "secondary" : 
              status === "submitted" ? "outline" : "default"}>
        {status === "draft" ? "下書き" : 
         status === "submitted" ? "提出済み" : "レビュー済み"}
      </Badge>
    )
  }

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ビザプラン管理</h1>
        <Link href="/admin/visa-reviews/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>プラン名</TableHead>
              <TableHead>ユーザー</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>更新日</TableHead>
              <TableHead>レビュー</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  ビザプランがありません
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{getUserDisplayName(plan.profiles)}</TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell>{formatDate(plan.created_at)}</TableCell>
                  <TableCell>{formatDate(plan.updated_at)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/visa-plan-messages/${plan.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        {reviewCountByPlan[plan.id] ? 
                          <Badge variant="secondary" className="ml-1">{reviewCountByPlan[plan.id]}</Badge> : 
                          "メッセージ"
                        }
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/visa-reviews/${plan.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}