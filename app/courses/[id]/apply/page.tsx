"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "react-hot-toast"
import { CourseIntakeSelect } from "./components/course-intake-select"
import { Loader2, ArrowLeft, Calendar, Clock, Building, DollarSign } from "lucide-react"

export default function ApplyCoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [purpose, setPurpose] = useState<string | null>(null)
  const [intakeDateId, setIntakeDateId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuthAndFetchCourse = async () => {
      // セッションを確認
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push("/login?redirect=/courses")
        return
      }

      // コースを取得
      try {
        const { data, error } = await supabase
          .from("courses")
          .select(`
            *,
            schools:school_id (
              id,
              name,
              logo_url,
              goal_locations (
                id,
                city,
                country
              )
            )
          `)
          .eq("id", params.id)
          .single()

        if (error) throw error
        setCourse(data)
      } catch (error) {
        console.error("Error fetching course:", error)
        toast.error("コースの取得に失敗しました")
        router.push("/courses")
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchCourse()
  }, [params.id, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!purpose) {
      toast.error("渡航目的を選択してください")
      return
    }
    
    setSubmitting(true)
    
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push("/login?redirect=/courses")
        return
      }
      
      const userId = sessionData.session.user.id
      
      // 既存の申請をチェック
      const { data: existingApplications } = await supabase
        .from("course_applications")
        .select("id, status")
        .eq("user_id", userId)
        .eq("course_id", params.id)
      
      if (existingApplications && existingApplications.length > 0) {
        const mostRecent = existingApplications[0]
        
        // ドラフト以外のステータスがあればリダイレクト
        if (mostRecent.status !== 'draft') {
          toast.error("このコースはすでに申請済みです")
          router.push("/course-application")
          return
        }
        
        // ドラフトなら更新
        const { error: updateError } = await supabase
          .from("course_applications")
          .update({
            purpose,
            intake_date_id: intakeDateId,
            updated_at: new Date().toISOString()
          })
          .eq("id", mostRecent.id)
        
        if (updateError) throw updateError
        
        toast.success("コース申請を更新しました")
        router.push("/course-application")
        return
      }
      
      // 新規申請作成
      const { error: insertError } = await supabase
        .from("course_applications")
        .insert([
          {
            user_id: userId,
            course_id: params.id,
            purpose,
            intake_date_id: intakeDateId,
            status: "draft"
          }
        ])
      
      if (insertError) throw insertError
      
      toast.success("コース申請を作成しました")
      router.push("/course-application")
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("申請の作成に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>コース申請</CardTitle>
              <CardDescription>
                希望コースの申請を作成します。申請が承認されると、コースの詳細な申請書類が送られてきます。
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">{course.name}</h2>
                  <p className="text-muted-foreground mb-4">
                    {course.schools.name}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {course.total_weeks && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{course.total_weeks}週間</span>
                      </div>
                    )}
                    
                    {course.tuition_and_others && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>CA${course.tuition_and_others.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-base">渡航目的</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      このコースを受講する主な目的を選択してください
                    </p>
                    
                    <RadioGroup 
                      value={purpose || ""} 
                      onValueChange={setPurpose}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="overseas_job" id="overseas_job" />
                        <Label htmlFor="overseas_job" className="cursor-pointer">海外就職</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="career_change" id="career_change" />
                        <Label htmlFor="career_change" className="cursor-pointer">キャリアチェンジ</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="language" id="language" />
                        <Label htmlFor="language" className="cursor-pointer">語学習得</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <CourseIntakeSelect
                    courseId={params.id}
                    value={intakeDateId}
                    onChange={setIntakeDateId}
                    disabled={submitting}
                  />
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={!purpose || submitting} 
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        送信中...
                      </>
                    ) : (
                      "申請する"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>申請プロセス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">コース申請</h3>
                    <p className="text-sm text-muted-foreground">
                      希望コースと渡航目的を選択して申請します
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">申請書類作成</h3>
                    <p className="text-sm text-muted-foreground">
                      申請が承認されると、詳細な書類提出フォームが送られてきます
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">審査・承認</h3>
                    <p className="text-sm text-muted-foreground">
                      提出された書類を審査し、条件を満たしていれば学校へ申請を行います
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 