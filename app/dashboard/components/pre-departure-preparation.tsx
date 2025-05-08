"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Globe, FileText, Play, Star, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Profile } from "@/types/supabase"

interface PreDeparturePreparationProps {
  profile: Profile
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

export default function PreDeparturePreparation({ profile }: PreDeparturePreparationProps) {
  const [activeTab, setActiveTab] = useState("all")

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
  ]

  // カテゴリーでフィルタリング
  const filteredContents = activeTab === "all" 
    ? learningContents 
    : learningContents.filter(content => content.category === activeTab)

  // 無料コンテンツのみ
  const freeContents = learningContents.filter(content => content.isFree)

  // ユーザーの目的に基づいておすすめコンテンツを取得
  const getRecommendedContents = () => {
    const migrationGoal = profile.migration_goal || ""
    let recommended: LearningContent[] = []
    
    if (migrationGoal === "overseas_job") {
      // 海外就職向けコンテンツ
      recommended = learningContents.filter(content => 
        content.category === "career" || content.title.includes("IELTS")
      )
    } else if (migrationGoal === "improve_language") {
      // 語学向上向けコンテンツ
      recommended = learningContents.filter(content => 
        content.category === "language"
      )
    } else {
      // デフォルトのおすすめ
      recommended = learningContents.filter(content => 
        content.isFree || content.level === "初級"
      )
    }
    
    return recommended.slice(0, 3) // 最大3件表示
  }

  const recommendedContents = getRecommendedContents()

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          渡航準備 & 学習
        </CardTitle>
        <Link href="/learning" className="text-sm text-primary flex items-center mt-1">
          すべてのコンテンツを見る <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* おすすめコンテンツ */}
          <div className="space-y-4">
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
          
          {/* カテゴリー別タブ */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">カテゴリー別コンテンツ</h3>
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1.5">
                    <category.icon className="h-4 w-4" />
                    <span>{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab} className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredContents.map((content) => (
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 