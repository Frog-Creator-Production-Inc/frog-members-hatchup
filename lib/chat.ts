import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createRealtimeClient, createNoCacheClient } from "@/lib/supabase-client"
import { notifyNewChatMessage } from './slack/notifications'

// 通常のSupabaseクライアント
const supabase = createClientComponentClient()

// ユーザーIDごとの最終通知タイムスタンプを保持する
// メモリキャッシュなのでサーバー再起動時にリセットされる
const lastNotificationTimestamps: Record<string, Date> = {}

// 同じユーザーからの通知を送信する最小間隔（ミリ秒）
const MIN_NOTIFICATION_INTERVAL = 60 * 60 * 1000 // 1時間

export async function createChatSession(userId: string, initialMessage: string) {
  const supabase = createNoCacheClient()
  
  try {
    // 新しいセッションを作成
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        status: 'unread'
      })
      .select()
      .single()
    
    if (sessionError) throw sessionError
    
    // 最初のメッセージを送信
    await sendMessage(sessionData.id, initialMessage, userId)
    
    return sessionData
  } catch (error) {
    return null
  }
}

/**
 * チャットメッセージを送信する
 */
export async function sendMessage(sessionId: string, content: string, userId: string) {
  // キャッシュを無効化する設定でクライアントを作成
  const noCacheClient = createNoCacheClient()
  
  try {
    // 送信者が管理者かどうかをチェック
    const { data: adminRole } = await noCacheClient
      .from('admin_roles')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    // 管理者かユーザーかによってセッションステータスを設定
    const sessionStatus = adminRole ? 'active' : 'unread'
    
    // メッセージを保存
    const { data, error } = await noCacheClient
      .from('messages')
      .insert({
        session_id: sessionId,
        content,
        sender_id: userId
      })
      .select()
    
    if (error) {
      return null
    }
    
    // セッションステータスを更新（メッセージ保存後に行うことで確実にupdated_atが更新される）
    const { error: sessionError } = await noCacheClient
      .from('chat_sessions')
      .update({ 
        status: sessionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
    
    if (sessionError) {
      return null
    }
    
    // 管理者ではないユーザーからのメッセージの場合のみSlack通知を送信
    // adminRoleがtrueの場合は管理者からのメッセージなので通知をスキップする
    if (!adminRole) {
      // 前回の通知からの経過時間をチェック
      const lastNotification = lastNotificationTimestamps[userId]
      const now = new Date()
      const shouldSendNotification = !lastNotification || 
        (now.getTime() - lastNotification.getTime() > MIN_NOTIFICATION_INTERVAL)
      
      if (shouldSendNotification) {
        try {
          // ユーザー情報を取得
          const { data: userData, error: userError } = await noCacheClient
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', userId)
            .single()
          
          if (!userError && userData) {
            const userName = userData.first_name && userData.last_name 
              ? `${userData.first_name} ${userData.last_name}`
              : userData.email || userId;
            
            // 実行環境に応じて適切な通知方法を選択
            const isServerSide = typeof window === 'undefined';
            
            if (isServerSide) {
              // サーバーサイドでの実行時は直接関数を呼び出す
              // 管理者チェックは冒頭で行っているため、この時点で!adminRoleは常にtrue
              
              // 非同期で実行し、結果を待たない（チャット処理のパフォーマンスを優先）
              void notifyNewChatMessage(
                sessionId,
                userId,
                userName,
                content
              ).catch(() => {
                // エラーは無視（チャット機能に影響を与えない）
              });
            } else {
              // クライアントサイドでの実行時はAPIエンドポイントを使用
              // 管理者チェックは冒頭で行っているため、この時点で!adminRoleは常にtrue
              
              // 非同期でAPIを呼び出し（結果を待たない）
              // このAPIコールはチャットのパフォーマンスに影響を与えない
              void fetch(`${window.location.origin}/api/slack/notify-chat-message`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionId,
                  userId,
                  userName,
                  content
                }),
              }).then(response => {
                if (!response.ok) {
                  // レスポンスエラーは無視（チャット機能には影響を与えない）
                }
              }).catch(() => {
                // エラーをログに記録するだけで、チャット機能には影響を与えない
              });
            }
            
            // 最終通知タイムスタンプを更新
            lastNotificationTimestamps[userId] = now
          } else {
            // ユーザー情報取得エラーは無視（チャット機能には影響を与えない）
          }
        } catch (notifyError) {
          // 通知エラーはチャット機能には影響を与えない
        }
      }
    }
    
    return data
  } catch (error) {
    return null
  }
}

/**
 * チャットを既読にする
 */
