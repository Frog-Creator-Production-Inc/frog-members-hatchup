"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getChatMessages, sendMessage, subscribeToMessages, markChatAsActive, closeChatSession } from "@/lib/chat"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createRealtimeClient, createNoCacheClient } from "@/lib/supabase-client"
import Image from "next/image"
import { Send } from "lucide-react"
import { toast } from "react-hot-toast"
import { ChatSession, ChatMessage } from "@/types/chat"
import type { Database } from "@/types/supabase"

// グローバルな型定義を使用するため、ローカルのインターフェースを削除
// interface ChatSession {
//   id: string
//   user_id: string
//   status: string
//   created_at: string
//   updated_at: string
//   user: {
//     id: string
//     email: string
//     first_name?: string
//     last_name?: string
//     avatar_url?: string
//   }
// }

// ChatMessage型を拡張
interface Message {
  id: string
  content: string
  created_at: string
  session_id: string
  sender_id: string
  sender?: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

export default function AdminChatDetail({ session }: { session: ChatSession }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isClosed, setIsClosed] = useState(session.status === "closed")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient<Database>()

  // 入力フィールドにフォーカスを設定する関数
  const focusInputField = () => {
    if (!isClosed && !loading && inputRef.current) {
      inputRef.current.focus()
    }
  }

  // コンポーネントのマウント時に入力フィールドにフォーカスを設定
  useEffect(() => {
    // ローディングが完了したらフォーカスを設定
    if (!loading && !isClosed) {
      // 少し遅延させてDOMの更新を待つ
      setTimeout(focusInputField, 300)
    }
  }, [loading, isClosed])

  // ウィンドウがフォーカスを受け取ったときに入力フィールドにフォーカスを設定
  useEffect(() => {
    const handleWindowFocus = () => {
      focusInputField()
    }

    // イベントリスナーを追加
    window.addEventListener('focus', handleWindowFocus)

    // クリーンアップ関数
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isClosed, loading])

  useEffect(() => {
    loadMessages()
    
    // リアルタイム更新の購読
    let subscription: any = null;
    let sessionChannel: any = null;
    
    try {
      console.log(`管理者画面: セッションID ${session.id} のメッセージ購読を開始します`)
      
      // リアルタイム更新用の特別な設定でSupabaseクライアントを作成
      const realtimeSupabase = createRealtimeClient()
      
      // メッセージチャンネルの購読
      subscription = subscribeToMessages(session.id, (payload) => {
        console.log("管理者画面: 新しいメッセージを受信:", payload)
        
        // イベントタイプに応じた処理
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as Message
          console.log("管理者画面: 新しいメッセージを処理:", newMsg.id, "送信者:", newMsg.sender_id)
          
          setMessages((prevMessages) => {
            // 既に同じIDのメッセージがある場合は追加しない
            if (prevMessages.some(msg => msg.id === newMsg.id)) {
              console.log("管理者画面: 重複メッセージをスキップ:", newMsg.id)
              return prevMessages
            }
            
            // 一時メッセージがある場合は置き換える
            // 内容と送信者IDで一致を確認
            const tempMessages = prevMessages.filter(
              msg => msg.id.startsWith('temp-') && 
                    msg.content === newMsg.content && 
                    msg.sender_id === newMsg.sender_id
            )
            
            if (tempMessages.length > 0) {
              console.log("管理者画面: 一時メッセージを置き換え:", {
                tempId: tempMessages[0].id,
                newId: newMsg.id,
                content: newMsg.content
              })
              
              return prevMessages.map(msg => 
                (msg.id.startsWith('temp-') && 
                 msg.content === newMsg.content && 
                 msg.sender_id === newMsg.sender_id)
                  ? { ...newMsg, sender: msg.sender }
                  : msg
              )
            }
            
            // 新しいメッセージを追加
            console.log("管理者画面: 新しいメッセージを追加:", newMsg.id)
            const newMessages = [...prevMessages, newMsg]
            setTimeout(scrollToBottom, 0)
            return newMessages
          })
        } else if (payload.eventType === 'UPDATE') {
          // メッセージ更新の処理
          const updatedMsg = payload.new as Message
          console.log("管理者画面: メッセージ更新を受信:", updatedMsg.id)
          
          setMessages((prevMessages) => {
            return prevMessages.map(msg => 
              msg.id === updatedMsg.id ? updatedMsg : msg
            )
          })
        }
      })
      
      // セッションのステータス変更も監視（ユニークなチャンネル名を使用）
      const sessionChannelName = `admin-session:${session.id}:${Date.now()}`
      console.log(`管理者画面: セッションチャンネル名: ${sessionChannelName} で購読を開始します`)
      
      sessionChannel = realtimeSupabase
        .channel(sessionChannelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_sessions',
            filter: `id=eq.${session.id}`
          },
          (payload) => {
            console.log("管理者画面: セッションステータス更新:", payload.new)
            if (payload.new.status === "closed") {
              setIsClosed(true)
            }
          }
        )
        .subscribe((status) => {
          console.log(`管理者画面: セッションチャンネル購読ステータス: ${status}`)
          if (status === 'SUBSCRIBED') {
            console.log('管理者画面: セッションチャンネルが正常に確立されました！')
          }
        })
      
      console.log("管理者画面: リアルタイム購読が正常に開始されました")
    } catch (error) {
      console.error("管理者画面: リアルタイム購読エラー:", error)
    }

    // セッションをアクティブに設定
    markChatAsActive(session.id)
      .then(() => console.log("セッションをアクティブに設定しました"))
      .catch(err => console.error("セッションのステータス更新エラー:", err))

