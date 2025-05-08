"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, Clock, FileText, School, AlertCircle, Info, Building } from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface VisaPlan {
  id: string
  name: string
  status: string
  visa_plan_items: {
    id: string
    visa_type_id: string
    order_index: number
  }[]
}

interface StudyPlanProgressProps {
  visaPlans: VisaPlan[]
}

export default function StudyPlanProgress({ visaPlans }: StudyPlanProgressProps) {
  // 留学プランのステップ
  const studyPlanSteps = [
    {
      id: "college_selection",
      title: "学校選び",
      description: "あなたの目標に合ったカレッジを探しましょう",
      icon: Building,
      link: "/courses",
      completed: false,
      timeEstimate: "1-2週間",
      keyPoints: [
        "コースの内容と期間を確認",
        "学費と生活費の総額を計算",
        "卒業後の就職率や評判を調査"
      ],
      requiredDocuments: [
        "最終学歴の証明書",
        "英語力証明（IELTS/TOEFLなど）"
      ],
      nextAction: "興味のあるカレッジに資料請求や問い合わせをしましょう"
    },
    {
      id: "admission_date",
      title: "入学日決定",
      description: "カレッジの入学時期と申請締切を確認しましょう",
      icon: Calendar,
      link: "/courses",
      completed: false,
      timeEstimate: "1週間",
      keyPoints: [
        "多くのカレッジは年に3-4回の入学時期がある",
        "人気コースは早めに埋まることがある",
        "季節によって家賃や仕事の見つけやすさが変わる"
      ],
      requiredDocuments: [
        "パスポート（有効期限6ヶ月以上）",
        "英文履歴書（カレッジ申請用）"
      ],
      nextAction: "希望の入学日を決定し、カレンダーに逆算して準備スケジュールを立てましょう"
    },
    {
      id: "visa_planning",
      title: "ビザプランニング",
      description: "必要なビザの種類と申請手続きを確認しましょう",
      icon: FileText,
      link: "/visa",
      completed: false,
      timeEstimate: "2-3ヶ月",
      keyPoints: [
        "学生ビザは入学許可証が必要",
        "資金証明は6ヶ月分の生活費+学費",
        "健康診断が必要な国もある"
      ],
      requiredDocuments: [
        "入学許可証",
        "資金証明書",
        "パスポート（有効期限1年以上）"
      ],
      nextAction: "ビザの申請要件を確認し、必要書類の準備を始めましょう"
    },
    {
      id: "document_preparation",
      title: "書類準備",
      description: "必要な書類を準備して提出しましょう",
      icon: CheckCircle,
      link: "/dashboard/applications",
      completed: false,
      timeEstimate: "1-2ヶ月",
      keyPoints: [
        "原本と翻訳の両方が必要な場合がある",
        "公証が必要な書類もある",
        "余裕を持って準備する"
      ],
      requiredDocuments: [
        "卒業証明書（英文）",
        "成績証明書（英文）",
        "語学テスト結果（IELTS/TOEFLなど）",
        "健康診断書（必要な場合）",
        "海外保険証書"
      ],
      nextAction: "書類リストを確認し、順番に準備を進めましょう"
    }
  ]

  // ビザプランの状態に基づいてステップの完了状態を更新
  const updateStepStatus = () => {
    const updatedSteps = [...studyPlanSteps]
    
    // ビザプランがある場合
    if (visaPlans && visaPlans.length > 0) {
      updatedSteps[2].completed = true // ビザプラン作成完了
      
      // ビザプランのステータスに応じて他のステップも更新
      if (visaPlans[0].status === "approved") {
        updatedSteps[0].completed = true // カレッジ選択完了
        updatedSteps[1].completed = true // 入学日決定完了
      }
    }
    
    return updatedSteps
  }

  const processedSteps = updateStepStatus()
  
  // 完了したステップの数
  const completedSteps = processedSteps.filter(step => step.completed).length
  
  // 進捗率の計算
  const progressPercentage = Math.round((completedSteps / processedSteps.length) * 100)

  // 現在のアクティブステップ（最初の未完了ステップ）
  const activeStep = processedSteps.find(step => !step.completed) || processedSteps[processedSteps.length - 1]

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>留学プラン進捗</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">各ステップを順番に完了させて、留学準備を進めましょう。ステップをクリックすると詳細が表示されます。</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>全体の進捗</span>
            <span className="text-primary">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-4 mt-4">
          {processedSteps.map((step, index) => (
            <details 
              key={step.id} 
              className={`group ${step.id === activeStep.id ? 'open' : ''}`}
            >
              <summary className="flex items-start gap-3 cursor-pointer list-none">
                <div className={`rounded-full p-1.5 mt-0.5 ${step.completed ? 'bg-green-100' : step.id === activeStep.id ? 'bg-primary/10' : 'bg-gray-100'}`}>
                  <step.icon className={`h-4 w-4 ${
                    step.completed 
                      ? 'text-green-600' 
                      : step.id === activeStep.id 
                        ? 'text-primary' 
                        : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      step.completed 
                        ? 'text-green-600' 
                        : step.id === activeStep.id 
                          ? 'text-primary' 
                          : 'text-gray-700'
                    }`}>
                      {step.title}
                    </h4>
                    {step.completed ? (
                      <span className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        完了
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {step.timeEstimate}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              </summary>
              
              <div className="pl-8 mt-2 space-y-3">
                {step.keyPoints.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium mb-1">重要ポイント:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {step.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {step.requiredDocuments.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium mb-1">必要書類:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {step.requiredDocuments.map((doc, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {step.nextAction && (
                  <div className="bg-muted/30 p-2 rounded-md">
                    <div className="flex items-center text-xs font-medium mb-1">
                      <AlertCircle className="h-3 w-3 mr-1 text-primary" />
                      <span>次のアクション:</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.nextAction}</p>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={step.link}>
                      {step.id === "college_selection" ? "カレッジを探す" : 
                       step.id === "admission_date" ? "入学日を確認する" :
                       step.id === "visa_planning" ? "ビザプランを作成する" :
                       "書類を準備する"}
                    </Link>
                  </Button>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="pt-4">
          <Button asChild className="w-full">
            <Link href="/visa">
              {visaPlans && visaPlans.length > 0 
                ? "留学プランを続ける" 
                : "留学プランを作成する"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 