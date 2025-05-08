import { ArrowLeft, Users, Zap, Globe, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CommunityHeader() {
  return (
    <div className="space-y-6 mb-10">
      {/* ヘッダーカード */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Frogコミュニティ</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          Frogが運営する職種別Slackコミュニティへようこそ。各分野のプロフェッショナルとつながり、情報交換や交流を深めましょう。
        </p>
      </div>
      
      {/* 特徴と参加メリット */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <Globe className="h-5 w-5 text-gray-500" />
            コミュニティの特徴
          </h3>
          <ul className="space-y-3">
            {[
              '各職種カテゴリごとの専門チャンネル',
              '海外で活躍する日本人プロフェッショナルとの交流',
              '業界別の最新情報や求人情報の共有',
              '帰国者からの経験談や実践的なアドバイス'
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <Zap className="h-5 w-5 text-gray-500" />
            参加するメリット
          </h3>
          <ul className="space-y-3">
            {[
              '同じ職種の仲間とのネットワーキング',
              '海外就職・転職に関する生きた情報の入手',
              '業界特有の課題や解決策の共有',
              'キャリアアップや海外生活のサポート'
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 