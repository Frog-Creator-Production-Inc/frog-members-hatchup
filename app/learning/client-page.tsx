"use client"

import { useRef, useState, useEffect } from "react"
import { LearningContent } from "./components/learning-content"
import { SubscriptionStatus } from "../settings/components/subscription-status"
import { SubscriptionManagement } from "../settings/components/subscription-management"
import { BookOpen, Globe, FileText, Play, Star, ArrowRight, Clock, Sparkles, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import Image from "next/image"

interface ClientPageProps {
  isSubscribed: boolean
  userId: string
  subscriptionStatus?: string
  subscriptionPeriodEnd?: string
  hasStripeCustomer: boolean
}

// 学習コンテンツの型定義
interface LearningContent {
  id: string
  title: string
  description: string
  category: string
  thumbnail?: string
  duration: string
  level: string
  isFree: boolean
  url: string
}

export default function ClientPage({ 
  isSubscribed, 
  userId, 
  subscriptionStatus, 
  subscriptionPeriodEnd, 
  hasStripeCustomer 
}: ClientPageProps) {
  const premiumSectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [contentActiveTab, setContentActiveTab] = useState("all");
  const [recommendedContents, setRecommendedContents] = useState<LearningContent[]>([]);

  // タブ変更時のスクロール処理
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "premium") {
      // プレミアムタブが選択された場合、少し遅延させてスクロール
      setTimeout(() => {
        premiumSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // クライアントサイドでのみ実行されるランダム選択
  useEffect(() => {
    // おすすめコンテンツ（ランダムに3つ選択）
    const randomContents = [...learningContents]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    setRecommendedContents(randomContents);
  }, []);

  // 学習コンテンツのカテゴリー
  const categories = [
    { id: "all", name: "すべて", icon: BookOpen },
    { id: "language", name: "語学対策", icon: Globe },
    { id: "culture", name: "文化適応", icon: Globe },
    { id: "career", name: "キャリア", icon: FileText },
  ]

  // ダミーの学習コンテンツ
  const learningContents: LearningContent[] = [
    {
      id: "1",
      title: "IELTS対策：スピーキング完全ガイド",
      description: "IELTSスピーキングセクションで高得点を取るためのテクニックと練習方法",
      category: "language",
      thumbnail: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070",
      duration: "45分",
      level: "中級",
      isFree: false,
      url: "/learning/ielts-speaking"
    },
    {
      id: "2",
      title: "カナダの文化と生活習慣",
      description: "カナダでの日常生活に役立つ文化的知識と現地の習慣について学ぶ",
      category: "culture",
      thumbnail: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=2011",
      duration: "30分",
      level: "初級",
      isFree: true,
      url: "/learning/canada-culture"
    },
    {
      id: "3",
      title: "効果的な英文履歴書の書き方",
      description: "海外就職に必要な英文履歴書の作成方法とポイント解説",
      category: "career",
      thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070",
      duration: "60分",
      level: "中級",
      isFree: false,
      url: "/learning/english-resume"
    },
    {
      id: "4",
      title: "TOEFL iBT リーディング対策",
      description: "TOEFLリーディングセクションの攻略法と問題パターン分析",
      category: "language",
      thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973",
      duration: "50分",
      level: "上級",
      isFree: false,
      url: "/learning/toefl-reading"
    },
    {
      id: "5",
      title: "オーストラリアでの生活スタートガイド",
      description: "オーストラリア到着後の最初の1ヶ月でやるべきことリスト",
      category: "culture",
      thumbnail: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=2030",
      duration: "25分",
      level: "初級",
      isFree: true,
      url: "/learning/australia-guide"
    },
    {
      id: "6",
      title: "英語面接対策：よくある質問と回答例",
      description: "海外就職面接でよく聞かれる質問と効果的な回答テクニック",
      category: "career",
      thumbnail: "https://images.unsplash.com/photo-1573497491765-dccce02b29df?q=80&w=2070",
      duration: "40分",
      level: "中級",
      isFree: false,
      url: "/learning/interview-prep"
    },
    {
      id: "7",
      title: "アメリカの大学院出願ガイド",
      description: "アメリカの大学院への出願プロセスと必要書類の準備方法",
      category: "career",
      thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070",
      duration: "55分",
      level: "上級",
      isFree: false,
      url: "/learning/us-graduate-school"
    },
    {
      id: "8",
      title: "イギリス英語とアメリカ英語の違い",
      description: "発音、語彙、文法の違いを理解し、両方の英語に対応できるようになる",
      category: "language",
      thumbnail: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?q=80&w=1974",
      duration: "35分",
      level: "中級",
      isFree: true,
      url: "/learning/uk-us-english"
    },
    {
      id: "9",
      title: "ニュージーランドでのワーキングホリデーガイド",
      description: "ニュージーランドでのワーキングホリデービザの取得方法と現地での仕事の探し方",
      category: "culture",
      thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021",
      duration: "40分",
      level: "初級",
      isFree: false,
      url: "/learning/nz-working-holiday"
    },
    {
      id: "10",
      title: "IELTS ライティングタスク2：エッセイ対策",
      description: "高得点を取るためのエッセイ構成と効果的な論点の展開方法",
      category: "language",
      thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073",
      duration: "65分",
      level: "上級",
      isFree: false,
      url: "/learning/ielts-writing-task2"
    },
    {
      id: "11",
      title: "海外での銀行口座開設ガイド",
      description: "主要英語圏国での銀行口座開設手続きと必要書類の解説",
      category: "culture",
      thumbnail: "https://images.unsplash.com/photo-1601597111158-29977ae1398c?q=80&w=2070",
      duration: "30分",
      level: "初級",
      isFree: true,
      url: "/learning/overseas-banking"
    },
    {
      id: "12",
      title: "LinkedIn英語プロフィールの最適化",
      description: "海外就職に効果的なLinkedInプロフィールの作成方法とネットワーキング戦略",
      category: "career",
      thumbnail: "https://images.unsplash.com/photo-1611944212129-29977ae1398c?q=80&w=2074",
      duration: "45分",
      level: "中級",
      isFree: false,
      url: "/learning/linkedin-profile"
    }
  ]

  // カテゴリーでフィルタリング
  const filteredContents = contentActiveTab === "all" 
    ? learningContents 
    : learningContents.filter(content => content.category === contentActiveTab)

  // 無料コンテンツのみ
  const freeContents = learningContents.filter(content => content.isFree)
  
  return (
    <div className="space-y-6">
      {/* ヘッダーブロック */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">学習コンテンツライブラリ</h1>
        </div>
        <p className="text-muted-foreground">
          海外就職・転職に役立つ学習コンテンツを提供しています。無料コンテンツと有料のプレミアムコンテンツがあります。
        </p>
      </div>

      {/* 準備中メッセージ */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          現在、学習コンテンツは準備中です。全てのコンテンツはダミーコンテンツとなっています。
        </AlertDescription>
      </Alert>
      
      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <Tabs defaultValue="all" className="mt-2" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>すべてのコンテンツ</span>
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>プレミアムコンテンツ</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                無料コンテンツはどなたでも利用できます。プレミアムコンテンツはメンバーシップに登録すると利用できます。
              </p>
            </div>

            {/* おすすめコンテンツ */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-medium">あなたにおすすめの無料学習コンテンツ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedContents.map((content) => (
                  <Card key={content.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-40 w-full">
                      {content.thumbnail ? (
                        <Image
                          src={content.thumbnail}
                          alt={content.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {content.isFree && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          無料
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium text-lg mb-2 line-clamp-1">{content.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{content.description}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                        <span className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {content.duration}
                        </span>
                        <span className="flex items-center">
                          <Star className="h-3.5 w-3.5 mr-1" />
                          {content.level}
                        </span>
                      </div>
                      <Button asChild className="w-full gap-1">
                        <Link href={content.url}>
                          <Play className="h-4 w-4" />
                          視聴する
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* カテゴリー別コンテンツ */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>学習コンテンツ</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" onValueChange={setContentActiveTab}>
                  <TabsList className="mb-4">
                    {categories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                        <category.icon className="h-4 w-4" />
                        <span>{category.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <TabsContent value={contentActiveTab} className="space-y-4">
                    {filteredContents.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {filteredContents.map((content) => (
                          <div key={content.id} className="flex border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors">
                            <div className="relative h-24 w-32 flex-shrink-0">
                              {content.thumbnail ? (
                                <Image
                                  src={content.thumbnail}
                                  alt={content.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <BookOpen className="h-8 w-8 text-gray-300" />
                                </div>
                              )}
                              {content.isFree && (
                                <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                  無料
                                </div>
                              )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-medium line-clamp-1">{content.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{content.description}</p>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{content.duration}</span>
                                  <span>{content.level}</span>
                                </div>
                                <Button asChild size="sm" variant="ghost">
                                  <Link href={content.url}>
                                    詳細を見る
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        コンテンツが見つかりませんでした
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* すべてのコンテンツ（無料・有料） */}
            <div className="mt-8">
              <LearningContent 
                isMember={isSubscribed} 
                userId={userId} 
                premiumSectionRef={premiumSectionRef} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="premium" className="mt-4">
            {/* サブスクリプション状態とサブスクリプション管理 */}
            <div className="space-y-6 mb-6">
              <SubscriptionStatus 
                isSubscribed={isSubscribed}
                status={subscriptionStatus}
                periodEnd={subscriptionPeriodEnd}
              />
              
              <SubscriptionManagement 
                isSubscribed={isSubscribed}
                hasStripeCustomer={hasStripeCustomer}
              />
            </div>
            
            {/* プレミアムコンテンツセクション */}
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">プレミアムコンテンツ一覧</h2>
              </div>
              
              <p className="text-sm text-muted-foreground">
                プレミアムコンテンツはメンバーシップに登録すると利用できます。より専門的な内容や詳細な解説が含まれています。
              </p>

              {!isSubscribed ? (
                <div className="bg-primary/5 rounded-lg p-6 border border-primary/20 space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    メンバーシップ特典
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>すべてのプレミアム学習コンテンツに無制限アクセス</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>専門家による添削サービスの割引</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>メンバー限定のウェビナーやイベントへの参加</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    月額¥500で、いつでもキャンセル可能です。
                  </p>
                </div>
              ) : (
                <LearningContent 
                  isMember={isSubscribed} 
                  userId={userId} 
                  showPremiumOnly={true} 
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 