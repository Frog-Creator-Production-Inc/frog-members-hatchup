"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ReadOnlyVisaCard } from "./read-only-visa-card"
import { InfoIcon, MessageSquare, Send, UserCircle2, Calendar, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { notifyNewVisaPlanMessage } from "@/lib/slack/notifications"

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

interface VisaPlanReview {
  id: string
  plan_id: string
  user_id: string
  admin_id?: string | null
  status: 'in_review' | 'completed'
  title: string | null
  comment?: string | null
  admin_comment?: string | null
  created_at: string
  updated_at?: string
}

interface VisaPlan {
  id: string
  name: string
  description: string
  status: string
  visa_plan_items: VisaPlanItem[]
  visa_plan_reviews?: VisaPlanReview[]
  updated_at?: string
}

interface ReadOnlyVisaPlannerProps {
  userId: string
  visaTypes: VisaType[]
  initialPlan: VisaPlan | null
  allReviews: {
    id: string
    admin_comment: string | null
    comment?: string | null
    title?: string | null
    created_at: string
    status: 'in_review' | 'completed'
  }[]
  profile: any
}

export function ReadOnlyVisaPlanner({ 
  userId, 
  visaTypes, 
  initialPlan, 
  allReviews,
  profile 
}: ReadOnlyVisaPlannerProps) {
  const [selectedVisas, setSelectedVisas] = useState<VisaPlanItem[]>(
    initialPlan?.visa_plan_items || []
  )
  const [planId, setPlanId] = useState<string | null>(initialPlan?.id || null)
  const [planStatus, setPlanStatus] = useState<string>(initialPlan?.status || "draft")
  const [newQuestionTitle, setNewQuestionTitle] = useState<string>("")
  const [newQuestionContent, setNewQuestionContent] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [reviews, setReviews] = useState<VisaPlanReview[]>(
    initialPlan?.visa_plan_reviews || []
  )
  const [hasInReviewMessage, setHasInReviewMessage] = useState<boolean>(
    initialPlan?.visa_plan_reviews?.some(review => review.status === 'in_review') || false
  )
  const supabase = createClientComponentClient()

  // ビザタイプをソート
  const sortedVisas = [...selectedVisas].sort((a, b) => a.order_index - b.order_index)

  // レビュー（メッセージ）を取得
  useEffect(() => {
    if (planId) {
      fetchReviews()
    }
  }, [planId])

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("visa_plan_reviews")
        .select("*")
        .eq("plan_id", planId)
        .order("created_at", { ascending: true })

      if (error) throw error

      if (data) {
        setReviews(data)
        setHasInReviewMessage(data.some(review => review.status === 'in_review'))
      }
    } catch (error) {
      toast.error("レビュー情報の取得に失敗しました")
    }
  }

  // 新しい質問（レビュー）を送信
  const handleSubmitQuestion = async () => {
    if (hasInReviewMessage) {
      toast.error("対応中のメッセージがあります。回答をお待ちください。")
      return
    }
    
    if (!newQuestionTitle.trim() || !newQuestionContent.trim() || !planId) return
    
    setIsSubmitting(true)
    
    try {
      const { data, error } = await supabase
        .from("visa_plan_reviews")
        .insert({
          plan_id: planId,
          user_id: userId,
          status: "in_review",
          title: newQuestionTitle,
          comment: newQuestionContent,
          admin_comment: null,
          created_at: new Date().toISOString()
        })
        .select()
        
      if (error) throw error
      
      // 新しいレビューをリストに追加
      if (data && data.length > 0) {
        const newReviews = [...reviews, data[0]]
        setReviews(newReviews)
        setHasInReviewMessage(true)
        
        // 新しいメッセージが送信されたらSlack通知を送信
        try {
          // ユーザー情報を取得
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("email, first_name, last_name")
            .eq("id", userId)
            .single()
          
          if (!userError && userData) {
            const userName = userData.first_name && userData.last_name 
              ? `${userData.first_name} ${userData.last_name}`
              : userData.email || userId;
              
            // サーバーサイドかクライアントサイドかで処理を分ける
            const isServerSide = typeof window === 'undefined';
            
            if (isServerSide) {
              // サーバーサイドでの実行（ほぼ発生しない）
              void notifyNewVisaPlanMessage(
                data[0].id,
                planId,
                userId,
                userName,
                newQuestionTitle,
                newQuestionContent
              ).catch(() => {/* エラーは黙って処理 */});
            } else {
              // クライアントサイドからAPIを呼び出し（非同期で実行）
              // 実質的にはほとんどこのパスが実行される
              const baseUrl = window.location.origin;
              
              // 非同期で通知APIを呼び出す（結果を待たない）
              fetch(`${baseUrl}/api/slack/notify-visa-message`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messageId: data[0].id,
                  planId: planId,
                  userId,
                  userName,
                  title: newQuestionTitle,
                  content: newQuestionContent
                })
              }).catch(() => {
                // エラーがあっても機能には影響しないように静かに失敗
              });
            }
          }
        } catch (notifyError) {
          // 通知エラーはユーザー体験に影響を与えないようにする
        }
      }
      
      setNewQuestionTitle("")
      setNewQuestionContent("")
      toast.success("質問を送信しました")
      
      // ビザプランのステータスが更新されたかの確認と同期
      await supabase
        .from("visa_plans")
        .select("status")
        .eq("id", planId)
        .single()
        .then(({ data }) => {
          if (data) {
            setPlanStatus(data.status)
          }
        })
        
    } catch (error) {
      toast.error("質問の送信に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ビザプランが存在しない場合のメッセージ
  if (!initialPlan) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>ビザプランがまだ作成されていません</AlertTitle>
            <AlertDescription>
              カレッジのコースが決まりましたね！ビザ担当者がビザプランを作成中です。
              もうしばらくお待ちください。ビザプランが作成されると、ここに表示されます。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="space-y-8">
      {/* ビザプラン表示セクション */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            {initialPlan.name}
          </CardTitle>
          {initialPlan.description && (
            <p className="text-sm text-gray-600 mt-1">
              {initialPlan.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>最終更新: {initialPlan.updated_at ? formatDate(initialPlan.updated_at) : '---'}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedVisas.length > 0 ? (
              <div className="space-y-6">
                {sortedVisas.map((item, index) => {
                  const visaType = visaTypes.find((type) => type.id === item.visa_type_id)
                  if (!visaType) return null

                  return (
                    <div key={item.id} className="relative">
                      <ReadOnlyVisaCard
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
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                ビザ担当者がビザプランを作成中です。しばらくお待ちください。
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 質問・回答セクション */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5 text-primary" />
            ビザ担当者とのメッセージ
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6 max-h-[400px] overflow-y-auto p-2 mb-4">
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg overflow-hidden">
                    {/* 質問タイトルヘッダー */}
                    <div className="bg-gray-50 p-3 border-b">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{review.title || "質問"}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 質問内容 */}
                    <div className="p-4 bg-primary/5">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt={profile?.full_name || "あなた"} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserCircle2 className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {profile?.full_name || "あなた"}
                          </p>
                          <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">
                            {review.comment || review.title || "質問があります"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* ビザ担当者からの返信 */}
                    {review.admin_comment && (
                      <div className="p-4 border-t">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                              <img 
                                src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png" 
                                alt="Frog Admin" 
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              ビザ担当者
                            </p>
                            <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">
                              {review.admin_comment}
                            </p>
                            {review.updated_at && (
                              <p className="text-xs text-gray-500 mt-2">
                                {formatDate(review.updated_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* ステータス表示 */}
                    <div className="bg-gray-50 p-2 border-t text-xs text-right">
                      <span 
                        className={cn(
                          "inline-block px-2 py-0.5 rounded", 
                          review.status === "completed" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {review.status === "completed" ? "回答済み" : "対応中"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                まだメッセージのやり取りはありません。質問や相談があれば、
                下記フォームから送信してください。
              </div>
            )}
          </div>
          
          <Separator className="mb-4" />
          
          {hasInReviewMessage ? (
            <Alert className="bg-amber-50 border-amber-200 mb-4">
              <AlertTitle className="text-amber-800 flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                対応中のメッセージがあります
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                現在、ビザ担当者が対応中のメッセージがあります。回答があるまで新しいメッセージを送信できません。
                もうしばらくお待ちください。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">タイトル</label>
                <Input
                  placeholder="質問のタイトル"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  className="mt-1"
                  disabled={hasInReviewMessage}
                />
              </div>
              <div>
                <label className="text-sm font-medium">質問内容</label>
                <Textarea
                  placeholder="ビザプランについての質問や要望をお書きください..."
                  value={newQuestionContent}
                  onChange={(e) => setNewQuestionContent(e.target.value)}
                  className="min-h-[100px] mt-1"
                  disabled={hasInReviewMessage}
                />
              </div>
              <Button 
                onClick={handleSubmitQuestion} 
                disabled={hasInReviewMessage || !newQuestionTitle.trim() || !newQuestionContent.trim() || isSubmitting}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                質問を送信
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 