import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function AdminVisaPlanMessagesPage() {
  const supabase = createServerComponentClient({ cookies })

  // ビザプランを取得
  const { data: plans, error } = await supabase
    .from("visa_plans")
    .select(`
      *,
      profiles:user_id(
        email,
        first_name,
        last_name
      ),
      reviewsCount:visa_plan_reviews(count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching visa plans:", error)
    return <div>ビザプランの取得中にエラーが発生しました。</div>
  }

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

  // 各プランのレビュー数を取得
  const enrichedPlans = plans.map(plan => ({
    ...plan,
    messageCount: plan.reviewsCount[0]?.count || 0
  }))

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ビザプランメッセージ管理</h1>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>プラン名</TableHead>
              <TableHead>ユーザー</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>メッセージ数</TableHead>
              <TableHead>最終更新日</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  ビザプランがありません
                </TableCell>
              </TableRow>
            ) : (
              enrichedPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {getUserDisplayName(plan.profiles)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell>
                    {plan.messageCount > 0 ? (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {plan.messageCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(plan.updated_at)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/visa-plan-messages/${plan.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        表示
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