'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from './message';
import { MessageInput } from './message-input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMessages } from '../hooks/useMessages';

interface Source {
  title: string;
  url?: string;
  slug?: string;
}

interface CourseSource {
  id: string;
  title: string;
  school: string;
  location: string;
  tuition: number;
}

interface Analysis {
  total: number;
  canadaJobs: number;
}

interface Recommendation {
  migrationGoal: string;
  courses: CourseSource[];
}

interface ChatContainerProps {
  sessionId?: string;
  userId?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ sessionId, userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<{ 
    visa: Source[]; 
    courses: CourseSource[];
    interviews: Source[] 
  }>({
    visa: [],
    courses: [],
    interviews: [],
  });
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // useMessagesフックを使用してメッセージ履歴を管理
  const { 
    messages: dbMessages, 
    loading: messagesLoading, 
    error: messagesError 
  } = useMessages(sessionId || '');
  
  // 表示用のメッセージ形式に変換
  const formattedMessages = dbMessages.map(msg => ({
    content: msg.content,
    isUser: msg.sender === 'user',
    timestamp: msg.created_at
  }));

  // 初期メッセージを含むメッセージ配列
  const initialMessage = {
    content: 'こんにちは！カナダのビザ・留学・海外就職について何でも質問してください。',
    isUser: false,
    timestamp: new Date(0).toISOString() // 最も古いタイムスタンプを設定して常に先頭に表示
  };

  // 初期メッセージを常に先頭に表示するように配列を構築
  const displayMessages = formattedMessages.length > 0 
    ? [initialMessage, ...formattedMessages] 
    : [initialMessage];

  // クライアントサイドでのみレンダリングされるようにする
  useEffect(() => {
    setMounted(true);
  }, []);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [formattedMessages]);

  // メッセージを送信
  const handleSendMessage = async (content: string) => {
    if (!sessionId) return;
    
    setIsLoading(true);

    // AIの入力中アニメーションを表示するために少し遅延させる
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // AIエージェントAPIを呼び出し
      const response = await fetch('/api/aiagent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          sessionId,
          userId,
          chatHistory: formattedMessages.map((msg) => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 情報源を設定
      if (data.sources) {
        setSources(data.sources);
      }

      // 分析結果を設定
      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      // 推奨コースを設定
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // エラーメッセージを表示（UIのみ）
      const errorMessageElement = document.querySelector('.messages-container');
      if (errorMessageElement) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start gap-2 mb-4';
        messageDiv.innerHTML = `
          <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
            AI
          </div>
          <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p>すみません、エラーが発生しました。もう一度お試しください。</p>
            <p class="text-xs text-gray-500 mt-1">${new Date().toLocaleTimeString()}</p>
          </div>
        `;
        errorMessageElement.appendChild(messageDiv);
      }
    } finally {
      // 少し遅延してからローディング状態を解除
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  // 目標に基づく推奨コースの表示
  const renderRecommendations = () => {
    if (!recommendations || recommendations.courses.length === 0) return null;
    
    // 移住目標のラベルを取得
    const goalLabels: {[key: string]: string} = {
      "overseas_job": "海外就職",
      "improve_language": "語学力向上",
      "career_change": "キャリアチェンジ",
      "find_new_home": "移住先探し"
    };
    
    const goalLabel = goalLabels[recommendations.migrationGoal] || recommendations.migrationGoal;
    
    return (
      <div className="w-full text-xs bg-blue-50 p-2 rounded border border-blue-100">
        <p className="font-medium text-blue-800 mb-1">あなたの目標「{goalLabel}」に基づくおすすめコース:</p>
        <div className="space-y-1">
          {recommendations.courses.map((course, index) => (
            <div key={`rec-${index}`} className="flex justify-between items-center">
              <span>{course.title}（{course.school}）</span>
              {course.tuition && (
                <span className="text-blue-700">{course.tuition.toLocaleString()}CAD</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <Card className="w-full bg-white shadow-sm border border-gray-100">
      <CardContent className="h-[500px] overflow-y-auto p-4 messages-container">
        {messagesLoading ? (
          // ローディング中の表示
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-1/2 ml-auto" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        ) : (
          // メッセージの表示（formattedMessagesからdisplayMessagesに変更）
          displayMessages.map((message, index) => (
            <Message
              key={index}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
              AI
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <div className="typing-animation">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        {/* 入力フォームを最初に配置 */}
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        
        {/* 以下の参考情報や分析エリアを非表示にします */}
        {/* 推奨コースがある場合に表示 */}
        {recommendations && renderRecommendations()}
        
        {/* 分析結果がある場合に表示 */}
        {analysis && (
          <div className="w-full text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>インタビュー記事: {analysis.total}件 (カナダ就職: {analysis.canadaJobs}件)</p>
          </div>
        )}
        
        {/* 情報源がある場合に表示 */}
        {(sources.visa.length > 0 || sources.courses.length > 0 || sources.interviews.length > 0) && (
          <div className="w-full flex flex-wrap gap-1">
            {sources.visa.map((source, index) => (
              <Badge key={`visa-${index}`} variant="outline" className="text-xs">
                {source.title}
              </Badge>
            ))}
            {sources.courses.map((course, index) => (
              <Badge key={`course-${index}`} variant="outline" className="text-xs bg-blue-50">
                {course.title}
              </Badge>
            ))}
            {sources.interviews.map((source, index) => (
              <Badge key={`interview-${index}`} variant="outline" className="text-xs">
                {source.title}
              </Badge>
            ))}
          </div>
        )}

      </CardFooter>
    </Card>
  );
};

// CSSスタイルをグローバルCSSに追加するためのスタイルタグ
export const TypingAnimationStyles = () => {
  return (
    <style jsx global>{`
      .typing-animation {
        display: flex;
        align-items: center;
        height: 20px;
      }
      
      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #3b82f6;
        margin: 0 4px;
        animation: typing 1.2s infinite ease-in-out both;
      }
      
      .dot:nth-child(1) {
        animation-delay: 0s;
      }
      
      .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing {
        0%, 80%, 100% {
          transform: scale(0.6);
          opacity: 0.6;
        }
        40% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
    `}</style>
  );
}; 