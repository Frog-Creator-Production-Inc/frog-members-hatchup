'use client';

import React, { useState, useEffect } from 'react';
import { ChatContainer, TypingAnimationStyles } from './chat-container';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { v4 as uuidv4 } from 'uuid';

export default function ClientOnlyChat() {
  const { user } = useSupabaseSession();
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのみレンダリングされるようにする
  useEffect(() => {
    setMounted(true);
    
    // セッションIDの初期化
    const initSessionId = () => {
      // ローカルストレージからセッションIDを取得するか、新しく生成
      const storedSessionId = localStorage.getItem('aiagent_session_id');
      const newSessionId = storedSessionId || `session_${uuidv4()}`;
      
      setSessionId(newSessionId);
      
      if (!storedSessionId) {
        localStorage.setItem('aiagent_session_id', newSessionId);
      }
    };
    
    initSessionId();
  }, []);

  // クライアントサイドでのみレンダリング
  if (!mounted) {
    return null;
  }

  return (
    <>
      <TypingAnimationStyles />
      <ChatContainer
        sessionId={sessionId}
        userId={user?.id}
      />
    </>
  );
} 