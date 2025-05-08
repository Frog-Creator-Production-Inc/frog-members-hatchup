"use client"

import { useState } from "react"
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
import Link from "next/link"

interface CourseApplicationDialogProps {
  courseId: string
  courseName: string
}

export function CourseApplicationDialog({ courseId, courseName }: CourseApplicationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleConfirm = async () => {
    try {
      // 現在のユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("ユーザー情報の取得に失敗しました")
      }

      // プロフィール情報を取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error("プロフィール情報の取得に失敗しました")
      }

      const { data, error } = await supabase
        .from("course_applications")
        .insert({
          user_id: profile.id,
          course_id: courseId,
          status: "draft"
        })
        .select()
        .single()

      if (error) throw error
      
      if (!data?.id) {
        throw new Error("申し込みIDの取得に失敗しました")
      }

      // ユーザーIDとアプリケーションIDを保存
      setUserId(profile.id)
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
        <Button size="lg" className="w-full">このコースを選ぶ</Button>
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

interface CourseApplicationButtonProps {
  courseId: string
  courseName: string
}

export function CourseApplicationButton({ courseId }: CourseApplicationButtonProps) {
  return (
    <Button asChild className="w-full">
      <Link href={`/courses/${courseId}/apply`}>
        申し込みを開始
      </Link>
    </Button>
  )
}