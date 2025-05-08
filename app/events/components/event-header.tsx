import { Calendar, Users, Zap, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function EventHeader() {
  return (
    <div className="space-y-6 mb-10">
      {/* ヘッダーカード */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">イベント情報</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          Frogが提供、または主催するイベント情報をご覧いただけます。セミナーやワークショップ、交流会など、様々なイベントに参加して、海外就職・転職に役立つ情報を得たり、同じ志を持つ仲間と交流しましょう。
        </p>
      </div>
      
      {/* 特徴と参加メリット */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <Calendar className="h-5 w-5 text-gray-500" />
            イベントの特徴
          </h3>
          <ul className="space-y-3">
            {[
              '海外就職・転職に関する最新情報の提供',
              '業界のプロフェッショナルによるセミナー',
              '参加者同士の交流の場',
              'オンラインと対面の両方で開催'
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
              '海外就職・転職に必要な知識やスキルの習得',
              '同じ目標を持つ仲間とのネットワーキング',
              '業界の最新トレンドや求人情報の入手',
              '実際に海外で働く方々との交流機会'
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