    return () => {
      if (subscription) {
        try {
          console.log("管理者画面: メッセージ購読を解除します")
          subscription.unsubscribe()
        } catch (error) {
          console.error("管理者画面: 購読解除エラー:", error)
        }
      }
      
      if (sessionChannel) {
        try {
          console.log("管理者画面: セッションチャンネル購読を解除します")
          sessionChannel.unsubscribe()
        } catch (error) {
          console.error("管理者画面: セッション購読解除エラー:", error)
        }
      }
    }
  }, [session.id])

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messages, loading])

  const loadMessages = async () => {
    setLoading(true)
    try {
      console.log(`管理者画面: セッションID ${session.id} のメッセージを読み込み中...`)
      
      // キャッシュを無効化した特別なクライアントを作成
      const noCacheSupabase = createNoCacheClient()
      
      // 最新のメッセージを取得
      const { data: messages, error } = await noCacheSupabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            email,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('session_id', session.id)
        .order('created_at')
      
      if (error) {
        console.error("管理者画面: メッセージ取得エラー:", error)
        throw error
      }
      
      console.log(`管理者画面: ${messages.length}件のメッセージを読み込みました`)
      setMessages(messages)
    } catch (error) {
      console.error("管理者画面: メッセージ読み込みエラー:", error)
      toast.error("メッセージの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    
    // 一時メッセージID
    const tempId = `temp-${Date.now()}`
    const messageContent = newMessage.trim()
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("ユーザー情報の取得に失敗しました")
      }

      // 一時メッセージをUIに表示（楽観的UI更新）
      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        session_id: session.id
      }
      
      // 入力フィールドをクリア
      setNewMessage("")
      
      // UIに一時メッセージを表示
      setMessages(prev => [...prev, tempMessage])
      console.log("管理者画面: 一時メッセージを追加:", tempId)

      // メッセージを送信（キャッシュを無効化した特別なクライアントを使用）
      console.log(`管理者画面: セッションID ${session.id} にメッセージを送信します`)
      
      // リアルタイム更新用の特別な設定でSupabaseクライアントを作成
      const noCacheSupabase = createNoCacheClient()
      
      const result = await sendMessage(session.id, messageContent, user.id)
      console.log("管理者画面: メッセージ送信結果:", result)
      
      // 送信完了後、一時メッセージを確実に置き換える
      if (result && result.length > 0) {
        const sentMessage = result[0]
        console.log("管理者画面: 送信されたメッセージ:", sentMessage)
        
        // 一時メッセージを永続的なメッセージに置き換え
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...sentMessage, sender: msg.sender } : msg
          )
        )
        
        // 明示的なメッセージの再読み込みを削除
        // setTimeout(() => {
        //   loadMessages()
        // }, 500)
      }
      
      scrollToBottom()
      
      // 入力フィールドにフォーカスを戻す
      setTimeout(() => {
        focusInputField()
      }, 100)
    } catch (error) {
      console.error("管理者画面: メッセージ送信エラー:", error)
      toast.error("メッセージの送信に失敗しました")
      
      // エラーが発生した場合は一時メッセージを削除
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      // 入力フィールドに戻す
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const getUserName = (message: Message) => {
    if (message.sender_id === session.user_id) {
      return session.user.first_name && session.user.last_name
        ? `${session.user.first_name} ${session.user.last_name}`
        : session.user.email
    }
    return "サポート"
  }

  const isUserMessage = (message: Message) => {
    return message.sender_id === session.user_id
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  // チャットセッションを終了する
  const handleCloseSession = async () => {
    if (window.confirm("このチャットセッションを終了しますか？終了後はユーザーとのやり取りができなくなります。")) {
      try {
        await closeChatSession(session.id)
        toast.success("チャットセッションを終了しました")
        setIsClosed(true)
        
        // 最新のメッセージを再読み込みしない
        // loadMessages()
      } catch (error) {
        console.error("チャットセッション終了エラー:", error)
        toast.error("チャットセッションの終了に失敗しました")
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="font-semibold">
            {session.user.first_name && session.user.last_name
              ? `${session.user.first_name} ${session.user.last_name}`
              : session.user.email}
          </h2>
          <p className="text-xs text-gray-500">
            {new Date(session.created_at).toLocaleString("ja-JP")}
          </p>
        </div>
        <Button 
          onClick={handleCloseSession} 
          variant="destructive" 
          size="sm"
          disabled={isClosed}
        >
          {isClosed ? "終了済み" : "チャットを終了"}
        </Button>
      </div>

      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onClick={focusInputField}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            メッセージはまだありません
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isUserMessage(message) ? "justify-start" : "justify-end"}`}
            >
              <div className="flex gap-2 max-w-[80%]">
                {isUserMessage(message) && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {session.user.avatar_url ? (
                      <Image
                        src={session.user.avatar_url}
                        alt="User Avatar"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-medium">
                        {session.user.first_name?.[0] || session.user.email?.[0] || "U"}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`px-4 py-2 rounded-lg break-words ${
                    isUserMessage(message)
                      ? "bg-gray-100"
                      : "bg-primary text-white"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {getUserName(message)}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 text-right mt-1">
                    {new Date(message.created_at).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    {message.id.startsWith('temp-') && ' (送信中...)'}
                  </div>
                </div>
                {!isUserMessage(message) && (
                  <div className="h-8 w-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-white">
                    <Image
                      src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
                      alt="Admin Avatar"
                      width={24}
                      height={24}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isClosed ? "このチャットは終了しています" : "メッセージを入力..."}
            disabled={sending || loading || isClosed}
            className="flex-1"
            autoFocus={!isClosed}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending || loading || isClosed}
            onClick={() => setTimeout(focusInputField, 100)}
          >
            <Send className="h-4 w-4 mr-2" />
            送信
          </Button>
        </div>
      </form>
    </div>
  )
}