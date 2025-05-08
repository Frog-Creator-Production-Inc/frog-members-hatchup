import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { CourseList } from "./components/course-list"

export const dynamic = "force-dynamic"

export default async function AdminCoursesPage() {
  const supabase = createServerComponentClient({ cookies })

  // デバッグ用にログを追加
  console.log('Fetching courses...')
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      category,
      total_weeks,
      tuition_and_others,
      updated_at,
      schools (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false })

  console.log('Courses result:', { courses, error: coursesError })

  // 学校データの取得
  console.log('Fetching schools...')
  const { data: schools, error: schoolsError } = await supabase
    .from("schools")
    .select("id, name")
    .order("name")

  console.log('Schools result:', { schools, error: schoolsError })

  // カテゴリーの取得
  const uniqueCategories = Array.from(new Set(courses?.map(course => course.category).filter(Boolean)))
  console.log('Categories:', uniqueCategories)

  // データの有無を確認
  if (coursesError) {
    console.error('Courses fetch error:', coursesError)
    return <div>コースデータの取得に失敗しました</div>
  }

  if (!courses?.length) {
    return <div>コースが見つかりません</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">コース一覧</h1>
      <CourseList
        courses={courses}
        schools={schools || []}
        categories={uniqueCategories}
      />
    </div>
  )
}