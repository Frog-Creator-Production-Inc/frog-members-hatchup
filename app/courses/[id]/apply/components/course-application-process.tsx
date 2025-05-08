"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Steps } from "./steps"
import { BasicInfo } from "./steps/basic-info"
import { Documents } from "./steps/documents"
import { Confirmation } from "./steps/confirmation"
import { toast } from "react-hot-toast"
import type { CourseApplication } from "@/types/application"
import { APPLICATION_STATUS } from "@/types/application"
import { createContentSnareClient } from "@/lib/contentSnare"

interface CourseApplicationProcessProps {
  courseId: string
  userId: string
}

const steps = [
  { id: "basic-info", title: "基本情報", description: "希望開始時期や目的を入力" },
  { id: "documents", title: "必要書類", description: "必要書類のアップロード" },
  { id: "confirmation", title: "確認", description: "入力内容の最終確認" },
]

export function CourseApplicationProcess({ courseId, userId }: CourseApplicationProcessProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [application, setApplication] = useState<CourseApplication | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)

  // アプリケーションの作成または取得
  useEffect(() => {
    const initializeApplication = async () => {
      try {
        // 既存の下書きを検索（複数ある可能性を考慮）
        const { data: existingApps, error: fetchError } = await supabase
          .from("course_applications")
          .select("*")
          .eq("course_id", courseId)
          .eq("user_id", userId)
          .eq("status", APPLICATION_STATUS.DRAFT)
          .order("created_at", { ascending: false })

        if (fetchError) throw fetchError

        if (existingApps && existingApps.length > 0) {
          // 最新の申請を使用
          const latestApp = existingApps[0]
          setApplication(latestApp)
          
          // 複数のDRAFT状態の申請がある場合、最新以外を削除
          if (existingApps.length > 1) {
            const oldDraftIds = existingApps.slice(1).map(app => app.id)
            
            const { error: deleteError } = await supabase
              .from("course_applications")
              .delete()
              .in("id", oldDraftIds)
              
            if (deleteError) {
              // 削除に失敗しても処理は続行
            }
          }
          
          return
        }

        // 新規作成
        const { data: newApp, error } = await supabase
          .from("course_applications")
          .insert({
            course_id: courseId,
            user_id: userId,
            status: APPLICATION_STATUS.DRAFT,
          })
          .select()
          .single()

        if (error) throw error
        setApplication(newApp)
      } catch (error) {
        toast.error("申請の初期化に失敗しました")
        router.push(`/courses/${courseId}`)
      }
    }

    initializeApplication()
  }, [courseId, userId])

  const handleUpdateBasicInfo = async (data: Partial<CourseApplication>) => {
    if (!application) return

    try {
      // 更新データの構築
      const updateData = {
        preferred_start_date: data.preferred_start_date,
        purpose: data.purpose,
        payment_method: data.payment_method,
        updated_at: new Date().toISOString()
      }

      // Supabaseクエリの実行
      const { data: updatedData, error, status } = await supabase
        .from("course_applications")
        .update(updateData)
        .eq("id", application.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      setApplication(updatedData)
      toast.success("基本情報を保存しました")
      handleNext()
    } catch (error) {
      toast.error("基本情報の更新に失敗しました")
    }
  }

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!application) return

    try {
      setLoading(true)
      
      // ユーザープロフィール情報を取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        throw new Error('プロフィール情報の取得に失敗しました')
      }
      
      // Content Snareクライアントを作成
      const firstName = profileData.first_name || ''
      const lastName = profileData.last_name || ''
      const email = profileData.email || ''
      
      const { client_id, success, already_exists } = await createContentSnareClient(
        firstName,
        lastName,
        email
      )
      
      // Content Snare IDを申請に関連付け
      const { error: updateSnareError } = await supabase
        .from("course_applications")
        .update({
          content_snare_id: client_id
        })
        .eq("id", application.id)
      
      if (updateSnareError) {
        // エラーがあっても処理を続行
      }

      // 現在の申請を提出済みに更新
      const { error } = await supabase
        .from("course_applications")
        .update({
          status: APPLICATION_STATUS.SUBMITTED,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id)

      if (error) {
        console.error('Submit Error Details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      // 更新後の申請状態を確認
      const { data: updatedApp, error: fetchError } = await supabase
        .from("course_applications")
        .select("*")
        .eq("id", application.id)
        .single()

      if (fetchError) {
        console.error('Error fetching updated application:', fetchError)
      }

      // 同じコースに対する他のDRAFT状態の申請を削除
      // 現在の申請以外の同じコースに対するDRAFT状態の申請を検索
      const { data: otherDrafts } = await supabase
        .from("course_applications")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .eq("status", APPLICATION_STATUS.DRAFT)
        .neq("id", application.id)

      // 他のDRAFT状態の申請が存在する場合は削除
      if (otherDrafts && otherDrafts.length > 0) {
        const draftIds = otherDrafts.map(draft => draft.id)
        
        const { error: deleteError } = await supabase
          .from("course_applications")
          .delete()
          .in("id", draftIds)

        if (deleteError) {
          // 削除に失敗しても申請自体は完了しているので、エラーをスローしない
        }
      }

      // コース情報を取得
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("name")
        .eq("id", courseId)
        .single()

      if (courseError) {
        console.error('Error fetching course:', courseError)
      }

      const courseName = courseData?.name || "不明なコース"
      
      // ユーザー情報の取得
      const userName = profileData.first_name && profileData.last_name
        ? `${profileData.first_name} ${profileData.last_name}`
        : profileData.email || "不明なユーザー"
      
      // 通知APIを呼び出す
      try {
        // 絶対URLを構築
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/slack/notify-course-application`;
        
        const notifyResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            applicationId: application.id,
            courseName: courseName,
          }),
        });

        // エラーログを削除
      } catch (notifyError) {
        // 通知エラーでもユーザー体験を損なわないよう処理を続行
      }

      // APIの成功/失敗に関わらず、ユーザーには成功のメッセージを表示
      toast.success("申請が完了しました");
      router.push("/dashboard");
    } catch (error) {
      toast.error("申請の送信に失敗しました");
    }
  }

  // コースID変更時のハンドラ
  const handleCourseUpdate = async (updateData: Partial<CourseApplication>) => {
    try {
      setLoading(true);
      
      if (!application) {
        toast.error('申請データが見つかりませんでした');
        return false;
      }
      
      // 申請データを更新
      const { error: updateError } = await supabase
        .from('course_applications')
        .update(updateData)
        .eq('id', application.id);
      
      if (updateError) {
        toast.error('申請データの更新に失敗しました');
        return false;
      }
      
      // 状態の更新
      setApplication(prev => {
        if (!prev) return null;
        return { ...prev, ...updateData } as CourseApplication;
      });
      
      return true;
    } catch (error) {
      toast.error('申請データの更新に失敗しました');
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (!application) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">コース申請</h1>
        <p className="text-muted-foreground">
          以下のステップに従って申請を完了してください
        </p>
      </div>

      <Steps steps={steps} currentStep={currentStep} />

      <Card className="p-6">
        {currentStep === 0 && (
          <BasicInfo
            application={application}
            onSubmit={handleUpdateBasicInfo}
          />
        )}
        {currentStep === 1 && (
          <Documents
            application={application}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 2 && (
          <Confirmation
            application={application}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )}
      </Card>
    </div>
  )
} 