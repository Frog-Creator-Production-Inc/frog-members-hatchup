"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { VisaCard } from "./visa-card"
import { VisaTypeList } from "./visa-type-list"
import { ReviewComments } from "./review-comments"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { notifyNewVisaReview } from "@/lib/slack/notifications"

interface Requirement {
  id: string
  description: string
  additional_info?: string
  order_index: number
}

interface VisaType {
  id: string
  name: string
  category: string
  description: string
  average_processing_time: number
  requirements?: Requirement[]
  link?: string
  order_index?: number
}

interface VisaPlanItem {
  id: string
  visa_type_id: string
  order_index: number
  notes: string
  admin_memo: string | null
}

interface VisaPlan {
  id: string
  name: string
  description: string
  status: string
  visa_plan_items: VisaPlanItem[]
  visa_plan_reviews?: {
    id: string
    status: string
    admin_comments?: string | null
  }[]
}

interface VisaPlannerProps {
  userId: string
  visaTypes: VisaType[]
  initialPlan: VisaPlan | null
  allReviews: {
    admin_comments: string | null
    created_at: string
    status: 'in_review' | 'completed'
  }[]
}

export function VisaPlanner({ userId, visaTypes, initialPlan, allReviews }: VisaPlannerProps) {
  const [selectedVisas, setSelectedVisas] = useState<VisaPlanItem[]>(
    initialPlan?.visa_plan_items || []
  )
  const [planId, setPlanId] = useState<string | null>(initialPlan?.id || null)
  const [planStatus, setPlanStatus] = useState<string>(initialPlan?.status || "draft")
  const [hasExistingReview, setHasExistingReview] = useState(false)
  const [reviewComments, setReviewComments] = useState<string | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
  }, [visaTypes])

  useEffect(() => {
    const checkExistingReview = async () => {
      if (!planId) return

      const { data, error } = await supabase
        .from("visa_plan_reviews")
        .select("id, status, admin_comments")
        .eq("plan_id", planId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        toast.error("レビュー情報の取得に失敗しました")
        return
      }

      if (data) {
        setHasExistingReview(data.status !== "completed")
        if (data.status === "completed" && data.admin_comments) {
          setReviewComments(data.admin_comments)
        }
      }
    }

    checkExistingReview()
  }, [planId, supabase])
  useEffect(() => {
    if (initialPlan?.visa_plan_reviews && initialPlan.visa_plan_reviews.length > 0) {
      const latestReview = initialPlan.visa_plan_reviews[0]
      setHasExistingReview(latestReview.status !== "completed")
      if (latestReview.status === "completed" && latestReview.admin_comments) {
        setReviewComments(latestReview.admin_comments)
      }
    }
  }, [initialPlan])

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(selectedVisas)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }))

    setSelectedVisas(updatedItems)

    if (planId) {
      const { error } = await supabase
        .from("visa_plan_items")
        .upsert(
          updatedItems.map((item) => ({
            ...item,
            plan_id: planId,
          }))
        )

      if (error) {
        toast.error("順序の保存に失敗しました")
      }
    }
  }

  const handleDrop = async (visaTypeId: string) => {
    try {
      let currentPlanId = planId

      if (!currentPlanId) {
        const { data: plan, error: planError } = await supabase
          .from("visa_plans")
          .insert({
            user_id: userId,
            name: "マイビザプラン",
            status: "draft",
          })
          .select()
          .single()

        if (planError) {
          toast.error("プランの作成に失敗しました")
          return
        }

        currentPlanId = plan.id
        setPlanId(currentPlanId)
        setPlanStatus("draft")
      }

      const newItem: VisaPlanItem = {
        id: crypto.randomUUID(),
        visa_type_id: visaTypeId,
        order_index: selectedVisas.length,
        notes: "",
        admin_memo: null
      }

      const { error: itemError } = await supabase
        .from("visa_plan_items")
        .insert({
          ...newItem,
          plan_id: currentPlanId,
        })

      if (itemError) {
        toast.error("ビザの追加に失敗しました")
        return
      }

      setSelectedVisas([...selectedVisas, newItem])
    } catch (error) {
      toast.error("ビザの追加に失敗しました")
    }
  }

  const handleRemoveVisa = async (itemId: string) => {
    if (!planId) return

    const { error } = await supabase
      .from("visa_plan_items")
      .delete()
      .eq("id", itemId)

    if (error) {
      toast.error("ビザの削除に失敗しました")
      return
    }

    setSelectedVisas(selectedVisas.filter((item) => item.id !== itemId))
    toast.success("ビザを削除しました")
  }

  const handleConfirmReview = () => {
    setShowConfirmDialog(true)
  }

  const handleSubmitForReview = async () => {
    setShowConfirmDialog(false)
    
    if (!planId || selectedVisas.length === 0) return

    try {
      const { error: planError } = await supabase
        .from("visa_plans")
        .update({ status: "submitted" })
        .eq("id", planId)

      if (planError) throw planError

      // レビュー申請を作成
      const { data: reviewData, error: reviewError } = await supabase
        .from("visa_plan_reviews")
        .insert({
          plan_id: planId,
          user_id: userId,
          status: "pending",
        })
        .select()
        .single()

      if (reviewError) throw reviewError

      // 通知に必要なユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", userId)
        .single()

      if (!userError && userData && reviewData) {
        // ビザタイプ名を取得
        const selectedVisaTypeIds = selectedVisas.map(v => v.visa_type_id)
        const { data: visaTypeData } = await supabase
          .from("visa_types")
          .select("name")
          .in("id", selectedVisaTypeIds)
        
        const visaTypeNames = visaTypeData ? visaTypeData.map(vt => vt.name).join(", ") : "不明なビザタイプ"
        
        // ユーザー名を取得
        const userName = userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`
          : userData.email || "不明なユーザー"
        
        // Slack通知を送信
        await notifyNewVisaReview(
          reviewData.id,
          userId,
          userName,
          visaTypeNames
        )
      }

      setPlanStatus("submitted")
      setHasExistingReview(true)
      setShowSubmitDialog(true)
    } catch (error) {
      toast.error("レビュー申請に失敗しました")
    }
  }

  const isSubmitDisabled = selectedVisas.length === 0

  // ビザプランアイテムをorder_indexでソート
  const sortedVisas = [...selectedVisas].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card className="bg-white">
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="visa-plan">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[400px] space-y-4 p-4 border-2 border-dashed rounded-lg"
                  >
                    {sortedVisas.map((item, index) => {
                      const visaType = visaTypes.find((type) => type.id === item.visa_type_id)
                      if (!visaType) return null

                      return (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="relative group"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveVisa(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                              <VisaCard
                                visa={visaType}
                                notes={item.notes}
                                adminMemo={item.admin_memo}
                                onNotesChange={async (notes) => {
                                  const updatedItems = selectedVisas.map((v) =>
                                    v.id === item.id ? { ...v, notes } : v
                                  )
                                  setSelectedVisas(updatedItems)

                                  if (planId) {
                                    await supabase
                                      .from("visa_plan_items")
                                      .update({ notes })
                                      .eq("id", item.id)
                                  }
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {selectedVisas.length > 0 && (
              <Button
                className="mt-4 w-full"
                onClick={handleConfirmReview}
                disabled={isSubmitDisabled || hasExistingReview || planStatus === "submitted"}
              >
                {hasExistingReview
                  ? "レビュー申請済み"
                  : planStatus === "submitted"
                  ? "申請済み"
                  : "レビューを申請"}
              </Button>
            )}
          </CardContent>
        </Card>

        {allReviews.map((review, index) => (
          review.admin_comments && (
            <ReviewComments 
              key={index}
              comments={review.admin_comments}
              date={review.created_at} 
              status={review.status}
              title="レビューコメント"
            />
          )
        ))}
      </div>

      <div className="space-y-4">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>利用可能なビザ</CardTitle>
          </CardHeader>
          <CardContent>
            <VisaTypeList 
              visaTypes={visaTypes} 
              onDrop={handleDrop}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>レビュー申請を受け付けました</DialogTitle>
            <DialogDescription>
              レビューには数日頂く場合がございます。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSubmitDialog(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>本当にレビュー申請をしても良いですか？</DialogTitle>
            <DialogDescription>
              申請後もプランの編集は可能です。あなたのユーザー情報を元にビザコンサルタントによるレビューが開始されます。
              内容をよく確認してから申請してください。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSubmitForReview}
            >
              申請する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}