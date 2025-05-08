"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { Clock, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

interface VisaType {
  id: string
  name: string
  category: string
  description: string
  average_processing_time: number
  requirements: any
}

interface VisaPlanItem {
  id: string
  visa_type_id: string
  order_index: number
  notes: string
  admin_memo: string | null
  visa_types: VisaType
}

interface VisaPlan {
  id: string
  name: string
  description: string
  visa_plan_items: VisaPlanItem[]
}

interface Review {
  id: string
  plan_id: string
  user_id: string
  admin_id: string | null
  status: string
  admin_comments: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  title: string | null
  visa_plans: VisaPlan
  user: Profile
  admin: Profile | null
}

interface Props {
  review: Review
}

export function VisaReviewDetail({ review }: Props) {
  const [status, setStatus] = useState(review.status)
  const [title, setTitle] = useState(review.title || "")
  const [adminComments, setAdminComments] = useState(review.admin_comments || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [adminMemos, setAdminMemos] = useState<{ [id: string]: string }>(() => {
    const memosObj: { [id: string]: string } = {}
    review.visa_plans.visa_plan_items.forEach(item => {
      memosObj[item.id] = item.admin_memo || ""
    })
    return memosObj
  })
  const [updatingMemo, setUpdatingMemo] = useState<{ [id: string]: boolean }>({})
  const supabase = createClientComponentClient()

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === "completed" && !title.trim()) {
      toast.error("タイトルを入力してください")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("visa_plan_reviews")
        .update({
          status: newStatus,
          admin_comments: adminComments,
          title,
          updated_at: new Date().toISOString(),
          ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {})
        })
        .eq("id", review.id)

      if (error) throw error
      setStatus(newStatus)
      toast.success("レビューステータスを更新しました")
    } catch (error) {
      toast.error("ステータスの更新に失敗しました")
      console.error("Error updating status:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAdminMemoUpdate = async (itemId: string) => {
    setUpdatingMemo(prev => ({ ...prev, [itemId]: true }))
    try {
      const { error } = await supabase
        .from("visa_plan_items")
        .update({ admin_memo: adminMemos[itemId] })
        .eq("id", itemId)

      if (error) throw error
      toast.success("管理者メモを更新しました")
    } catch (error) {
      toast.error("管理者メモの更新に失敗しました")
      console.error("Error updating admin memo:", error)
    } finally {
      setUpdatingMemo(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">レビュー待ち</Badge>
      case "in_review":
        return <Badge variant="default">レビュー中</Badge>
      case "completed":
        return <Badge variant="outline">完了</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* プラン概要 */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{review.visa_plans.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                申請者: {review.user?.first_name && review.user?.last_name
                  ? `${review.user.first_name} ${review.user.last_name}`
                  : review.user?.email || "不明なユーザー"}
              </p>
            </div>
            {getStatusBadge(status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                申請日時: {formatDate(review.created_at)}
              </p>
              {review.visa_plans.description && (
                <p className="mt-2 text-sm">{review.visa_plans.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ビザプランの詳細 */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>ビザプラン詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {review.visa_plans.visa_plan_items
              .sort((a, b) => a.order_index - b.order_index)
              .map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.visa_types.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{item.visa_types.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>処理期間: {item.visa_types.average_processing_time}日</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>必要書類: {Object.keys(item.visa_types.requirements || {}).length}点</span>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-medium mb-2">申請者メモ</h4>
                          <p className="text-sm">{item.notes}</p>
                        </div>
                      )}
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">管理者メモ</h4>
                        <Textarea
                          value={adminMemos[item.id] || ""}
                          onChange={(e) =>
                            setAdminMemos((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="管理者としての追記を入力してください"
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            onClick={() => handleAdminMemoUpdate(item.id)}
                            disabled={updatingMemo[item.id]}
                            size="sm"
                          >
                            {updatingMemo[item.id] ? "更新中..." : "更新"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* レビューアクション */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>レビューコメント</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                placeholder="レビューのタイトルを入力..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="comments">コメント</Label>
              <Textarea
                id="comments"
                placeholder="レビューコメントを入力..."
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex gap-2">
              {status === "pending" && (
                <Button
                  onClick={() => handleStatusUpdate("in_review")}
                  disabled={isSubmitting}
                >
                  レビュー開始
                </Button>
              )}
              {status === "in_review" && (
                <Button
                  onClick={() => handleStatusUpdate("completed")}
                  disabled={isSubmitting || !adminComments.trim() || !title.trim()}
                >
                  レビュー完了
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
