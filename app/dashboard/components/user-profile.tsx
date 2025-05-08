import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Briefcase, GraduationCap, Rocket, Home } from "lucide-react"
import type { Profile } from "@/types/supabase"

interface UserProfileProps {
  profile: Profile
  progress?: number
  showProgress?: boolean
}

export default function UserProfile({ profile, progress = 0, showProgress = true }: UserProfileProps) {
  // 英語レベルに基づいて表示するメッセージを決定
  const getEnglishLevelMessage = (level: string) => {
    const messages = {
      beginner: "英語学習を始めましょう",
      basic: "基礎英語を固めましょう",
      intermediate: "実践的な会話力を磨きましょう",
      advanced: "専門的な表現を学びましょう",
      fluent: "維持・向上を目指しましょう",
    }
    return messages[level as keyof typeof messages] || "英語力を確認しましょう"
  }

  // 目標に基づいたアイコンとメッセージを取得
  const getGoalInfo = (goal: string) => {
    const goalMessages = {
      overseas_job: {
        title: "海外就職",
        message: "海外就職に向けて、着実に準備を進めていきましょう！",
        icon: Briefcase,
      },
      improve_language: {
        title: "語学力向上",
        message: "語学力向上のため、効果的な学習方法を見つけていきましょう！",
        icon: GraduationCap,
      },
      career_change: {
        title: "キャリアチェンジ",
        message: "新しいキャリアに向けて、必要なスキルを身につけていきましょう！",
        icon: Rocket,
      },
      find_new_home: {
        title: "移住先探し",
        message: "理想の移住先を見つけるため、様々な情報を集めていきましょう！",
        icon: Home,
      },
    }
    return goalMessages[goal as keyof typeof goalMessages] || goalMessages.overseas_job
  }

  const goalInfo = getGoalInfo(profile.migration_goal || "")

  // プロフィール情報の安全な取得
  const avatarUrl = profile.avatar_url || ""
  const email = profile.email || ""
  const firstName = profile.first_name || ""
  const lastName = profile.last_name || ""
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 bg-primary text-white font-bold text-2xl">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>
              {firstName
                ? firstName.charAt(0).toUpperCase()
                : email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">
              {displayName}
            </CardTitle>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <goalInfo.icon className="h-4 w-4 mr-1 text-primary" />
              <span className="font-medium text-primary">{goalInfo.title}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>全体の進捗</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

