"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { PlusCircle, Trash, Save, BookOpen, MessageSquare, Calendar, Send, User, Clock, ArrowUpDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface VisaType {
  id: string
  name: string
  category: string
  description: string
  average_processing_time: number
  requirements?: {
    id: string
    description: string
    additional_info?: string
    order_index: number
  }[]
  link?: string
}

interface VisaPlanItem {
  id: string
  visa_type_id: string
  order_index: number
  notes: string
  admin_memo: string | null
  isNew?: boolean
}

interface VisaPlan {
  id: string
  user_id: string
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  visa_plan_items: VisaPlanItem[]
}

interface Comment {
  id: string
  user_id: string
  comment: string
  created_at: string
  user_name?: string
  avatar_url?: string
  is_admin?: boolean
}

interface VisaPlannerAdminProps {
  userId: string
  allVisaTypes: VisaType[]
  existingPlan?: VisaPlan | null
  userName: string
  userAvatar?: string
  adminId: string
  adminName: string
}

export function VisaPlannerAdmin({
  userId,
  allVisaTypes,
  existingPlan,
  userName,
  userAvatar,
  adminId,
  adminName,
}: VisaPlannerAdminProps) {
  const [planName, setPlanName] = useState(existingPlan?.name || `${userName}のビザプラン`)
  const [planDescription, setPlanDescription] = useState(existingPlan?.description || "")
  const [planStatus, setPlanStatus] = useState<"draft" | "reviewing" | "completed">(
    (existingPlan?.status as any) || "draft"
  )
  const [planItems, setPlanItems] = useState<VisaPlanItem[]>(existingPlan?.visa_plan_items || [])
  const [availableVisaTypes, setAvailableVisaTypes] = useState<VisaType[]>([])
  const [selectedVisaType, setSelectedVisaType] = useState<string>("")
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState<string>("")
  const [reviewTitle, setReviewTitle] = useState<string>("")
  const [reviewComment, setReviewComment] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("plan")
  
  const supabase = createClientComponentClient()

  // 利用可能なビザタイプを取得
  useEffect(() => {
    // 既に選択されているビザタイプを除外
    const usedVisaTypeIds = planItems.map(item => item.visa_type_id)
    const available = allVisaTypes.filter(type => !usedVisaTypeIds.includes(type.id))
    setAvailableVisaTypes(available)
  }, [allVisaTypes, planItems])

  // コメントの取得
  useEffect(() => {
    if (existingPlan?.id) {
      fetchComments(existingPlan.id)
    }
  }, [existingPlan])

  const fetchComments = async (planId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from("visa_plan_comments")
        .select(`
          *,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq("plan_id", planId)
        .order("created_at", { ascending: true })

      if (error) throw error

      if (commentsData) {
        const formattedComments = commentsData.map(comment => ({
          id: comment.id,
          user_id: comment.user_id,
          comment: comment.comment,
          created_at: comment.created_at,
          user_name: comment.profiles?.full_name || userName,
          avatar_url: comment.profiles?.avatar_url || userAvatar,
          is_admin: comment.user_id === adminId
        }))
        setComments(formattedComments)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("コメントの取得に失敗しました")
    }
  }

  // ビザタイプの追加
  const handleAddVisaType = () => {
    if (!selectedVisaType) return

    // 新しい順番を取得（最大値 + 1）
    const newOrderIndex = planItems.length > 0
      ? Math.max(...planItems.map(item => item.order_index)) + 1
      : 0

    // 新しいビザプランアイテムを作成
    const newItem: VisaPlanItem = {
      id: `new-${Date.now()}`,
      visa_type_id: selectedVisaType,
      order_index: newOrderIndex,
      notes: "",
      admin_memo: "",
      isNew: true
    }

    setPlanItems([...planItems, newItem])
    setSelectedVisaType("")
  }

  // ビザプランアイテムの削除
  const handleRemoveItem = (itemId: string) => {
    setPlanItems(planItems.filter(item => item.id !== itemId))
  }

  // ビザプランアイテムの更新
  const handleUpdateItem = (itemId: string, field: string, value: string) => {
    setPlanItems(planItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  // ドラッグ&ドロップでの並べ替え
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const items = Array.from(planItems)
    const [removed] = items.splice(source.index, 1)
    items.splice(destination.index, 0, removed)

    // order_index を更新
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index
    }))

    setPlanItems(updatedItems)
  }

  // ビザプランの保存
  const handleSavePlan = async () => {
    setIsLoading(true)
    try {
      let planId = existingPlan?.id

      // 1. プランが存在しない場合は新規作成
      if (!planId) {
        const { data: newPlan, error: planError } = await supabase
          .from("visa_plans")
          .insert({
            user_id: userId,
            name: planName,
            description: planDescription,
            status: planStatus
          })
          .select("id")
          .single()

        if (planError) throw planError
        planId = newPlan.id
      } else {
        // 既存のプランを更新
        const { error: updateError } = await supabase
          .from("visa_plans")
          .update({
            name: planName,
            description: planDescription,
            status: planStatus,
            updated_at: new Date().toISOString()
          })
          .eq("id", planId)

        if (updateError) throw updateError
      }

      // 2. 既存のアイテムを更新、新規アイテムを追加
      for (const item of planItems) {
        if (item.isNew) {
          // 新規アイテムを追加
          const { error: insertError } = await supabase
            .from("visa_plan_items")
            .insert({
              visa_plan_id: planId,
              visa_type_id: item.visa_type_id,
              order_index: item.order_index,
              notes: item.notes || "",
              admin_memo: item.admin_memo || ""
            })

          if (insertError) throw insertError
        } else {
          // 既存アイテムを更新
          const { error: updateError } = await supabase
            .from("visa_plan_items")
            .update({
              order_index: item.order_index,
              notes: item.notes,
              admin_memo: item.admin_memo
            })
            .eq("id", item.id)

          if (updateError) throw updateError
        }
      }

      // 3. 削除されたアイテムを特定して削除
      if (existingPlan?.visa_plan_items) {
        const currentItemIds = planItems
          .filter(item => !item.isNew)
          .map(item => item.id)

        const deletedItemIds = existingPlan.visa_plan_items
          .map(item => item.id)
          .filter(id => !currentItemIds.includes(id))

        if (deletedItemIds.length > 0) {
          const { error: deleteError } = await supabase
            .from("visa_plan_items")
            .delete()
            .in("id", deletedItemIds)

          if (deleteError) throw deleteError
        }
      }

      toast.success("ビザプランを保存しました")
    } catch (error) {
      console.error("Error saving plan:", error)
      toast.error("ビザプランの保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  // レビューコメントの送信
  const handleSubmitReview = async () => {
    if (!existingPlan?.id || !reviewComment.trim()) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("visa_plan_reviews")
        .insert({
          visa_plan_id: existingPlan.id,
          user_id: userId,
          admin_id: adminId,
          status: "completed",
          admin_comments: reviewComment,
          title: reviewTitle || "ビザプランレビュー"
        })
      
      if (error) throw error
      
      // プランのステータスを更新
      await supabase
        .from("visa_plans")
        .update({ status: "reviewing" })
        .eq("id", existingPlan.id)
      
      setPlanStatus("reviewing")
      setReviewComment("")
      setReviewTitle("")
      toast.success("レビューコメントを送信しました")
      setActiveTab("messages")
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("レビューコメントの送信に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  // コメントの送信
  const handleSubmitComment = async () => {
    if (!existingPlan?.id || !newComment.trim()) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("visa_plan_comments")
        .insert({
          plan_id: existingPlan.id,
          user_id: adminId,
          comment: newComment
        })
      
      if (error) throw error
      
      // 新しいコメントをリストに追加
      const newCommentObj: Comment = {
        id: `temp-${Date.now()}`,
        user_id: adminId,
        comment: newComment,
        created_at: new Date().toISOString(),
        user_name: adminName,
        is_admin: true
      }
      
      setComments([...comments, newCommentObj])
      setNewComment("")
      toast.success("コメントを送信しました")
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast.error("コメントの送信に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plan" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="w-full">
          <TabsTrigger value="plan" className="flex-1">ビザプラン編集</TabsTrigger>
          <TabsTrigger value="review" className="flex-1">レビュー作成</TabsTrigger>
          <TabsTrigger value="messages" className="flex-1">
            メッセージ
            {comments.length > 0 && (
              <Badge className="ml-2" variant="secondary">{comments.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ビザプラン編集タブ */}
        <TabsContent value="plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ビザプラン基本情報</CardTitle>
              <CardDescription>
                {userName}さんのビザプランを作成・編集します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">プラン名</label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="ビザプラン名"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">説明</label>
                <Textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="このビザプランの説明を入力してください"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">ステータス</label>
                <Select
                  value={planStatus}
                  onValueChange={(value) => setPlanStatus(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">下書き</SelectItem>
                    <SelectItem value="reviewing">レビュー中</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ビザプラン項目</CardTitle>
              <CardDescription>
                複数のビザを追加し、順序を入れ替えることができます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ビザタイプの追加 */}
              <div className="flex gap-2">
                <Select
                  value={selectedVisaType}
                  onValueChange={setSelectedVisaType}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="追加するビザタイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVisaTypes.length === 0 ? (
                      <SelectItem value="" disabled>
                        追加可能なビザタイプがありません
                      </SelectItem>
                    ) : (
                      availableVisaTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddVisaType} 
                  disabled={!selectedVisaType || isLoading}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  追加
                </Button>
              </div>

              {/* ビザプラン項目リスト */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="visa-plan-items">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {planItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                          ビザタイプを追加してください
                        </div>
                      ) : (
                        planItems
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((item, index) => {
                            const visaType = allVisaTypes.find(type => type.id === item.visa_type_id)
                            if (!visaType) return null
                            
                            return (
                              <Draggable
                                key={item.id}
                                draggableId={item.id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="border rounded-lg p-4 bg-white"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-2">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-move p-1 rounded hover:bg-gray-100"
                                        >
                                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <div>
                                          <h4 className="font-medium">{visaType.name}</h4>
                                          <p className="text-xs text-gray-500">
                                            処理期間: {visaType.average_processing_time}日
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium flex items-center">
                                          <BookOpen className="h-3 w-3 mr-1" />
                                          管理者メモ（ユーザーに表示されます）
                                        </label>
                                        <Textarea
                                          value={item.admin_memo || ""}
                                          onChange={(e) => handleUpdateItem(item.id, "admin_memo", e.target.value)}
                                          placeholder="このビザに関する注意点や詳細情報を記載します"
                                          rows={2}
                                          className="text-sm resize-none"
                                        />
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium flex items-center text-muted-foreground">
                                          <MessageSquare className="h-3 w-3 mr-1" />
                                          ユーザーメモ（ユーザーが編集可能な欄）
                                        </label>
                                        <Textarea
                                          value={item.notes || ""}
                                          onChange={(e) => handleUpdateItem(item.id, "notes", e.target.value)}
                                          placeholder="ユーザーがメモを記入する欄です"
                                          rows={2}
                                          className="text-sm resize-none bg-gray-50"
                                          disabled
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <Button
                className="w-full mt-4"
                onClick={handleSavePlan}
                disabled={isLoading || planItems.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                ビザプランを保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* レビュー作成タブ */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>レビューコメント作成</CardTitle>
              <CardDescription>
                ビザプランに対するレビューコメントを作成し、ユーザーに送信します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">タイトル</label>
                <Input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="レビューのタイトル"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">レビューコメント</label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="ビザプランに対するコメントを入力してください"
                  rows={6}
                />
              </div>
              
              <Button
                className="w-full mt-4"
                onClick={handleSubmitReview}
                disabled={isLoading || !existingPlan?.id || !reviewComment.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                レビューを送信
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* メッセージタブ */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ユーザーとのメッセージ</CardTitle>
              <CardDescription>
                {userName}さんとのメッセージのやり取り
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    まだメッセージはありません
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "flex gap-3",
                          comment.is_admin ? "justify-end" : "justify-start"
                        )}
                      >
                        {!comment.is_admin && (
                          <Avatar className="h-8 w-8">
                            {comment.avatar_url ? (
                              <AvatarImage src={comment.avatar_url} alt={comment.user_name} />
                            ) : (
                              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                        )}
                        
                        <div className="space-y-1 max-w-[75%]">
                          <div className={cn(
                            "rounded-lg p-3",
                            comment.is_admin 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          )}>
                            <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{comment.is_admin ? "あなた" : comment.user_name}</span>
                            <span>
                              {new Date(comment.created_at).toLocaleString("ja-JP", {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                        
                        {comment.is_admin && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png" 
                              alt="Frog Admin"
                              className="scale-75"
                            />
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="メッセージを入力..."
                  rows={3}
                />
                <Button
                  className="w-full"
                  onClick={handleSubmitComment}
                  disabled={isLoading || !existingPlan?.id || !newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  送信
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 