import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SupabaseClient } from "@supabase/supabase-js"
import { RealtimeChannelSnapshot } from "@supabase/supabase-js"
import { Database } from "@supabase/supabase-js"

/**
 * 未読チャットの数を取得する
 */
export async function getUnreadChatCount(userId: string): Promise<number> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    const { count, error } = await supabase
      .from("chat_sessions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "unread")
      .eq("user_has_unread", true);
      
    if (error) {
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 保留中のビザレビューの数を取得する
 */
export async function getPendingReviewCount(): Promise<number> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    const { count, error } = await supabase
      .from("visa_plan_reviews")
      .select("*", { count: "exact" })
      .eq("status", "pending");
      
    if (error) {
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 未処理のコース申し込みの数を取得する
 */
export async function getPendingApplicationCount(): Promise<number> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    const { count, error } = await supabase
      .from("course_applications")
      .select("*", { count: "exact" })
      .eq("status", "pending");
      
    if (error) {
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 新しいメッセージが追加された場合にチャットセッションを未読に更新する
 * @param messageData 新しいメッセージのデータ
 */
export const updateChatSessionStatusOnNewMessage = async (
  sessionId: string,
  currentUserId: string
) => {
  try {
    const supabase = createClientComponentClient<Database>();
    
    // セッション情報を取得
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
      
    if (sessionError) {
      return false;
    }
    
    // 送信者と受信者を判断
    const isAdmin = currentUserId !== session.user_id;
    
    // セッションステータスを更新
    const updateData = {
      updated_at: new Date().toISOString(),
      status: "unread",
      user_has_unread: isAdmin, // 送信者が管理者の場合、ユーザーは未読
      admin_has_unread: !isAdmin // 送信者がユーザーの場合、管理者は未読
    };
    
    const { error } = await supabase
      .from("chat_sessions")
      .update(updateData)
      .eq("id", sessionId);
      
    if (error) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 通知をサブスクライブする
 * @param callback 通知が更新されたときに呼び出されるコールバック関数
 * @returns クリーンアップ関数
 */
export function subscribeToNotifications(callback: () => void) {
  const supabase = createClientComponentClient()

  // 定期的にポーリングする間隔（ミリ秒）
  const POLLING_INTERVAL = 30000 // 30秒

  // 定期的なポーリングを設定
  const pollingInterval = setInterval(() => {
    callback()
  }, POLLING_INTERVAL)

  const channel = supabase
    .channel("admin-notifications")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_sessions",
        filter: "status=eq.unread",
      },
      (payload) => {
        callback()
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_sessions",
      },
      (payload) => {
        callback()
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "visa_plan_reviews",
      },
      callback
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "course_applications",
      },
      callback
    )
    .subscribe()

  return () => {
    clearInterval(pollingInterval)
    supabase.removeChannel(channel)
  }
}

/**
 * 通知の合計数を取得する
 */
export async function getTotalNotificationCount() {
  const [chatCount, reviewCount, applicationCount] = await Promise.all([
    getUnreadChatCount(),
    getPendingReviewCount(),
    getPendingApplicationCount(),
  ])

  return {
    chatCount,
    reviewCount,
    applicationCount,
    total: chatCount + reviewCount + applicationCount,
  }
}

// Realtimeのイベントハンドラー（チャットステータス更新）
export const setupChatRealtimeSubscription = (
  supabase: SupabaseClient<Database>,
  callback: (payload: RealtimeChannelSnapshot<{ [key: string]: any }>) => void
) => {
  const channel = supabase
    .channel('chats-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
      },
      (payload) => {
        callback(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_sessions',
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}; 