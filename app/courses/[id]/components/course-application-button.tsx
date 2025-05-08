"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createContentSnareClient, createSubmission } from "@/lib/contentSnare"
import { useUser } from "@/hooks/useUser"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface CourseApplicationButtonProps {
  courseId: string
  courseName: string
}

export function CourseApplicationButton({ courseId, courseName }: CourseApplicationButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleApply = async () => {
    if (!user || !profile) {
      router.push(`/login?redirect=/courses/${courseId}`)
      return
    }

    setIsLoading(true)
    try {
      // ContentSnareクライアントを作成
      const firstName = profile.first_name || ''
      const lastName = profile.last_name || ''
      const email = profile.email || ''
      
      const { client_id } = await createContentSnareClient(
        firstName,
        lastName,
        email
      )

      // ContentSnare申請を作成
      const { id: submissionId, url } = await createSubmission(client_id, courseId)

      // コース申請データを作成
      const { data: applicationData, error: applicationError } = await supabase
        .from('course_applications')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content_snare_request_id: submissionId,
          status: 'in_progress'
        })
        .select()
        .single()

      if (applicationError) {
        throw new Error(`申請データ作成エラー: ${applicationError.message}`)
      }

      // Slack通知を送信
      try {
        const apiUrl = `${window.location.origin}/api/slack/notify-course-application`
        
        const notifyResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            applicationId: applicationData.id,
            userId: user.id,
            userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || '',
            courseName
          })
        })
        
        if (!notifyResponse.ok) {
          // 通知エラーは記録するが処理は続行
        }
      } catch (notifyError) {
        // 通知エラーは無視して続行
      }

      // ContentSnareのURLに遷移
      window.location.href = url
    } catch (error) {
      toast({
        title: "エラー",
        description: '申請の処理中にエラーが発生しました。時間をおいて再度お試しください。',
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Button 
      className="w-full" 
      size="lg"
      onClick={handleApply}
      disabled={isLoading}
    >
      {isLoading ? "処理中..." : `${courseName}を申請する`}
    </Button>
  )
} 