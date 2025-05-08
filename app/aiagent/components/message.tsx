'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { createClientComponent } from '@/lib/supabase';

interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

export const Message: React.FC<MessageProps> = ({ content, isUser, timestamp }) => {
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const { user } = useSupabaseSession();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // タイムスタンプがある場合はフォーマット
    if (timestamp) {
      const time = new Date(timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setFormattedTime(time);
    }
  }, [timestamp]);

  // ユーザーのプロフィール情報を取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && isUser) {
        const supabase = createClientComponent();
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data && !error && data.avatar_url) {
          setUserAvatar(data.avatar_url);
        }
      }
    };

    fetchUserProfile();
  }, [user, isUser]);

  return (
    <div
      className={`flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-4`}
    >
      <div
        className={`flex max-w-[80%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        } items-start gap-2`}
      >
        {/* アバター */}
        <Avatar className="h-8 w-8">
          {isUser ? (
            <>
              <AvatarFallback>U</AvatarFallback>
              {userAvatar ? (
                <AvatarImage src={userAvatar} alt="User" />
              ) : (
                <AvatarImage src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png" alt="User" />
              )}
            </>
          ) : (
            <>
              <AvatarFallback>AI</AvatarFallback>
              <AvatarImage src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png" alt="Assistant" />
            </>
          )}
        </Avatar>

        {/* メッセージ本文 */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          <div className="whitespace-pre-wrap">{content}</div>
          {mounted && timestamp && formattedTime && (
            <div
              className={`text-xs mt-1 ${
                isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {formattedTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 