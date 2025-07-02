import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Briefcase, GraduationCap, Rocket, Home, 
  LightbulbIcon, BookOpen, Calendar, 
  ArrowRight, MapPin, Target, Zap,
  Info, FileText, Plane, Building, PenTool,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface UserJourneyStatusProps {
  profile: any
}

export default function UserJourneyStatus({ profile }: UserJourneyStatusProps) {
  // 渡航目的に基づいたアイコンとメッセージを取得
  const getGoalInfo = (goal: string) => {
    const goalMessages = {
      overseas_job: {
        title: "海外就職",
        message: "海外就職に向けて、着実に準備を進めていきましょう！",
        icon: Briefcase,
        color: "bg-blue-100 text-blue-800",
      },
      improve_language: {
        title: "語学力向上",
        message: "語学力向上のため、効果的な学習方法を見つけていきましょう！",
        icon: GraduationCap,
        color: "bg-green-100 text-green-800",
      },
      career_change: {
        title: "キャリアチェンジ",
        message: "新しいキャリアに向けて、必要なスキルを身につけていきましょう！",
        icon: Rocket,
        color: "bg-purple-100 text-purple-800",
      },
      find_new_home: {
        title: "移住先探し",
        message: "理想の移住先を見つけるため、様々な情報を集めていきましょう！",
        icon: Home,
        color: "bg-amber-100 text-amber-800",
      },
    }
    return goalMessages[goal as keyof typeof goalMessages] || goalMessages.overseas_job
  }

  const goalInfo = getGoalInfo(profile.migration_goal || "overseas_job");
  const GoalIcon = goalInfo.icon;

  // 渡航時期に基づいたメッセージを取得
  const getTimingInfo = (timing: string) => {
    const timings = {
      "0-3months": { 
        label: "0-3ヶ月以内", 
        urgency: "高"
      },
      "3-6months": { 
        label: "3-6ヶ月以内", 
        urgency: "中"
      },
      "6-12months": { 
        label: "6-12ヶ月以内", 
        urgency: "低"
      },
      "over12months": { 
        label: "1年以上先", 
        urgency: "計画段階"
      },
    }
    return timings[timing as keyof typeof timings] || timings["6-12months"]
  }

  const timingInfo = getTimingInfo(profile.abroad_timing || "6-12months");

  // 渡航ステップの詳細情報
  const migrationSteps = [
    {
      id: "information",
      title: "情報収集",
      icon: LightbulbIcon,
      link: "/interviews",
      description: "先輩たちの渡航事例を読んで、自分の未来像をイメージしましょう",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "college",
      title: "学校選び",
      icon: Building,
      link: "/courses",
      description: "あなたの目標と希望に合ったカレッジとビザの組み合わせを見つけましょう",
      color: "from-green-500 to-green-600"
    },
    {
      id: "planning",
      title: "ビザプランニング",
      icon: FileText,
      link: "/visa",
      description: "申請書類を準備し、ビザ申請の計画をたてましょう",
      color: "from-amber-500 to-amber-600"
    },
    {
      id: "preparation",
      title: "準備と学習",
      icon: Plane,
      link: "/learning",
      description: "申請状況を確認しながら、渡航準備と事前学習を進めましょう",
      color: "from-purple-500 to-purple-600"
    }
  ]

  // プロフィール情報の安全な取得
  const avatarUrl = profile.avatar_url || ""
  const email = profile.email || ""
  const firstName = profile.first_name || ""
  const lastName = profile.last_name || ""
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email

  return (
    <div className="space-y-6 p-6">
      {/* ユーザープロフィール情報 - 目立つデザイン */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 p-5 rounded-xl">
        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-primary text-white text-xl font-bold">
            {firstName
              ? firstName.charAt(0).toUpperCase()
              : email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <p className="text-muted-foreground mt-1">{goalInfo.message}</p>
          
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            <Badge className={goalInfo.color + " py-1 px-2"}>
              <GoalIcon className="h-3.5 w-3.5 mr-1.5" />
              {goalInfo.title}
            </Badge>
            {profile.destination_country && (
              <Badge variant="outline" className="py-1 px-2 bg-white/50">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                {profile.destination_country}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button asChild variant="outline" className="bg-white">
            <Link href="/settings">
              <PenTool className="h-4 w-4 mr-2" />
              プロフィール編集
            </Link>
          </Button>
        </div>
      </div>

      {/* 渡航ステップ - ステップ全体をボタン化 */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-primary" />
          渡航までの4ステップ
        </h3>
        
        {/* デスクトップ表示 - 横並び */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          {migrationSteps.map((step, index) => (
            <Link 
              key={step.id} 
              href={step.link}
              className="group relative flex flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className={`relative mx-4 mt-4 h-40 overflow-hidden rounded-xl text-white shadow-lg group`}>
                <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-110">
                  {index === 0 && (
                    <Image
                      src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/cb241a2106af443f822864f2b1761f38/image_cardpic_1.jpg"
                      alt="情報収集"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                  {index === 1 && (
                    <Image
                      src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/754bd84c3fba4623a12634a73e21df34/image_cardpic_2.jpg"
                      alt="学校選び"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                  {index === 2 && (
                    <Image
                      src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/1a20d7df9fbb438cba89990f6317c790/image_cardpic_3.jpg"
                      alt="ビザプランニング"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                  {index === 3 && (
                    <Image
                      src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/597d3554a877490c8c9c0bb8a636b1e6/image_cardpic_4.jpg"
                      alt="準備と学習"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
                <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300`}></div>
                <div className="absolute bottom-3 right-3">
                  <div className="rounded-full p-2 bg-white/20 backdrop-blur-sm">
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <span className="inline-block bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 mb-2 text-xs font-medium">
                  ステップ {index + 1}
                </span>

                <div className="flex items-center mb-2">
                  <h5 className="block font-sans text-lg font-semibold leading-snug tracking-normal text-gray-900 antialiased">
                    {step.title}
                  </h5>
                </div>
                <p className="block font-sans text-sm font-light leading-relaxed text-gray-600 antialiased">
                  {step.description}
                </p>
              </div>
              
              <div className="p-5 pt-0 mt-auto">
                <div className={`select-none rounded-lg py-2.5 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md transition-all hover:shadow-lg focus:opacity-[0.85] focus:shadow-none bg-gradient-to-r ${step.color} group-hover:opacity-90`}>
                  ステップを見る
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5 inline-block" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* モバイル表示 - 縦並び */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {migrationSteps.map((step, index) => (
            <Link 
              key={step.id} 
              href={step.link}
              className="group relative flex flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className={`relative mx-4 mt-4 h-28 overflow-hidden rounded-xl text-white shadow-lg`}>
                {index === 0 && (
                  <Image
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/cb241a2106af443f822864f2b1761f38/image_cardpic_1.jpg"
                    alt="情報収集"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
                {index === 1 && (
                  <Image
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/754bd84c3fba4623a12634a73e21df34/image_cardpic_2.jpg"
                    alt="学校選び"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
                {index === 2 && (
                  <Image
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/1a20d7df9fbb438cba89990f6317c790/image_cardpic_3.jpg"
                    alt="ビザプランニング"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
                {index === 3 && (
                  <Image
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/597d3554a877490c8c9c0bb8a636b1e6/image_cardpic_4.jpg"
                    alt="準備と学習"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
                <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300`}></div>
                <div className="absolute bottom-2 right-2">
                  <div className="rounded-full p-1.5 bg-white/20 backdrop-blur-sm">
                    <step.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <span className="inline-block bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 mb-2 text-xs font-medium">
                  ステップ {index + 1}
                </span>

                <div className="flex items-center mb-1">
                  <h5 className="block font-sans text-base font-semibold leading-snug tracking-normal text-gray-900 antialiased">
                    {step.title}
                  </h5>
                </div>
                <p className="block font-sans text-sm font-light leading-relaxed text-gray-600 antialiased">
                  {step.description}
                </p>
              </div>
              
              <div className="p-4 pt-0 mt-auto">
                <div className={`select-none rounded-lg py-2 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md transition-all hover:shadow-lg focus:opacity-[0.85] focus:shadow-none bg-gradient-to-r ${step.color} group-hover:opacity-90`}>
                  ステップを見る
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5 inline-block" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 