import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Message {
  id: string;
  user_id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: any;
}

export function useMessages(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // メッセージ履歴を取得
  const fetchMessages = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
    } catch (err) {
      console.error('メッセージ取得エラー:', err);
      setError('メッセージの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 新しいメッセージを追加
  const addMessage = async (content: string, sender: 'user' | 'assistant', metadata?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('認証が必要です');
      }
      
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          sender,
          content,
          metadata: metadata || {}
        })
        .select('*');
      
      if (error) throw error;
      
      setMessages(prev => [...prev, data[0]]);
      return data[0];
    } catch (err) {
      console.error('メッセージ追加エラー:', err);
      setError('メッセージの追加に失敗しました');
      return null;
    }
  };

  // 初回読み込み時にメッセージを取得
  useEffect(() => {
    if (sessionId) {
      fetchMessages();
    }
  }, [sessionId]);

  // リアルタイム更新のサブスクリプションを設定
  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ai_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => {
          // 重複を避けるために既存のメッセージをチェック
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  return {
    messages,
    loading,
    error,
    addMessage,
    refreshMessages: fetchMessages
  };
} 