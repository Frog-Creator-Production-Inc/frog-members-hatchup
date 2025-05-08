"use client"

import { useState, useEffect, RefObject } from "react"
import { VideoSection } from "./video-section"
import { SubscriptionCard } from "./subscription-card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { VideoPlayer } from "./video-player"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Globe, FileText, Play, Star, ArrowRight, Clock, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface LearningContentProps {
  isMember: boolean
  userId: string
  showPremiumOnly?: boolean
  premiumSectionRef?: RefObject<HTMLDivElement>
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

export function LearningContent({ isMember, userId, showPremiumOnly = false, premiumSectionRef }: LearningContentProps) {
  const [sections, setSections] = useState<any[]>([])
  const [progress, setProgress] = useState<Record<string, { progress_seconds: number; completed: boolean }>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
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
  const filteredContents = activeTab === "all" 
    ? learningContents 
    : learningContents.filter(content => content.category === activeTab)

  // 無料コンテンツのみ
  const freeContents = learningContents.filter(content => content.isFree)
  
  // 有料コンテンツのみ
  const premiumContents = learningContents.filter(content => !content.isFree)

  useEffect(() => {
    const loadContent = async () => {
      try {
        // セクションとビデオを取得
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("video_sections")
          .select(`
            *,
            learning_videos (
              *,
              video_resources (*)
            )
          `)
          .order("order_index")

        if (sectionsError) throw sectionsError

        // 進捗状況を取得
        const { data: progressData, error: progressError } = await supabase
          .from("video_progress")
          .select("*")
          .eq("user_id", userId)

        if (progressError) throw progressError

        // 進捗データを整形
        const progressMap = progressData?.reduce((acc, curr) => {
          acc[curr.video_id] = {
            progress_seconds: curr.progress_seconds,
            completed: curr.completed,
          }
          return acc
        }, {} as Record<string, { progress_seconds: number; completed: boolean }>)

        // メンバーでStripe情報が不足している場合は更新を試みる
        if (isMember) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("stripe_customer_id, stripe_subscription_id")
            .eq("id", userId)
            .single();

          if (!profileData?.stripe_customer_id || !profileData?.stripe_subscription_id) {
            console.log("Missing Stripe information, attempting to update...");
            
            try {
              await fetch("/api/stripe/update-missing-stripe-info", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
              });
            } catch (error) {
              console.error("Failed to update Stripe information:", error);
            }
          }
        }

        setSections(sectionsData || [])
        setProgress(progressMap || {})
      } catch (error) {
        console.error("Error loading content:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isMember) {
      loadContent()
    } else {
      setLoading(false)
    }
  }, [isMember, userId, supabase])

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Stripe CheckoutのURLにリダイレクト
      if (data.url) {
        // セッションURLが返されている場合はそちらを使用
        router.push(data.url)
      } else if (data.sessionId) {
        // 後方互換性のためにセッションIDがある場合の処理を残す
        router.push(`https://checkout.stripe.com/c/pay/${data.sessionId}`)
      } else {
        throw new Error("No valid Stripe checkout URL returned")
      }
    } catch (error) {
      console.error("Error:", error)
      setIsLoading(false)
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }
  
  // プレミアムコンテンツのみを表示する場合
  if (showPremiumOnly) {
    if (!isMember) {
      return (
        <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              プレミアム学習コンテンツ
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              プレミアムコンテンツはメンバーシップに登録すると利用できます。より専門的な内容や詳細な解説が含まれています。
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                メンバーシップ特典
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>すべてのプレミアム学習コンテンツに無制限アクセス</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>専門家による添削サービスの割引</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>メンバー限定のウェビナーやイベントへの参加</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>学習進捗の詳細な分析と個別アドバイス</span>
                </li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              すべての学習コンテンツにアクセスするには、メンバーシップに登録してください。
              月額¥500で、いつでもキャンセル可能です。
            </p>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 flex justify-end pt-5">
            <Button onClick={handleSubscribe} disabled={isLoading} className="gap-2">
              {isLoading ? "処理中..." : (
                <>
                  <Sparkles className="h-4 w-4" />
                  メンバーシップに登録
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )
    }
    
    return (
      <div className="space-y-8">
        {/* カテゴリー別コンテンツ */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              プレミアム学習コンテンツ一覧
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              カテゴリー別にプレミアムコンテンツを探すことができます。
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                    <category.icon className="h-4 w-4" />
                    <span>{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {filteredContents.filter(content => !content.isFree).length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredContents.filter(content => !content.isFree).map((content) => (
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

        {/* Stripeで購入したビデオコンテンツ */}
        <div className="space-y-8 mt-8">
          {sections.map((section) => (
            <VideoSection
              key={section.id}
              title={section.title}
              description={section.description}
              videos={section.learning_videos}
              userId={userId}
              progress={progress}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* 有料コンテンツセクション */}
      <div className="space-y-6" ref={premiumSectionRef}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">プレミアムコンテンツ</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/learning/premium" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              すべて見る
            </Link>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          プレミアムコンテンツはメンバーシップに登録すると利用できます。より専門的な内容や詳細な解説が含まれています。
        </p>

        {!isMember ? (
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                プレミアム学習コンテンツ
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                プレミアムコンテンツはメンバーシップに登録すると利用できます。より専門的な内容や詳細な解説が含まれています。
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  メンバーシップ特典
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>すべてのプレミアム学習コンテンツに無制限アクセス</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>専門家による添削サービスの割引</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>メンバー限定のウェビナーやイベントへの参加</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>学習進捗の詳細な分析と個別アドバイス</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                すべての学習コンテンツにアクセスするには、メンバーシップに登録してください。
                月額¥500で、いつでもキャンセル可能です。
              </p>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 flex justify-end pt-5">
              <Button onClick={handleSubscribe} disabled={isLoading} className="gap-2">
                {isLoading ? "処理中..." : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    メンバーシップに登録
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            {/* カテゴリー別コンテンツ */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  プレミアム学習コンテンツ一覧
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  カテゴリー別にプレミアムコンテンツを探すことができます。
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    {categories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                        <category.icon className="h-4 w-4" />
                        <span>{category.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <TabsContent value={activeTab} className="space-y-4">
                    {filteredContents.filter(content => !content.isFree).length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {filteredContents.filter(content => !content.isFree).map((content) => (
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

            {/* Stripeで購入したビデオコンテンツ */}
            <div className="space-y-8 mt-8">
              {sections.map((section) => (
                <VideoSection
                  key={section.id}
                  title={section.title}
                  description={section.description}
                  videos={section.learning_videos}
                  userId={userId}
                  progress={progress}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}