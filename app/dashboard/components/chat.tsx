"use client"

import { useState, useEffect, useRef } from "react"
import { useSupabaseSession } from "@/hooks/useSupabaseSession"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createChatSession, sendMessage, getChatMessages, subscribeToMessages, getLatestChatSession, notifySlackNewChatMessage } from "@/lib/chat"
import Image from "next/image"
import { Send, X, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { Database } from "@/types/supabase"
import { toast } from "react-hot-toast"

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  session_id?: string;
  sender?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline break-all"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    content: "Frogエージェントサポートです。\nメールでのご連絡をご希望の場合は、「support@frogagent.com」へご連絡ください。 チャットでのお問い合わせをご希望の場合は、担当者が戻り次第回答させていただきます。",
    sender_id: "system",
    created_at: new Date().toISOString(),
  },
]

export default function Chat() {
  const { user } = useSupabaseSession()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)

  const loadExistingSession = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      
      const session = await getLatestChatSession(user.id)
      if (session) {
        setSessionId(session.id)
        
        // セッションが終了しているかチェック
        setIsClosed(session.status === "closed")
        
        // メッセージを取得
        const chatMessages = await getChatMessages(session.id)
        
        if (chatMessages && chatMessages.length > 0) {
          // 重複を避けるために一度初期メッセージをクリアしてからセット
          setMessages([...INITIAL_MESSAGES, ...chatMessages])
        } else {
          setMessages(INITIAL_MESSAGES)
        }
      } else {
        setMessages(INITIAL_MESSAGES)
      }
      
      setIsInitialized(true)
      setHasLoadedData(true)
    } catch (error) {
      setMessages(INITIAL_MESSAGES)
    } finally {
      setIsLoading(false)
    }
  }

  // チャットが開かれたときだけデータを読み込む
  useEffect(() => {
    if (isOpen && user && !hasLoadedData) {
      loadExistingSession()
    }
  }, [isOpen, user, hasLoadedData])

  // リアルタイム更新の購読（チャットが開いているときのみ）
  useEffect(() => {
    let subscription: any = null;
    let sessionChannel: any = null;
    
    if (sessionId && isOpen) {
      try {
        // リアルタイム更新用の特別な設定でSupabaseクライアントを作成
        const realtimeSupabase = createClientComponentClient<Database>({
          options: {
            realtime: {
              timeout: 60000
            },
            db: {
              schema: 'public'
            },
            global: {
              headers: {
                'X-Supabase-Cache-Control': 'no-cache'
              }
            }
          }
        })
        
        subscription = subscribeToMessages(sessionId, (payload) => {
          // イベントタイプに応じた処理
          if (payload.eventType === 'INSERT') {
            // 新しいメッセージの追加処理
            setMessages((prevMessages) => {
              const newMsg = payload.new;
              
              // 既に同じIDのメッセージがある場合は追加しない
              if (prevMessages.some(msg => msg.id === newMsg.id)) {
                return prevMessages;
              }
              
              // 自分が送信したメッセージの一時IDを置き換える
              // 内容と送信者IDで一致を確認
              const tempMessages = prevMessages.filter(
                msg => msg.id.startsWith('temp-') && 
                      msg.content === newMsg.content && 
                      msg.sender_id === newMsg.sender_id
              );
              
              if (tempMessages.length > 0) {
                return prevMessages.map(msg => 
                  (msg.id.startsWith('temp-') && 
                   msg.content === newMsg.content && 
                   msg.sender_id === newMsg.sender_id)
                    ? { ...newMsg, sender: msg.sender }
                    : msg
                );
              }
              
              // システムメッセージの場合、セッションが終了したかチェック
              if (newMsg.sender_id === "system" && 
                  newMsg.content.includes("このチャットセッションは終了しました")) {
                setIsClosed(true);
              }
              
              // 新しいメッセージを追加
              const updatedMessages = [...prevMessages, newMsg];
              
              // 非同期でスクロール処理を行う
              setTimeout(scrollToBottom, 0);
              
              return updatedMessages;
            });
          } else if (payload.eventType === 'UPDATE') {
            // メッセージ更新の処理
            setMessages((prevMessages) => {
              return prevMessages.map(msg => 
                msg.id === payload.new.id ? payload.new : msg
              );
            });
          }
        });
        
        // セッションのステータス変更も監視（ユニークなチャンネル名を使用）
        const sessionChannelName = `session:${sessionId}:${Date.now()}`
        
        sessionChannel = realtimeSupabase
          .channel(sessionChannelName)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'chat_sessions',
              filter: `id=eq.${sessionId}`
            },
            (payload) => {
              if (payload.new.status === "closed") {
                setIsClosed(true)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // チャンネル購読完了
            }
          })
      } catch (error) {
        // エラー処理
      }
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          // 購読解除エラー
        }
      }
      
      if (sessionChannel) {
        try {
          sessionChannel.unsubscribe()
        } catch (error) {
          // セッション購読解除エラー
        }
      }
    }
  }, [sessionId, isOpen])

  // メッセージが更新されたらスクロール（チャットが開いているときのみ）
  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ユーザーやセッションの状態をチェック
    if (!newMessage.trim() || isLoading || isClosed || !user) {
      return
    }
    
    // メッセージ送信フローを開始
    const messageContent = newMessage.trim()
    setIsLoading(true)
    
    // 一時IDを生成
    const tempId = `temp-${Date.now()}`
    
    try {
      // 一時メッセージオブジェクトを作成
      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
      }
      
      // 入力フィールドをクリア
      setNewMessage("")
      
      // UIに一時メッセージを表示
      setMessages(prev => [...prev, tempMessage])
      
      // スクロール処理
      scrollToBottom()
      
      if (!sessionId) {
        // 新しいチャットセッションを作成
        const newSession = await createChatSession(user.id, messageContent)
        setSessionId(newSession.id)
        
        // セッション作成後に通知を送信
        try {
          if (newSession && newSession.id) {
            await notifySlackNewChatMessage({
              messageId: tempId, // 一時IDを使用
              channelId: newSession.id,
              userId: user.id,
              text: messageContent,
              userName: user.email || '不明なユーザー' // null対応
            });
          }
        } catch (notifyError) {
          // 通知失敗は無視して続行
        }
      } else {
        // 既存のセッションにメッセージを送信
        const result = await sendMessage(sessionId, messageContent, user.id)
        
        // 送信完了後、一時メッセージを確実に置き換える
        if (result && result.length > 0) {
          const sentMessage = result[0]
          
          // 一時メッセージを永続的なメッセージに置き換え
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId ? { ...sentMessage, sender: msg.sender } : msg
            )
          )
          
          // 送信成功後にSlack通知
          try {
            await notifySlackNewChatMessage({
              messageId: sentMessage.id,
              channelId: sessionId,
              userId: user.id,
              text: messageContent,
              userName: user.email || '不明なユーザー' // null対応
            });
          } catch (notifyError) {
            // 通知失敗は無視して続行
          }
        }
      }
    } catch (error) {
      // エラーが発生した場合は一時メッセージを削除
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      // 入力フィールドに戻す
      setNewMessage(messageContent)
      // エラーメッセージを表示
      toast.error("メッセージの送信に失敗しました。再度お試しください。")
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  // 新しいチャットを開始する
  const startNewChat = async () => {
    try {
      // 既存のセッションをクリア
      setSessionId(null);
      setMessages(INITIAL_MESSAGES);
      setIsClosed(false);
      
      // 状態をリセット
      setIsInitialized(false);
      setHasLoadedData(false);
      
      // 新しいセッションを強制的に作成
      if (user) {
        setIsLoading(true);
        
        // 新しいセッションを作成（空のメッセージで）
        const newSession = await createChatSession(user.id, "");
        
        // 新しいセッションIDを設定
        setSessionId(newSession.id);
        setIsLoading(false);
      } else {
        // ユーザーがログインしていない場合は既存のセッションを読み込む
        loadExistingSession();
      }
    } catch (error) {
      toast.error("新しいチャットの開始に失敗しました。再度お試しください。");
      setIsLoading(false);
    }
  };

  // チャットが閉じられているときはボタンだけをレンダリング
  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-md"
      >
        <Send className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-md"
      >
        <X className="w-5 h-5" />
      </Button>

      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 w-[350px] max-w-full bg-white border rounded-lg shadow-lg transition-all duration-300 ease-in-out flex flex-col",
          "translate-y-0 opacity-100",
          "max-h-[calc(100vh-2rem)]",
        )}
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b bg-[#1a1b2e] text-white">
          <div className="h-9 w-8 relative">
            <Image
              src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
              alt="Support Avatar"
              fill
            />
          </div>
          <span className="font-medium">Frogエージェントサポート</span>
          <Button onClick={toggleChat} variant="ghost" size="icon" className="text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div className="flex gap-2">
                  {message.sender_id !== user?.id && (
                    <div className="h-9 w-8 relative flex-shrink-0">
                      <Image
                        src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
                        alt="Support Avatar"
                        fill
                      />
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs sm:max-w-md break-words ${
                      message.sender_id === user?.id ? "bg-primary text-white" : 
                      message.sender_id === "system" ? "bg-yellow-100 text-gray-800" : "bg-[#f1f5f9]"
                    }`}
                  >
                    {linkifyText(message.content)}
                    <div className="text-xs mt-1 opacity-70">
                      {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {message.id.startsWith('temp-') && ' (送信中...)'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t flex-shrink-0">
          {isClosed ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-red-500">このチャットセッションは終了しました。</p>
              <Button 
                type="button" 
                onClick={startNewChat} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    処理中...
                  </div>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    新しいチャットを開始
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                className="pr-12"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                disabled={!newMessage.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>
      </div>
    </>
  )
}