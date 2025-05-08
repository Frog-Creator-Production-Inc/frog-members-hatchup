"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ProgressBar from "./components/ProgressBar"
import { getCurrentLocations, getGoalLocations, getJobPositions } from "@/lib/supabase/queries"
import type { Profile, CurrentLocation, GoalLocation, JobPosition } from "@/types/supabase"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { CheckCircle2, ArrowRight, Info } from "lucide-react"
import { notifyNewUser } from '@/lib/slack/notifications'

const questions = [
  {
    id: "name",
    type: "name",
    question: "お名前を英語（アルファベット）で入力してください",
  },
  {
    id: "birth_date",
    type: "birth_date",
    question: "生年月日を教えてください",
  },
  {
    id: "migration_goal",
    question: "海外に行く目的は何ですか？",
    options: [
      { id: "overseas_job", label: "海外就職" },
      { id: "improve_language", label: "語学力向上" },
      { id: "career_change", label: "キャリアチェンジ" },
      { id: "find_new_home", label: "移住" },
    ],
  },
  {
    id: "english_level",
    question: "現在の英語レベルを教えてください。",
    options: [
      { id: "beginner", label: "初心者（日常会話も難しい）" },
      { id: "intermediate", label: "中級者（日常会話ができる）" },
      { id: "advanced", label: "上級者（ビジネスでも使える）" },
      { id: "native", label: "ネイティブレベル" },
    ],
  },
  {
    id: "work_experience",
    question: "現在の職務経験年数を教えてください。",
    options: [
      { id: "0-2", label: "0-2年" },
      { id: "3-5", label: "3-5年" },
      { id: "6-10", label: "6-10年" },
      { id: "10+", label: "10年以上" },
    ],
  },
  {
    id: "working_holiday",
    question: "ワーキングホリデービザの申請を検討していますか？",
    options: [
      { id: "yes", label: "はい、検討しています" },
      { id: "no", label: "いいえ、検討していません" },
      { id: "already_applied", label: "すでに申請しました" },
      { id: "not_eligible", label: "対象年齢ではありません" },
    ],
  },
  {
    id: "age_range",
    question: "年齢層を教えてください。",
    options: [
      { id: "18-25", label: "18-25歳" },
      { id: "26-30", label: "26-30歳" },
      { id: "31-35", label: "31-35歳" },
      { id: "36-40", label: "36-40歳" },
      { id: "40+", label: "40歳以上" },
    ],
  },
  {
    id: "abroad_timing",
    question: "いつ頃の海外渡航を考えていますか？",
    options: [
      { id: "asap", label: "できるだけ早く" },
      { id: "within_6_months", label: "6ヶ月以内" },
      { id: "within_1_year", label: "1年以内" },
      { id: "1_year_plus", label: "1年以上先" },
    ],
  },
  {
    id: "support_needed",
    question: "どのようなサポートが必要ですか？（複数選択可）",
    options: [
      { id: "visa", label: "ビザ申請サポート" },
      { id: "job_search", label: "就職先の紹介" },
      { id: "language_study", label: "語学学習サポート" },
      { id: "accommodation", label: "住居探しサポート" },
      { id: "cultural_adjustment", label: "文化適応サポート" },
    ],
    multiple: true,
  },
  {
    id: "current_location_id",
    question: "現在お住まいの地域を教えてください。",
    type: "location",
  },
  {
    id: "goal_location_id",
    question: "希望する渡航先を教えてください。",
    type: "location",
  },
  {
    id: "current_occupation",
    question: "現在の職業を教えてください。",
    type: "text",
  },
  {
    id: "future_occupation",
    question: "希望する職種を教えてください。",
    type: "job_position",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<Partial<Profile> | null>(null)
  const [currentLocations, setCurrentLocations] = useState<CurrentLocation[]>([])
  const [goalLocations, setGoalLocations] = useState<GoalLocation[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [showCompletionButton, setShowCompletionButton] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIntroduction, setShowIntroduction] = useState(true)

  useEffect(() => {
    checkSession()
    fetchLocations()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth")
        return
      }

      console.log("セッション確認: ユーザーID", session.user.id)

      // プロファイルの取得
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (error) {
        console.log("プロフィール取得エラー:", error)
        
        if (error.code === "PGRST116") {
          console.log("プロフィールが存在しません。新規作成を試みます。")
          
          // プロファイルが存在しない場合は作成
          const newProfileData = {
            id: session.user.id,
            email: session.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarding_completed: false
          }
          
          console.log("作成するプロフィールデータ:", newProfileData)
          
          // 念のため3回まで試行する
          let retryCount = 0
          let createSuccess = false
          let createdProfile = null
          
          while (retryCount < 3 && !createSuccess) {
            try {
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .upsert(newProfileData, {
                  onConflict: 'id'
                })
                .select()
                .single()

              if (createError) {
                console.error(`プロフィール作成エラー (試行 ${retryCount + 1}/3):`, createError)
                retryCount++
                // 少し待ってから再試行
                await new Promise(resolve => setTimeout(resolve, 500))
              } else {
                console.log("プロフィール作成成功:", newProfile)
                createdProfile = newProfile
                createSuccess = true
              }
            } catch (e) {
              console.error(`プロフィール作成例外 (試行 ${retryCount + 1}/3):`, e)
              retryCount++
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
          
          if (createSuccess && createdProfile) {
            setProfile(createdProfile)
          } else {
            // 3回試行しても失敗した場合
            toast.error("プロフィールの作成に失敗しました。ページを再読み込みしてください。")
            // 強制的に再読み込み
            window.location.reload()
            return
          }
        } else {
          toast.error("プロフィールの取得に失敗しました")
          console.error("予期せぬプロフィール取得エラー:", error)
          return
        }
      } else {
        console.log("既存のプロフィールを取得:", profile)
        if (profile.onboarding_completed) {
          console.log("オンボーディング完了済み、ダッシュボードへリダイレクト")
          router.push("/dashboard")
          return
        }
        setProfile(profile)
      }
    } catch (error) {
      console.error("セッション確認エラー:", error)
      toast.error("セッションの確認中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const [currentLocs, goalLocs, jobPositionsData] = await Promise.all([
        getCurrentLocations(),
        getGoalLocations(),
        getJobPositions()
      ])
      console.log("Current locations:", currentLocs)
      console.log("Goal locations:", goalLocs)
      setCurrentLocations(currentLocs)
      setGoalLocations(goalLocs)
      setJobPositions(jobPositionsData || [])
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const handleAnswer = (id: string, value: any) => {
    console.log(`Handling answer for question ${id} with value:`, value)
    
    // 回答を保存
    setAnswers((prev) => {
      const newAnswers = { ...prev, [id]: value };
      console.log("Updated answers:", newAnswers);
      return newAnswers;
    })
    
    // future_occupationの場合は特別な処理は不要（コンポーネント内で直接処理）
    if (id === "future_occupation") {
      return;
    }
    
    // 次の質問に進む
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      // 最後の質問の場合は、submitAnswersを呼び出す
      submitAnswers()
    }
  }

  // 前の質問に戻る関数
  const handleGoBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      // 最後の質問から戻る場合は完了ボタンを非表示にする
      if (currentQuestionIndex === questions.length - 1) {
        setShowCompletionButton(false);
      }
    }
  }

  const submitAnswers = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth")
        return
      }

      // 更新用のデータ
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // 各回答をupdateDataに追加
      Object.entries(answers).forEach(([key, value]) => {
        console.log(`Processing answer for ${key}:`, value)
        
        if (key === "name") {
          const nameValue = value as { first_name: string; last_name: string }
          updateData.first_name = nameValue.first_name
          updateData.last_name = nameValue.last_name
        } else if (key === "future_occupation") {
          // future_occupationは直接job_positionsテーブルのIDを参照する
          updateData.future_occupation = value as string
          console.log("Setting future_occupation to:", value)
        } else if (key === "birth_date") {
          // birth_dateはそのままdate型として保存
          updateData.birth_date = value as string
          console.log("Setting birth_date to:", value)
        } else if (Array.isArray(value)) {
          // 複数選択の場合はカンマ区切りの文字列に変換
          (updateData as any)[key] = value.join(",")
        } else {
          // 単一選択の場合はそのまま代入
          (updateData as any)[key] = value
        }
      })

      // オンボーディング完了フラグを設定
      updateData.onboarding_completed = true

      console.log("Final update data:", updateData)

      // プロファイル更新
      console.log("Updating profile with data:", updateData);
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", session.user.id)

      if (updateError) {
        console.error("Profile update error:", updateError)
        toast.error(`プロフィールの更新に失敗しました: ${updateError.message}`)
        setIsSubmitting(false);
        return
      }

      // 更新後のプロフィールを取得して確認
      console.log("Profile updated, fetching updated profile");
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (fetchError) {
        console.error("Error fetching updated profile:", fetchError)
      } else {
        console.log("Updated profile:", updatedProfile)
      }

      // ユーザー情報を取得してSlack通知を送信
      const userName = updateData.first_name && updateData.last_name
        ? `${updateData.first_name} ${updateData.last_name}`
        : session.user.email
      
      // Slack通知の詳細をログ出力
      console.log('=== オンボーディング完了：Slack通知送信開始 ===');
      console.log('通知データ:', {
        userId: session.user.id,
        email: session.user.email || "不明",
        userName: userName,
        timestamp: new Date().toISOString(),
        onboardingCompleted: true
      });

      try {
        // 選択した職種IDからタイトルを取得
        let jobTitle = "不明";
        if (answers.future_occupation) {
          const selectedJob = jobPositions.find(job => job.id === answers.future_occupation);
          if (selectedJob) {
            jobTitle = selectedJob.title;
          }
        }
        
        // プロフィール情報を準備
        const profileInfo: Record<string, any> = {
          ...updateData,
          future_occupation_title: jobTitle
        };
        
        console.log('=========== デバッグログ：Slack通知 ===========');
        console.log('Slack通知に含めるプロフィール情報:', JSON.stringify(profileInfo, null, 2));
        console.log('環境変数SLACK_ADMIN_WEBHOOK_URL:', process.env.SLACK_ADMIN_WEBHOOK_URL ? '設定済み' : '未設定');
        console.log('環境変数NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '未設定');
        console.log('環境変数NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || '未設定');
        
        // APIを使用してSlack通知を送信
        console.log('サーバーサイドAPIによる通知を送信します...');
        console.time('Slack通知処理時間');
        
        // 絶対URLを構築
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/slack/notify-onboarding`;
        console.log('通知APIエンドポイント:', apiUrl);
        
        const notifyResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            profileData: profileInfo,
          }),
        });
        
        console.log('Slack通知APIレスポンスステータス:', notifyResponse.status);
        console.timeEnd('Slack通知処理時間');
        
        if (notifyResponse.ok) {
          console.log('=== Slack通知が成功しました ===');
        } else {
          console.error('=== Slack通知が失敗しました ===', notifyResponse.status, notifyResponse.statusText);
          // 失敗した場合もエラーログを出力するのみで、ユーザーエクスペリエンスに影響しないようにする
        }
      } catch (notifyError) {
        console.error('=== Slack通知エラー ===');
        console.error('エラーの種類:', notifyError instanceof Error ? notifyError.name : typeof notifyError);
        console.error('エラーメッセージ:', notifyError instanceof Error ? notifyError.message : String(notifyError));
        console.error('エラースタック:', notifyError instanceof Error ? notifyError.stack : 'スタックなし');
        // エラーがあっても処理を続行
      }
      
      toast.success("プロフィールが更新されました")
      
      // ダッシュボードに遷移
      router.push("/dashboard")
    } catch (error) {
      console.error("Error submitting answers:", error)
      toast.error("回答の送信中にエラーが発生しました。もう一度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case "name":
        return (
          <NameQuestion 
            onAnswer={(value) => handleAnswer("name", value)} 
            onGoBack={handleGoBack}
            showBackButton={currentQuestionIndex > 0}
          />
        )
      case "birth_date":
        return (
          <BirthDateQuestion 
            onAnswer={(value) => handleAnswer("birth_date", value)} 
            onGoBack={handleGoBack}
            showBackButton={currentQuestionIndex > 0}
          />
        )
      case "location":
        if (currentQuestion.id === "current_location_id") {
          return (
            <LocationQuestion
              locations={currentLocations}
              onAnswer={handleAnswer}
              questionId={currentQuestion.id}
              onGoBack={handleGoBack}
              showBackButton={currentQuestionIndex > 0}
            />
          )
        } else if (currentQuestion.id === "goal_location_id") {
          return (
            <LocationQuestion
              locations={goalLocations}
              onAnswer={handleAnswer}
              questionId={currentQuestion.id}
              onGoBack={handleGoBack}
              showBackButton={currentQuestionIndex > 0}
            />
          )
        }
        return null
      case "job_position":
        return (
          <JobPositionQuestion
            jobPositions={jobPositions}
            onAnswer={handleAnswer}
            questionId={currentQuestion.id}
            onGoBack={handleGoBack}
            showBackButton={currentQuestionIndex > 0}
            answers={answers}
          />
        )
      case "text":
        return (
          <TextQuestion
            question={currentQuestion.question}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
            onGoBack={handleGoBack}
            showBackButton={currentQuestionIndex > 0}
          />
        )
      default:
        return (
          <MultipleChoiceQuestion
            question={currentQuestion.question}
            options={currentQuestion.options || []}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
            multiple={currentQuestion.multiple}
            onGoBack={handleGoBack}
            showBackButton={currentQuestionIndex > 0}
          />
        )
    }
  }

  const IntroductionCard = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">オンボーディングプロセスについて</h1>
        </div>
        
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">プロフィール情報の収集</h3>
              <p className="text-gray-600">あなたの目標や希望に合わせた最適なサポートを提供するために、基本的な情報を収集させていただきます。</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-4 p-4 bg-green-50 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">カスタマイズされたプラン</h3>
              <p className="text-gray-600">収集した情報を基に、あなたに最適な海外留学プランを作成いたします。</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">専門家によるサポート</h3>
              <p className="text-gray-600">経験豊富な専門家が、あなたの海外移住を全面的にサポートいたします。</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex justify-end"
        >
          <Button
            onClick={() => setShowIntroduction(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            次へ進む
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
        {showIntroduction ? (
          <IntroductionCard />
        ) : (
          <div className="mt-6">
            {renderQuestion()}
          </div>
        )}
      </div>
    </div>
  )
}

// 名前入力用コンポーネント
const NameQuestion = ({
  onAnswer,
  onGoBack,
  showBackButton,
}: {
  onAnswer: (answer: { first_name: string; last_name: string }) => void
  onGoBack: () => void
  showBackButton: boolean
}) => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim()) {
      setError("姓名を入力してください")
      return
    }

    // 英字のみの正規表現
    const englishOnly = /^[A-Za-z\s]+$/

    if (!englishOnly.test(firstName) || !englishOnly.test(lastName)) {
      setError("英語（アルファベット）で入力してください")
      return
    }

    onAnswer({
      first_name: firstName.trim(),
      last_name: lastName.trim()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 mb-8">
        <Image
          src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
          alt="Frog Mascot"
          width={60}
          height={60}
          className="flex-shrink-0"
        />
        <p className="text-lg font-medium pt-2">お名前を英語（アルファベット）で入力してください</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="space-y-5">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name (名)
            </label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setError("")
              }}
              placeholder="Taro"
              className="w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name (姓)
            </label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                setError("")
              }}
              placeholder="Yamada"
              className="w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-300"
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-500 mt-3">{error}</p>
        )}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">注意:</span> 正確な英語表記のお名前を入力してください。これは各種申請書類に使用されます。
          </p>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        {showBackButton && (
          <Button 
            onClick={onGoBack} 
            variant="outline"
          >
            戻る
          </Button>
        )}
        {!showBackButton && <div />}
        <Button 
          onClick={handleSubmit}
          className="px-5 py-2 font-medium"
        >
          次へ
        </Button>
      </div>
    </div>
  )
}

// 誕生日入力用コンポーネント
const BirthDateQuestion = ({
  onAnswer,
  onGoBack,
  showBackButton,
}: {
  onAnswer: (answer: string) => void
  onGoBack: () => void
  showBackButton: boolean
}) => {
  const [year, setYear] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [day, setDay] = useState<string>("")
  const [error, setError] = useState<string>("")

  // 年の選択肢（現在の年から100年前まで）
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  
  // 月の選択肢
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  
  // 日の選択肢（選択された年と月に基づいて動的に生成）
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }
  
  const days = year && month 
    ? Array.from({ length: getDaysInMonth(parseInt(year), parseInt(month)) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1)

  const handleSubmit = () => {
    if (!year || !month || !day) {
      setError("生年月日を完全に入力してください")
      return
    }
    
    const birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    
    // 日付の妥当性チェック
    try {
      const date = new Date(birthDate)
      if (isNaN(date.getTime())) {
        setError("有効な日付を入力してください")
        return
      }
      
      // 未来の日付はNG
      if (date > new Date()) {
        setError("未来の日付は入力できません")
        return
      }
      
      onAnswer(birthDate)
    } catch (e) {
      setError("有効な日付を入力してください")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 mb-8">
        <Image
          src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
          alt="Frog Mascot"
          width={60}
          height={60}
          className="flex-shrink-0"
        />
        <p className="text-lg font-medium pt-2">生年月日を教えてください</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <p className="text-sm text-gray-700 mb-4">
          ビザの要件や申請条件を確認するために必要です。正確な日付を入力してください。
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              年
            </label>
            <Select onValueChange={value => {setYear(value); setError("")}}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700">
                <SelectValue placeholder="年" className="text-gray-400" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
              月
            </label>
            <Select onValueChange={value => {setMonth(value); setError("")}}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700">
                <SelectValue placeholder="月" className="text-gray-400" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {months.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-2">
              日
            </label>
            <Select onValueChange={value => {setDay(value); setError("")}}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700">
                <SelectValue placeholder="日" className="text-gray-400" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {days.map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-500 mt-3">{error}</p>
        )}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">注意:</span> 生年月日はビザ申請において重要な情報です。正確に入力してください。
          </p>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        {showBackButton && (
          <Button 
            onClick={onGoBack} 
            variant="outline"
          >
            戻る
          </Button>
        )}
        {!showBackButton && <div />}
        <Button 
          onClick={handleSubmit}
          className="px-5 py-2 font-medium"
        >
          次へ
        </Button>
      </div>
    </div>
  )
}

// テキスト入力用コンポーネント
const TextQuestion = ({
  question,
  onAnswer,
  onGoBack,
  showBackButton,
}: {
  question: string
  onAnswer: (answer: string) => void
  onGoBack: () => void
  showBackButton: boolean
}) => {
  const [textInput, setTextInput] = useState("")

  const handleSubmit = () => {
    if (textInput.trim()) {
      onAnswer(textInput.trim())
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 mb-8">
        <Image
          src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
          alt="Frog Mascot"
          width={60}
          height={60}
          className="flex-shrink-0"
        />
        <p className="text-lg font-medium pt-2">{question}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="w-full">
          <Input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="こちらに入力してください"
            className="w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-300"
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        {showBackButton && (
          <Button 
            onClick={onGoBack} 
            variant="outline"
          >
            戻る
          </Button>
        )}
        {!showBackButton && <div />}
        <Button
          onClick={handleSubmit}
          disabled={!textInput.trim()}
          className="px-5 py-2 font-medium"
        >
          次へ
        </Button>
      </div>
    </div>
  )
}

// 複数選択用コンポーネント
const MultipleChoiceQuestion = ({
  question,
  options,
  onAnswer,
  multiple,
  onGoBack,
  showBackButton,
}: {
  question: string
  options: Array<{ id: string; label: string }>
  onAnswer: (answer: string | string[]) => void
  multiple?: boolean
  onGoBack: () => void
  showBackButton: boolean
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const handleOptionClick = (optionId: string) => {
    if (multiple) {
      const updatedOptions = selectedOptions.includes(optionId)
        ? selectedOptions.filter((id) => id !== optionId)
        : [...selectedOptions, optionId]
      setSelectedOptions(updatedOptions)
    } else {
      setSelectedOptions([optionId])
      onAnswer(optionId)
    }
  }

  const handleSubmit = () => {
    if (multiple && selectedOptions.length > 0) {
      onAnswer(selectedOptions)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 mb-8">
        <Image
          src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
          alt="Frog Mascot"
          width={60}
          height={60}
          className="flex-shrink-0"
        />
        <p className="text-lg font-medium pt-2">{question}</p>
      </div>
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            className={`w-full p-4 flex items-center gap-3 bg-white rounded-xl border ${
              selectedOptions.includes(option.id)
                ? "border-primary"
                : "border-gray-200"
            } hover:bg-gray-50 transition-colors text-left`}
          >
            {multiple && (
              <Checkbox
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={() => handleOptionClick(option.id)}
              />
            )}
            <span className="flex-grow">{option.label}</span>
          </button>
        ))}
      </div>
      {multiple && (
        <div className="flex justify-between mt-6">
          {showBackButton && (
            <Button 
              onClick={onGoBack} 
              variant="outline"
            >
              戻る
            </Button>
          )}
          {!showBackButton && <div />}
          <Button 
            onClick={handleSubmit} 
            disabled={selectedOptions.length === 0}
            className="px-5 py-2 font-medium"
          >
            次へ
          </Button>
        </div>
      )}
      {!multiple && showBackButton && (
        <div className="flex justify-start mt-6">
          <Button 
            onClick={onGoBack} 
            variant="outline"
          >
            戻る
          </Button>
        </div>
      )}
    </div>
  )
}

// 地域選択用コンポーネント
const LocationQuestion = ({
  locations,
  onAnswer,
  questionId,
  onGoBack,
  showBackButton,
}: {
  locations: (CurrentLocation | GoalLocation)[]
  onAnswer: (id: string, value: any) => void
  questionId: string
  onGoBack: () => void
  showBackButton: boolean
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedLocationName, setSelectedLocationName] = useState<string>("")

  const handleSelect = (locationId: string) => {
    setSelectedLocation(locationId)
    
    // 選択された地域の名前を表示用に取得
    const selected = locations.find(location => location.id === locationId)
    if (selected) {
      setSelectedLocationName('city' in selected ? `${selected.city}, ${selected.country}` : selected.name)
    }
  }

  const handleSubmit = () => {
    if (selectedLocation) {
      onAnswer(questionId, selectedLocation)
    }
  }

  // 質問IDに基づいて質問文を取得
  const questionText = questions.find(q => q.id === questionId)?.question || ""

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 mb-8">
        <Image
          src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
          alt="Frog Mascot"
          width={60}
          height={60}
          className="flex-shrink-0"
        />
        <p className="text-lg font-medium pt-2">{questionText}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="w-full">
          <Select onValueChange={handleSelect}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700">
              <SelectValue placeholder="地域を選択してください" className="text-gray-400" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-auto">
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {'city' in location ? `${location.city}, ${location.country}` : location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        {showBackButton && (
          <Button 
            onClick={onGoBack} 
            variant="outline"
          >
            戻る
          </Button>
        )}
        {!showBackButton && <div />}
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedLocation}
          className="px-5 py-2 font-medium"
        >
          次へ
        </Button>
      </div>
    </div>
  )
}

// 職種選択用コンポーネント
const JobPositionQuestion = ({
  jobPositions,
  onAnswer,
  questionId,
  onGoBack,
  showBackButton,
  answers,
}: {
  jobPositions: JobPosition[]
  onAnswer: (id: string, value: any) => void
  questionId: string
  onGoBack: () => void
  showBackButton: boolean
  answers: Record<string, any>
}) => {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSelect = (positionId: string) => {
    console.log("Selected position ID:", positionId);
    // 選択された職種のIDを設定
    setSelectedPosition(positionId);
    
    // 選択された職種のタイトルを取得
    const selectedJob = jobPositions.find(job => job.id === positionId);
    if (selectedJob) {
      setSelectedJobTitle(selectedJob.title);
    }
    
    setError(null); // エラーをクリア
  }

  const handleSubmit = async () => {
    if (!selectedPosition) {
      setError("希望する職種を選択してください");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // セッションを取得
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        console.error("No session found")
        toast.error("セッションが見つかりません")
        setIsSubmitting(false);
        return
      }
      
      // 親コンポーネントのanswersを取得
      const allAnswers = { ...answers, [questionId]: selectedPosition };
      
      // プロファイル更新データを準備
      const updateData: Partial<Profile> = {
        updated_at: new Date().toISOString(),
        onboarding_completed: true
      }
      
      // 各回答をupdateDataに追加
      Object.entries(allAnswers).forEach(([key, value]) => {
        console.log(`Processing answer for ${key}:`, value)
        
        if (key === "name") {
          const nameValue = value as { first_name: string; last_name: string }
          updateData.first_name = nameValue.first_name
          updateData.last_name = nameValue.last_name
        } else if (key === "future_occupation") {
          // future_occupationは直接job_positionsテーブルのIDを参照する
          updateData.future_occupation = value as string
          console.log("Setting future_occupation to:", value)
        } else if (key === "birth_date") {
          // birth_dateはそのままdate型として保存
          updateData.birth_date = value as string
          console.log("Setting birth_date to:", value)
        } else if (Array.isArray(value)) {
          // 複数選択の場合はカンマ区切りの文字列に変換
          (updateData as any)[key] = value.join(",")
        } else {
          // 単一選択の場合はそのまま代入
          (updateData as any)[key] = value
        }
      })
      
      console.log("Final update data:", updateData)
      
      // プロファイル更新
      console.log("Updating profile with data:", updateData);
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", session.user.id)

      if (updateError) {
        console.error("Profile update error:", updateError)
        toast.error(`プロフィールの更新に失敗しました: ${updateError.message}`)
        setIsSubmitting(false);
        return
      }
      
      toast.success("プロフィールが更新されました")
      
      // ユーザー情報を取得してSlack通知を送信
      const userName = updateData.first_name && updateData.last_name
        ? `${updateData.first_name} ${updateData.last_name}`
        : session.user.email

      // Slack通知の詳細をログ出力
      console.log('=== オンボーディング完了：Slack通知送信開始 ===');
      console.log('通知データ:', {
        userId: session.user.id,
        email: session.user.email || "不明",
        userName: userName,
        timestamp: new Date().toISOString(),
        onboardingCompleted: true
      });

      try {
        // 選択した職種IDからタイトルを取得
        let jobTitle = "不明";
        if (answers.future_occupation) {
          const selectedJob = jobPositions.find(job => job.id === answers.future_occupation);
          if (selectedJob) {
            jobTitle = selectedJob.title;
          }
        }
        
        // プロフィール情報を準備
        const profileInfo: Record<string, any> = {
          ...updateData,
          future_occupation_title: jobTitle
        };
        
        console.log('=========== デバッグログ：Slack通知 ===========');
        console.log('Slack通知に含めるプロフィール情報:', JSON.stringify(profileInfo, null, 2));
        console.log('環境変数SLACK_ADMIN_WEBHOOK_URL:', process.env.SLACK_ADMIN_WEBHOOK_URL ? '設定済み' : '未設定');
        console.log('環境変数NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '未設定');
        console.log('環境変数NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || '未設定');
        
        // APIを使用してSlack通知を送信
        console.log('サーバーサイドAPIによる通知を送信します...');
        console.time('Slack通知処理時間');
        
        // 絶対URLを構築
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/slack/notify-onboarding`;
        console.log('通知APIエンドポイント:', apiUrl);
        
        const notifyResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            profileData: profileInfo,
          }),
        });
        
        console.log('Slack通知APIレスポンスステータス:', notifyResponse.status);
        console.timeEnd('Slack通知処理時間');
        
        if (notifyResponse.ok) {
          console.log('=== Slack通知が成功しました ===');
        } else {
          console.error('=== Slack通知が失敗しました ===', notifyResponse.status, notifyResponse.statusText);
          // 失敗した場合もエラーログを出力するのみで、ユーザーエクスペリエンスに影響しないようにする
        }
      } catch (notifyError) {
        console.error('=== Slack通知エラー ===');
        console.error('エラーの種類:', notifyError instanceof Error ? notifyError.name : typeof notifyError);
        console.error('エラーメッセージ:', notifyError instanceof Error ? notifyError.message : String(notifyError));
        console.error('エラースタック:', notifyError instanceof Error ? notifyError.stack : 'スタックなし');
        // エラーがあっても処理を続行
      }

      // ダッシュボードに遷移
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(`プロフィールの更新中にエラーが発生しました: ${error.message}`)
      setIsSubmitting(false);
    }
  }

  // 質問IDに基づいて質問文を取得
  const questionText = questions.find(q => q.id === questionId)?.question || ""

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 mb-8">
        <Image
          src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
          alt="Frog Mascot"
          width={60}
          height={60}
          className="flex-shrink-0"
        />
        <p className="text-lg font-medium pt-2">{questionText} <span className="text-red-500">*</span></p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <p className="text-sm text-gray-700 mb-3">
          あなたが目指す職種を選択してください。この情報はプロフィールに保存され、あなたに最適なコースを推奨するために使用されます。
        </p>
        <div className="w-full">
          <Select onValueChange={handleSelect} disabled={isSubmitting}>
            <SelectTrigger className={`w-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700 ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="職種を選択してください" className="text-gray-400" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-auto">
              {jobPositions.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.title}
                  {position.industry && ` (${position.industry})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-sm text-gray-500 mt-1">※ 必須項目です</p>
        </div>
        
        {selectedPosition && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-800">選択した職種:</p>
            <p className="text-base text-green-700">{selectedJobTitle}</p>
          </div>
        )}
      </div>
      
      {isSubmitting ? (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-primary">プロフィールを作成中...</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-between mt-6">
          {showBackButton && (
            <Button 
              onClick={onGoBack} 
              variant="outline"
              disabled={isSubmitting}
            >
              戻る
            </Button>
          )}
          {!showBackButton && <div />}
          {selectedPosition && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="px-5 py-2 font-medium"
            >
              プロフィールを完成させる
            </Button>
          )}
        </div>
      )}
    </div>
  )
}