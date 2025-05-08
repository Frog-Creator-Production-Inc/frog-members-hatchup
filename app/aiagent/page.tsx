'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare } from "lucide-react";
import dynamic from 'next/dynamic';

// クライアントサイドでのみレンダリングするためにdynamic importを使用
const ClientOnlyChatContainer = dynamic(
  () => import('./components/client-only-chat'),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function AIAgentPage() {
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのみレンダリングされるようにする
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">

      {/* 説明カード */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            カナダビザ・留学サポート AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            カナダのビザ・留学・海外就職に関する質問に、AIがお答えします。
            実際の体験談や公式情報を元に、あなたの疑問を解決します。
          </p>
        </CardContent>
      </Card>

      {/* チャットコンテナ */}
      <div className="chat-container-wrapper">
        {mounted && <ClientOnlyChatContainer />}
      </div>

      {/* 注意書き */}
      <Card className="bg-gray-50 border-gray-100">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              このAIアシスタントは、カナダのビザ情報や留学経験者のインタビューを元に回答しています。
              最新の正確な情報については、必ず公式サイトでご確認ください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 