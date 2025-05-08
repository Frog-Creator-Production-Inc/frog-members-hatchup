import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, DollarSign, School, MapPin, Briefcase } from "lucide-react"
import { CourseSubjects } from "../components/course-subjects"
import { getCourseJobPositions } from "@/lib/supabase/queries"

export const dynamic = "force-dynamic"

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      *,
      schools (
        id,
        name,
        logo_url,
        goal_locations (
          id,
          city,
          country
        )
      ),
      course_subjects (
        id,
        title,
        description
      )
    `)
    .eq("id", params.id)
    .single()

  if (error) {
    console.error("Error fetching course:", error)
    notFound()
  }

  // コースに関連する職種を取得
  const courseJobPositions = await getCourseJobPositions(params.id)
  
  // コースの入学日を取得
  const { data: intakeDates } = await supabase
    .from("course_intake_dates")
    .select("*")
    .eq("course_id", params.id)
    .order("year", { ascending: true, nullsFirst: true })
    .order("month", { ascending: true })
    .order("day", { ascending: true, nullsFirst: true })
  
  // 入学日の表示用フォーマット関数
  const formatIntakeDate = (intakeDate: any) => {
    const monthNames = [
      "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月"
    ]
    const monthStr = monthNames[intakeDate.month - 1] || `${intakeDate.month}月`
    
    if (intakeDate.day && intakeDate.year) {
      return `${intakeDate.year}年${monthStr}${intakeDate.day}日`
    } else if (intakeDate.year) {
      return `${intakeDate.year}年${monthStr}`
    } else if (intakeDate.day) {
      return `${monthStr}${intakeDate.day}日`
    } else {
      return monthStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">コース詳細</h1>
        <div className="space-x-2">
          <Button asChild variant="outline">
            <Link href="/admin/courses">一覧に戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/courses/${params.id}/edit`}>編集</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">{course.name}</h2>
                  <Link 
                    href={`/admin/schools/${course.schools.id}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary mt-1"
                  >
                    <School className="h-4 w-4" />
                    {course.schools.name}
                  </Link>
                  {course.schools.goal_locations && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4" />
                      {course.schools.goal_locations.city}, {course.schools.goal_locations.country}
                    </div>
                  )}
                </div>

                {course.category && (
                  <div>
                    <Badge>{course.category}</Badge>
                  </div>
                )}

                {course.description && (
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {course.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">期間</p>
                      <p className="text-muted-foreground">
                        {course.total_weeks ? `${course.total_weeks}週間` : "未設定"}
                        {course.lecture_weeks && ` (講義期間: ${course.lecture_weeks}週間)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">入学日</p>
                      {intakeDates && intakeDates.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {intakeDates.map((date) => (
                            <Badge 
                              key={date.id} 
                              variant={date.is_tentative ? "outline" : "default"}
                              className="text-xs"
                            >
                              {formatIntakeDate(date)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">未設定</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">学費</p>
                      <p className="text-muted-foreground">
                        {course.tuition_and_others 
                          ? `CA$${course.tuition_and_others.toLocaleString()}`
                          : "未設定"
                        }
                      </p>
                    </div>
                  </div>

                  {course.work_permit_weeks && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">就労許可期間</p>
                        <p className="text-muted-foreground">
                          {course.work_permit_weeks}週間
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* カリキュラム */}
          <CourseSubjects courseId={course.id} subjects={course.course_subjects} />

          {/* 目指せる職種 */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>目指せる職種</CardTitle>
            </CardHeader>
            <CardContent>
              {courseJobPositions && courseJobPositions.length > 0 ? (
                <div className="space-y-4">
                  {courseJobPositions.map((position: any) => (
                    <div key={position.job_position_id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                      <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">{position.job_positions?.title}</h3>
                        {position.job_positions?.industry && (
                          <p className="text-sm text-muted-foreground">業界: {position.job_positions.industry}</p>
                        )}
                        {position.job_positions?.description && (
                          <p className="text-sm mt-1">{position.job_positions.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">このコースに関連する職種はまだ登録されていません。</p>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/courses/${params.id}/edit`}>
                    職種を編集
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* サイドバー：メタ情報 */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>メタ情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">作成日時</p>
              <p className="text-muted-foreground">
                {new Date(course.created_at).toLocaleString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="font-medium">更新日時</p>
              <p className="text-muted-foreground">
                {new Date(course.updated_at).toLocaleString("ja-JP")}
              </p>
            </div>
            {course.mode && (
              <div>
                <p className="font-medium">モード</p>
                <p className="text-muted-foreground">{course.mode}</p>
              </div>
            )}
            {course.content_snare_template_id && (
              <div>
                <p className="font-medium">Content Snare テンプレートID</p>
                <p className="text-muted-foreground">{course.content_snare_template_id}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}