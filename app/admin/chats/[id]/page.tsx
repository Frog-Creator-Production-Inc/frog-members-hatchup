"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import AdminChatDetail from "./components/admin-chat-detail"
import { markChatAsRead } from "@/lib/chat"
import { ChatSession } from "@/types/chat"
import { toast } from "react-hot-toast"

export const dynamic = "force-dynamic"

export default function AdminChatDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const fetchChatSession = async () => {
      try {
        const { data: session, error } = await supabase
          .from("chat_sessions")
          .select(`
            *,
            user:user_id (
              id,
              email,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq("id", params.id)
          .single()

        if (error) throw error

        if (session) {
          setChatSession(session as ChatSession)
          // 詳細画面を開いたときに既読にする
          if (session.status === 'unread') {
            console.log('Chat was unread, marking as read')
            await markChatAsRead(params.id)
          }
        }
      } catch (error) {
        console.error("Error:", error)
        toast.error("エラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    fetchChatSession()
  }, [params.id, supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!chatSession) {
    return (
      <div className="p-4 text-center">
        <p>チャットセッションが見つかりません</p>
        <button
          onClick={() => router.push("/admin/chats")}
          className="mt-4 text-blue-500 hover:underline"
        >
          一覧に戻る
        </button>
      </div>
    )
  }

  return <AdminChatDetail session={chatSession} />
}