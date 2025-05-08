"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { cn } from "@/lib/utils"
import { MessageSquare, Send, User, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}

interface VisaPlan {
  id: string
  name: string
  description: string
  user_id: string
  status: string
  created_at: string
  updated_at: string
  profiles: Profile
}

interface Message {
  id: string
  plan_id: string
  user_id: string
  admin_id: string | null
  status: 'pending' | 'in_review' | 'completed'
  title: string | null
  comment: string | null
  admin_comment: string | null
  created_at: string
  updated_at: string | null
  user_profile: Profile
  admin_profile: Profile | null
}

interface VisaPlanMessagesProps {
  plan: VisaPlan
  messages: Message[]
  adminProfile: Profile
}

export function VisaPlanMessages({ plan, messages, adminProfile }: VisaPlanMessagesProps) {
  const [reply, setReply] = useState("")
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  // ユーザー名を表示用に整形する関数
  const getUserDisplayName = (profile: Profile) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    return profile?.email || "不明なユーザー"
  }

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch (e) {
      return dateString
    }
  }

  // メッセージに返信する
  const handleReply = async () => {
    if (!selectedMessageId || !reply.trim()) return;
    
    setIsSubmitting(true);
    try {
      // API経由でビザプランレビューを更新
      const response = await fetch('/api/visa-plan-reviews/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review_id: selectedMessageId,
          admin_id_input: adminProfile.id,
          admin_comment_input: reply,
          status_input: "completed",
          completed_at_input: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '返信の送信に失敗しました');
      }
      
      // 状態を更新
      setReply('');
      setSelectedMessageId(null);
      toast.success('返信を送信しました！');
      
      // 最新データを表示するためにページをリロード
      window.location.reload();
    } catch (error: any) {
      console.error('Error replying to message:', error);
      toast.error(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/visa-plan-messages" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
        <h1 className="text-2xl font-bold flex-1">ビザプランメッセージ</h1>
      </div>
      
      {/* プラン概要 */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                ユーザー: {getUserDisplayName(plan.profiles)}
              </CardDescription>
            </div>
            <Badge variant={
              plan.status === "draft" ? "secondary" : 
              plan.status === "submitted" ? "outline" : "default"
            }>
              {plan.status === "draft" ? "下書き" : 
               plan.status === "submitted" ? "提出済み" : "レビュー済み"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </CardContent>
      </Card>
      
      {/* メッセージリスト */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            メッセージ履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              メッセージはありません
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="border rounded-lg overflow-hidden">
                  {/* メッセージヘッダー */}
                  <div className="bg-gray-50 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{message.title || "質問"}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* ユーザーの質問 */}
                  <div className="p-4 bg-primary/5">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8">
                        {message.user_profile?.avatar_url ? (
                          <img 
                            src={message.user_profile.avatar_url} 
                            alt={getUserDisplayName(message.user_profile)} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {getUserDisplayName(message.user_profile)}
                        </p>
                        <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">
                          {message.comment || message.title || "質問があります"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 管理者からの返信 */}
                  {message.admin_comment ? (
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
                            {message.admin_profile ? getUserDisplayName(message.admin_profile) : "管理者"}
                          </p>
                          <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">
                            {message.admin_comment}
                          </p>
                          {message.updated_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(message.updated_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-t">
                      {selectedMessageId === message.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="返信を入力してください..."
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedMessageId(null)
                                setReply("")
                              }}
                            >
                              キャンセル
                            </Button>
                            <Button 
                              onClick={handleReply}
                              disabled={!reply.trim() || isSubmitting}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              返信する
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedMessageId(message.id)}
                          className="w-full"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          返信する
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* ステータス表示 */}
                  <div className="bg-gray-50 p-2 border-t text-xs text-right">
                    <span 
                      className={cn(
                        "inline-block px-2 py-0.5 rounded", 
                        message.status === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      )}
                    >
                      {message.status === "completed" ? "回答済み" : "対応中"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 