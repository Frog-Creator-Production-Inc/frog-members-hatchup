"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ChatSession } from "@/types/chat"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

// チャットセッションの型定義
interface ChatSessionRecord {
  id: string
  status: string
  user_id: string
  created_at: string
  updated_at: string
  [key: string]: any
}

export default function AdminChatsPage() {
  const [unreadSessions, setUnreadSessions] = useState<string[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        // チャットセッション一覧を取得
        const { data: sessions, error } = await supabase
          .from("chat_sessions")
          .select(`
            id,
            user_id,
            status,
            created_at,
            updated_at
          `)
          .order("updated_at", { ascending: false })
        if (error) throw error
        
        // ユーザー情報を個別に取得
        const sessionsWithUsers = await Promise.all(
          sessions.map(async (session) => {
            // ユーザー情報を取得
            const { data: userData, error: userError } = await supabase
              .from("profiles")
              .select("id, email, first_name, last_name, avatar_url")
              .eq("id", session.user_id)
              .single()
            
            if (userError) {
              console.error("Error fetching user data:", userError)
              return {
                ...session,
                user: {
                  id: session.user_id,
                  email: "不明なメールアドレス",
                  first_name: null,
                  last_name: null,
                  avatar_url: null
                }
              }
            }
            
            return {
              ...session,
              user: userData
            }
          })
        )
        
        setChatSessions(sessionsWithUsers || [])

        // 未読セッションを取得
        const { data: unreadData, error: unreadError } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('status', 'unread')

        if (unreadError) throw unreadError
        setUnreadSessions(unreadData.map(session => session.id))
      } catch (error) {
        console.error("Error fetching chat sessions:", error)
        toast.error("チャットセッションの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchChatSessions()

    // チャットセッションの更新を監視
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATEの両方を監視
          schema: 'public',
          table: 'chat_sessions',
        },
        async (payload: RealtimePostgresChangesPayload<ChatSessionRecord>) => {
          try {
            // payloadの検証
            if (!payload.new) {
              console.error("Invalid payload received:", payload)
              return
            }

            // TypeScriptの型ガードを使用
            const newRecord = payload.new as ChatSessionRecord
            const sessionId = newRecord.id
            
            if (!sessionId) {
              console.error("Session ID not found in payload:", payload)
              return
            }

            // 最新のメッセージの送信者を確認
            const { data: lastMessage, error: lastMessageError } = await supabase
              .from('messages')
              .select('sender_id')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            if (lastMessageError) {
              console.error("Error fetching last message:", lastMessageError)
              return
            }

            if (lastMessage && lastMessage.sender_id) {
              // 送信者が管理者かどうかをチェック
              const { data: adminRole, error: adminError } = await supabase
                .from('admin_roles')
                .select('id')
                .eq('user_id', lastMessage.sender_id)
                .single()

              if (adminError && adminError.code !== 'PGRST116') {
                // PGRST116はレコードが見つからないエラー
                console.error("Error checking admin role:", adminError)
                return
              }

              // 管理者でない場合のみ通知を表示
              if (!adminRole && newRecord.status === 'unread') {
                toast.success('新しいメッセージがあります')
              }
            }
            
            // 一覧を再取得
            fetchChatSessions()
          } catch (error) {
            console.error("Error processing realtime update:", error)
          }
        }
      )
      .subscribe()

    // クリーンアップ関数
    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">チャット一覧</h1>
      <div className="grid gap-4">
        {chatSessions.map((session) => (
          <Card key={session.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-semibold">
                  {session.user?.first_name || session.user?.last_name
                    ? `${session.user.first_name || ""} ${session.user.last_name || ""}`.trim()
                    : session.user?.email || "不明なユーザー"}
                </h3>
                <p className="text-xs text-gray-400">
                  最終更新: {new Date(session.updated_at).toLocaleString("ja-JP")}
                </p>
                <p className="text-xs text-gray-400">
                  作成日時: {new Date(session.created_at).toLocaleString("ja-JP")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    unreadSessions.includes(session.id)
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {unreadSessions.includes(session.id) ? "未読" : "既読"}
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/chats/${session.id}`}>詳細</Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {chatSessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            チャットセッションがありません
          </div>
        )}
      </div>
    </div>
  )
}