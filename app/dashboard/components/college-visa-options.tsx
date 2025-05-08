"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, MapPin, Briefcase, School, FileText, Users, GraduationCap, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Profile } from "@/types/supabase"

interface CollegeVisaOptionsProps {
  profile: Profile
}

// カレッジ情報の型定義
interface College {
  id: string
  name: string
  country: string
  city: string
  logoUrl?: string
  category: string
  forProfession: string[]
  visaOptions: string[]
  tuition: string
  duration: string
  successRate: string
  careerPath: string
  successStories: {
    name: string
    profession: string
    company: string
    quote: string
  }[]
}

export default function CollegeVisaOptions({ profile }: CollegeVisaOptionsProps) {
  const [colleges, setColleges] = useState<College[]>([])
  const [filteredColleges, setFilteredColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [selectedProfession, setSelectedProfession] = useState<string>("all")
  const [showSuccessStories, setShowSuccessStories] = useState<string | null>(null)

  // 職種のリスト
  const professions = [
    "エンジニア",
    "デザイナー",
    "マーケティング",
    "ビジネス",
    "医療",
    "教育",
    "その他"
  ]

  // 国のリスト
  const countries = [
    "カナダ",
    "オーストラリア",
    "ニュージーランド",
    "アメリカ",
    "イギリス"
  ]

  useEffect(() => {
    // カレッジ情報を取得する関数
    const fetchColleges = async () => {
      try {
        setLoading(true)
        // ダミーデータを使用（実際の実装ではAPIを呼び出す）
        const dummyColleges: College[] = [
          {
            id: "1",
            name: "バンクーバー工科大学",
            country: "カナダ",
            city: "バンクーバー",
            logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2071",
            category: "工学",
            forProfession: ["エンジニア", "IT"],
            visaOptions: ["学生ビザ", "PGWP"],
            tuition: "CA$18,000/年",
            duration: "1-2年",
            successRate: "就職率92%",
            careerPath: "Web開発 → システムエンジニア → プロジェクトマネージャー",
            successStories: [
              {
                name: "田中さん",
                profession: "フルスタックエンジニア",
                company: "Amazon Vancouver",
                quote: "1年のプログラムを修了後、PGWPで3年の就労ビザを取得。インターンシップがきっかけで大手テック企業に就職できました。"
              },
              {
                name: "佐藤さん",
                profession: "データサイエンティスト",
                company: "地元スタートアップ",
                quote: "日本での経験を活かしつつ、最新技術を学び直すことで、カナダでのキャリアをスムーズにスタートできました。"
              }
            ]
          },
          {
            id: "2",
            name: "シドニーデザインアカデミー",
            country: "オーストラリア",
            city: "シドニー",
            logoUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2032",
            category: "デザイン",
            forProfession: ["デザイナー", "クリエイティブ"],
            visaOptions: ["学生ビザ", "卒業後就労ビザ"],
            tuition: "AU$22,000/年",
            duration: "2年",
            successRate: "就職率88%",
            careerPath: "ジュニアデザイナー → シニアデザイナー → クリエイティブディレクター",
            successStories: [
              {
                name: "山田さん",
                profession: "UIデザイナー",
                company: "Canva",
                quote: "デザインの基礎から最新のUIツールまで幅広く学べたことが、大手デザイン企業への就職につながりました。"
              },
              {
                name: "鈴木さん",
                profession: "グラフィックデザイナー",
                company: "広告代理店",
                quote: "学生ビザから就労ビザへの切り替えもスムーズで、卒業後すぐに現地企業で働き始めることができました。"
              }
            ]
          },
          {
            id: "3",
            name: "トロントビジネススクール",
            country: "カナダ",
            city: "トロント",
            logoUrl: "https://images.unsplash.com/photo-1577036421869-7c8d388d2123?q=80&w=2070",
            category: "ビジネス",
            forProfession: ["ビジネス", "マーケティング"],
            visaOptions: ["学生ビザ", "PGWP", "起業家ビザ"],
            tuition: "CA$24,000/年",
            duration: "1-2年",
            successRate: "就職率85%",
            careerPath: "マーケティングアシスタント → マーケティングマネージャー → マーケティングディレクター",
            successStories: [
              {
                name: "高橋さん",
                profession: "マーケティングスペシャリスト",
                company: "Shopify",
                quote: "日本企業での経験を活かしながら、北米市場向けのマーケティングスキルを習得。大手ECプラットフォームに就職できました。"
              },
              {
                name: "伊藤さん",
                profession: "起業家",
                company: "自社ビジネス",
                quote: "ビジネスプログラムで学んだ知識と人脈を活かして起業。カナダの起業家ビザを取得し、日本食関連のビジネスを展開しています。"
              }
            ]
          },
          {
            id: "4",
            name: "オークランド医療専門学校",
            country: "ニュージーランド",
            city: "オークランド",
            logoUrl: "https://images.unsplash.com/photo-1551601651-bc60f254d532?q=80&w=2069",
            category: "医療",
            forProfession: ["医療", "看護"],
            visaOptions: ["学生ビザ", "医療従事者ビザ"],
            tuition: "NZ$25,000/年",
            duration: "3年",
            successRate: "就職率95%",
            careerPath: "看護助手 → 登録看護師 → 専門看護師",
            successStories: [
              {
                name: "中村さん",
                profession: "登録看護師",
                company: "オークランド総合病院",
                quote: "医療人材不足の業界なので、卒業後すぐに就労ビザを取得でき、安定した職場環境で働いています。"
              },
              {
                name: "小林さん",
                profession: "介護士",
                company: "高齢者ケア施設",
                quote: "日本での介護経験を活かしながら、ニュージーランドの資格を取得。給与水準も高く、ワークライフバランスも充実しています。"
              }
            ]
          },
          {
            id: "5",
            name: "メルボルン語学学校",
            country: "オーストラリア",
            city: "メルボルン",
            logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2071",
            category: "語学",
            forProfession: ["教育", "その他"],
            visaOptions: ["学生ビザ", "ワーキングホリデー"],
            tuition: "AU$15,000/年",
            duration: "6ヶ月-1年",
            successRate: "進学率80%",
            careerPath: "語学習得 → 専門学校/大学進学 → 専門職",
            successStories: [
              {
                name: "渡辺さん",
                profession: "英語教師",
                company: "語学学校",
                quote: "語学力ゼロからスタートし、1年間の集中コースで英語を習得。その後TESOLコースに進み、現在は語学教師として働いています。"
              },
              {
                name: "木村さん",
                profession: "ホスピタリティマネージャー",
                company: "高級ホテル",
                quote: "語学学校で基礎を固めた後、ホスピタリティコースに進学。ワーキングホリデーでの経験も活かして正社員として採用されました。"
              }
            ]
          },
        ]
        
        setColleges(dummyColleges)
        setFilteredColleges(dummyColleges)
      } catch (error) {
        console.error("カレッジ情報の取得に失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchColleges()
  }, [])

  // フィルター適用
  useEffect(() => {
    let filtered = [...colleges]
    
    if (selectedCountry !== "all") {
      filtered = filtered.filter(college => college.country === selectedCountry)
    }
    
    if (selectedProfession !== "all") {
      filtered = filtered.filter(college => 
        college.forProfession.some(profession => 
          profession.toLowerCase().includes(selectedProfession.toLowerCase())
        )
      )
    }
    
    setFilteredColleges(filtered)
  }, [colleges, selectedCountry, selectedProfession])

  // プロフィールから推奨カレッジを取得
  const getRecommendedColleges = () => {
    // プロフィールの職業に基づいて推奨
    const currentOccupation = profile.current_occupation || ""
    const futureOccupation = profile.future_occupation || ""
    
    // 職業に基づくフィルタリング
    let recommended = colleges.filter(college => {
      return college.forProfession.some(profession => {
        return currentOccupation.toLowerCase().includes(profession.toLowerCase()) ||
               futureOccupation.toLowerCase().includes(profession.toLowerCase())
      })
    })
    
    // 推奨カレッジがない場合は全て表示
    if (recommended.length === 0) {
      recommended = colleges
    }
    
    return recommended.slice(0, 3) // 最大3件表示
  }

  // 成功事例の表示/非表示を切り替える
  const toggleSuccessStories = (collegeId: string) => {
    if (showSuccessStories === collegeId) {
      setShowSuccessStories(null)
    } else {
      setShowSuccessStories(collegeId)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>おすすめのカレッジ・ビザ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">おすすめのカレッジ・ビザ</h2>
        <Link href="/courses" className="text-sm text-primary">
          すべてのコースを見る
        </Link>
      </div>

      {/* フィルター */}
      <Card className="bg-muted/40">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">フィルター:</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">国</label>
                <select
                  className="w-full p-2 rounded-md border border-input bg-background"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="all">すべての国</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">職種</label>
                <select
                  className="w-full p-2 rounded-md border border-input bg-background"
                  value={selectedProfession}
                  onChange={(e) => setSelectedProfession(e.target.value)}
                >
                  <option value="all">すべての職種</option>
                  {professions.map((profession) => (
                    <option key={profession} value={profession}>{profession}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カレッジリスト */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredColleges.length > 0 ? (
          filteredColleges.map((college) => (
            <div key={college.id}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 w-full">
                  {college.logoUrl ? (
                    <Image
                      src={college.logoUrl}
                      alt={college.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <School className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white">{college.category}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-2">{college.name}</h3>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{college.city}, {college.country}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      <span>{college.duration}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{college.tuition}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 mr-1" />
                      <span>{college.successRate}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{college.forProfession.join(", ")}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">利用可能なビザ:</div>
                    <div className="flex flex-wrap gap-2">
                      {college.visaOptions.map((visa, index) => (
                        <Badge key={index} variant="outline">{visa}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">キャリアパス:</div>
                    <p className="text-xs text-muted-foreground">{college.careerPath}</p>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button asChild size="sm" variant="default">
                      <Link href={`/courses?school=${college.id}`}>
                        コースを見る
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleSuccessStories(college.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      成功事例
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* 成功事例の表示 */}
              {showSuccessStories === college.id && (
                <Card className="mt-3 border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">卒業生の成功事例</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {college.successStories.map((story, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm">{story.name}</h4>
                          <Badge variant="secondary" className="text-xs">{story.profession}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{story.company}</p>
                        <blockquote className="text-xs italic border-l-2 pl-2 border-primary/30">
                          "{story.quote}"
                        </blockquote>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            条件に一致するカレッジが見つかりませんでした
          </div>
        )}
      </div>
    </div>
  )
} 