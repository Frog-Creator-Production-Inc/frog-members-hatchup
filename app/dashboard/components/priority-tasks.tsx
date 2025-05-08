import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Calendar, CheckCircle, ArrowRight, Lightbulb } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/types/supabase"

interface PriorityTasksProps {
  profile: Profile
}

export default function PriorityTasks({ profile }: PriorityTasksProps) {
  // ユーザーの進捗状況に基づいて、次にやるべきステップを決定
  const determineCurrentStep = (profile: Profile) => {
    // プロフィールの完成度に基づいて判断
    
    // 仮のロジック（実際の実装では、より詳細な条件分岐が必要）
    if (!profile.migration_goal) {
      return 1; // 情報収集ステップ
    } else if (!profile.current_occupation || !profile.future_occupation) {
      return 2; // カレッジ・ビザの選択肢を知るステップ
    } else if (!profile.support_needed || !profile.abroad_timing) {
      return 3; // プランニングステップ
    } else {
      return 4; // 進捗確認と学習ステップ
    }
  }

  const currentStep = determineCurrentStep(profile);

  // サービス上でのステップ
  const serviceSteps = [
    {
      id: "information",
      title: "情報収集",
      description: "先輩たちの渡航事例を読んで、自分の未来像をイメージしましょう",
      icon: Lightbulb,
      link: "/interviews",
      cta: "インタビュー記事を読む",
      active: currentStep === 1
    },
    {
      id: "options",
      title: "カレッジ・ビザの選択肢を知る",
      description: "あなたの職種や希望に合ったカレッジとビザの組み合わせを見つけましょう",
      icon: BookOpen,
      link: "/courses",
      cta: "カレッジを探す",
      active: currentStep === 2
    },
    {
      id: "planning",
      title: "プランニング",
      description: "学校選び、入学日決定、ビザ申請の計画を立てましょう",
      icon: Calendar,
      link: "/visa",
      cta: "留学プランを作成する",
      active: currentStep === 3
    },
    {
      id: "progress",
      title: "進捗確認と学習",
      description: "申請状況を確認しながら、渡航準備のための学習を進めましょう",
      icon: CheckCircle,
      link: "/learning",
      cta: "学習コンテンツを見る",
      active: currentStep === 4
    }
  ]

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg font-medium">あなたの留学ステップ</CardTitle>
      </CardHeader>
      <CardContent>
        {/* モバイル表示（縦並び） */}
        <div className="space-y-6 md:hidden">
          {serviceSteps.map((step) => (
            <div 
              key={step.id} 
              className={`relative pl-8 ${
                step.active 
                  ? 'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary' 
                  : ''
              }`}
            >
              <div className={`flex items-start gap-3 ${step.active ? 'opacity-100' : 'opacity-70'}`}>
                <div className={`rounded-full p-2 ${step.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className={`font-medium ${step.active ? 'text-primary' : 'text-foreground'}`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {step.active && (
                    <Link 
                      href={step.link} 
                      className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      {step.cta} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
              
              {/* ステップ間の接続線 */}
              {step.id !== "progress" && (
                <div className="absolute left-3.5 top-10 h-6 w-px bg-border"></div>
              )}
            </div>
          ))}
        </div>

        {/* デスクトップ表示（横並び） */}
        <div className="hidden md:block">
          <div className="relative">
            {/* 接続線 */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-border"></div>
            
            <div className="grid grid-cols-4 gap-4">
              {serviceSteps.map((step, index) => (
                <div key={step.id} className="relative">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-3 z-10 mb-3 ${
                      step.active 
                        ? 'bg-primary text-white' 
                        : index < currentStep - 1
                          ? 'bg-green-100 text-green-600'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    
                    <h3 className={`font-medium text-center ${
                      step.active ? 'text-primary' : 'text-foreground'
                    }`}>
                      {step.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                      {step.description}
                    </p>
                    
                    {step.active && (
                      <Link 
                        href={step.link} 
                        className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline"
                      >
                        {step.cta} <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