export async function markChatAsRead(sessionId: string) {
  // キャッシュを無効化する設定でクライアントを作成
  const noCacheClient = createNoCacheClient()
  
  try {
    const { error } = await noCacheClient
      .from('chat_sessions')
      .update({ 
        status: 'read',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
    
    if (error) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * チャットセッションのステータスをアクティブに更新する
 */
export async function markChatAsActive(sessionId: string) {
  const noCacheClient = createNoCacheClient()
  
  try {
    const { error } = await noCacheClient
      .from('chat_sessions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * 最新のチャットセッションを取得する
 */
export async function getLatestChatSession(userId: string) {
  const noCacheClient = createNoCacheClient()
  
  const { data, error } = await noCacheClient
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    return null
  }

  return data
}

/**
 * 管理者用のチャットセッション一覧を取得する
 */
export async function getAdminChatSessions() {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      id,
      user_id,
      status,
      created_at,
      updated_at,
      user:profiles!chat_sessions_user_id_fkey (
        id,
        email,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return data
}

/**
 * メッセージの受信をリアルタイムに監視する
 */
export function subscribeToMessages(sessionId: string, callback: (payload: any) => void) {
  try {
    const realtimeClient = createRealtimeClient()
    const channelName = `realtime:messages:session_id=eq.${sessionId}`
    
    // メッセージテーブルのセッションIDに一致するものを購読
    const channel = realtimeClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()
      
    return channel
  } catch (error) {
    return null
  }
}

/**
 * チャットメッセージを取得する
 */
export async function getChatMessages(sessionId: string) {
  const noCacheClient = createNoCacheClient()
  
  try {
    const { data: messages, error } = await noCacheClient
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
      .eq('session_id', sessionId)
      .order('created_at')

    if (error) {
      return null
    }

    return messages
  } catch (error) {
    return null
  }
}

/**
 * チャットセッションを終了（クローズ）する
 */
export async function closeChatSession(sessionId: string) {
  const noCacheClient = createNoCacheClient()
  
  try {
    // システムメッセージを追加して、セッションが終了したことをユーザーに通知
    await noCacheClient
      .from('messages')
      .insert({
        session_id: sessionId,
        content: "このチャットセッションは終了しました。新しい質問がある場合は、新しいチャットを開始してください。",
        sender_id: "system"
      })
    
    // セッションステータスをクローズに更新
    const { error } = await noCacheClient
      .from('chat_sessions')
      .update({ 
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * チャットセッションのステータスを確認する
 * @param sessionId チャットセッションID
 * @returns セッションのステータス
 */
export async function getChatSessionStatus(sessionId: string) {
  const supabase = createClientComponentClient()
  
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('status')
      .eq('id', sessionId)
      .single()
    
    if (error) {
      return null
    }
    
    return data.status
  } catch (error) {
    return null
  }
}

/**
 * Slackに通知を送信する関数
 * - クライアントサイドでのみ使用可能
 * - サーバー側APIを介して通知を送信する
 */
export async function notifySlackNewChatMessage({
  messageId,
  channelId,
  userId,
  text,
  userName
}: {
  messageId: string;
  channelId: string;
  userId: string;
  text: string;
  userName?: string;
}): Promise<boolean> {
  try {
    // 従来の通知API
    const legacyResponse = await fetch('/api/slack/notify-chat-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageId,
        channelId,
        userId,
        text,
        userName
      })
    });

    // 新しいWebClient API（エラーが発生しても処理を継続）
    try {
      await fetch('/api/slack/new-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          messageContent: text,
          sender: userName,
          receiver: 'FROG管理者',
          messageId,
          channelId
        })
      });
    } catch (webClientError) {
      // WebClient APIのエラーは無視
    }

    if (!legacyResponse.ok) {
      // エラーでも処理は継続（通知は補助的な機能）
      return false;
    }

    const data = await legacyResponse.json();
    return data.success === true;
  } catch (error) {
    // エラーがあっても通知は処理を継続
    return false;
  }
}

/**
 * ビザプラン作成時のSlack通知
 */
export async function notifySlackNewVisaPlan({
  visaPlanId,
  userId,
  userName
}: {
  visaPlanId: string;
  userId: string;
  userName?: string;
}): Promise<boolean> {
  try {
    // 従来の通知API
    const legacyResponse = await fetch('/api/slack/notify-visa-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageId: visaPlanId,
        planId: visaPlanId,
        userId,
        title: 'ビザプラン作成',
        content: `${userName || 'ユーザー'}さんが新しいビザプランを作成しました。`,
        userName
      })
    });

    // 新しいWebClient API（エラーが発生しても処理を継続）
    try {
      await fetch('/api/slack/new-visa-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          visaPlanId,
          userName
        })
      });
    } catch (webClientError) {
      // WebClient APIのエラーは無視
    }

    if (!legacyResponse.ok) {
      // エラーでも処理は継続（通知は補助的な機能）
      return false;
    }

    const data = await legacyResponse.json();
    return data.success === true;
  } catch (error) {
    // エラーがあっても通知は処理を継続
    return false;
  }
}