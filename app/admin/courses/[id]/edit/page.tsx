import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { CourseForm } from "../../components/course-form"
import { CourseSubjects } from "../../components/course-subjects"
import { CourseIntakeDates } from "../../components/course-intake-dates"

export const dynamic = "force-dynamic"

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const [courseResult, schoolsResult, subjectsResult, intakeDatesResult] = await Promise.all([
    supabase
      .from("courses")
      .select(`
        id,
        name,
        category,
        description,
        total_weeks,
        lecture_weeks,
        tuition_and_others,
        work_permit_weeks,
        school_id,
        migration_goals,
        content_snare_template_id,
        admission_requirements,
        graduation_requirements,
        job_support,
        notes,
        schools (
          id,
          name
        )
      `)
      .eq("id", params.id)
      .single(),
    supabase
      .from("schools")
      .select("id, name")
      .order("name"),
    supabase
      .from("course_subjects")
      .select("*")
      .eq("course_id", params.id)
      .order("created_at"),
    supabase
      .from("course_intake_dates")
      .select("*")
      .eq("course_id", params.id)
      .order("year", { ascending: true, nullsFirst: true })
      .order("month", { ascending: true })
      .order("day", { ascending: true, nullsFirst: true })
  ])

  if (courseResult.error) {
    console.error("Error fetching course:", courseResult.error)
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">コース編集</h1>
      <CourseForm 
        initialData={courseResult.data}
        schools={schoolsResult.data || []}
        mode="edit"
      />
      
      {/* 入学日管理コンポーネント */}
      <CourseIntakeDates 
        courseId={params.id}
        intakeDates={intakeDatesResult.data || []}
      />
      
      <CourseSubjects 
        courseId={params.id}
        subjects={subjectsResult.data || []}
      />
    </div>
  )
}