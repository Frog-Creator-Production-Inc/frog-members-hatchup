import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/types/supabase"

interface RecommendedInfoProps {
  profile: Profile
}

export default function RecommendedInfo({ profile }: RecommendedInfoProps) {
  // プロフィールに基づいておすすめ情報を生成
  const getRecommendedInfo = (profile: Profile) => {
    const info = []

    // 英語レベルに基づくおすすめ
    if (profile.english_level === "beginner" || profile.english_level === "basic") {
      info.push({
        id: "english-study",
        title: "効率的な英語学習方法",
        description: "初心者向けの学習プランを紹介",
        link: "/resources/english-study",
      })
    }

    // ワーホリステータスに基づくおすすめ
    if (profile.working_holiday === "eligible") {
      info.push({
        id: "working-holiday",
        title: "ワーホリビザ申請ガイド",
        description: "申請手順と必要書類の解説",
        link: "/resources/visa-guide",
      })
    }

    // 渡航時期に基づくおすすめ
    if (profile.travel_timing === "3months" || profile.travel_timing === "6months") {
      info.push({
        id: "preparation",
        title: "渡航前の準備チェックリスト",
        description: "必要な準備を時系列で解説",
        link: "/resources/preparation",
      })
    }

    // デフォルトのおすすめ情報
    if (info.length < 3) {
      info.push({
        id: "general",
        title: "海外就職成功事例集",
        description: "先輩たちの体験談を読む",
        link: "/resources/success-stories",
      })
    }

    return info
  }

  const recommendedInfo = getRecommendedInfo(profile)

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-medium">おすすめ情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendedInfo.map((info) => (
            <Link
              key={info.id}
              href={info.link}
              className="block space-y-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{info.title}</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{info.description}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

