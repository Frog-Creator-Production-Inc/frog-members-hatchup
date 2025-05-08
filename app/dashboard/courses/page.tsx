import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { CourseList } from "@/app/admin/courses/components/course-list"

export const dynamic = "force-dynamic"

export default async function DashboardCoursesPage() {
  const supabase = createServerComponentClient({ cookies })

  // RLSポリシーにより公開コースのみ取得
  const { data: coursesData } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      category,
      total_weeks,
      tuition_and_others,
      updated_at,
      schools:school_id (
        id,
        name
      )
    `)
    .eq('is_published', true)  // 念のため条件を追加
    .order("created_at", { ascending: false })

  // 公開されている学校のみ取得
  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .eq('is_active', true)  // 念のため条件を追加
    .order("name")

  const uniqueCategories = Array.from(new Set(coursesData?.map(course => course.category).filter(Boolean)))

  // データを適切な形式に変換
  const courses = coursesData?.map(course => ({
    ...course,
    schools: {
      id: course.schools?.id || "",
      name: course.schools?.name || ""
    }
  })) || []

  return (
    <div className="space-y-6">
      <CourseList
        courses={courses}
        schools={schools || []}
        categories={uniqueCategories}
      />
    </div>
  )
} 