"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { CourseApplicationForm } from "./course-application-form"

interface CourseApplicationDialogProps {
  courseId: string
  courseName: string
}

export function CourseApplicationDialog({ courseId, courseName }: CourseApplicationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasPendingApplication, setHasPendingApplication] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkPendingApplications()
  }, [])

  const checkPendingApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // 既存の申請をチェック
      const { data: existingApplications } = await supabase
        .from("course_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single()

      if (existingApplications) {
        setApplicationId(existingApplications.id)
        if (existingApplications.status === "draft") {
          setStep(1) // 下書きがある場合はフォームを表示
        } else if (["submitted", "reviewing"].includes(existingApplications.status)) {
          setHasPendingApplication(true)
        }
      }

      // 他のコースの申請状況をチェック
      const { data: pendingApplications } = await supabase
        .from("course_applications")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["submitted", "reviewing"])

      if (pendingApplications && pendingApplications.length > 0) {
        setHasPendingApplication(true)
      }
    } catch (error) {
      console.error("Error checking applications:", error)
    }
  }

  const handleConfirm = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("ユーザー情報の取得に失敗しました")
      }

      // 新規申請を作成
      const { data, error } = await supabase
        .from("course_applications")
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: "draft"
        })
        .select()
        .single()

      if (error) throw error
      
      if (!data?.id) {
        throw new Error("申し込みIDの取得に失敗しました")
      }

      setUserId(user.id)
      setApplicationId(data.id)
      setStep(1)
    } catch (error) {
      console.error("Error creating application:", error)
      toast.error("申し込みの開始に失敗しました")
      setIsOpen(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setStep(0)
      setApplicationId(null)
      setUserId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="w-full"
          disabled={hasPendingApplication}
        >
          {hasPendingApplication ? "他のコースを申請中" : "このコースを選ぶ"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-white">
        {step === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>コースの申し込みを開始しますか？</DialogTitle>
              <DialogDescription>
                {courseName}の申し込みを開始します。
                申し込みを開始すると、必要書類の確認と提出、入学希望時期の選択などの手続きが始まります。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleConfirm}>
                申し込みを開始
              </Button>
            </div>
          </>
        ) : (
          applicationId && userId && (
            <CourseApplicationForm
              key={applicationId}
              courseId={courseId}
              applicationId={applicationId}
              userId={userId}
              onComplete={() => {
                setIsOpen(false)
                router.refresh()
              }}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  )
}