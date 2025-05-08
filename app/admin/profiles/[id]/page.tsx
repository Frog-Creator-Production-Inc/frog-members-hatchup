import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { ProfileDetail } from "./components/profile-detail"
import { getJobPositions } from "@/lib/supabase/queries"

export const dynamic = "force-dynamic"

export default async function ProfileDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get profile with all related data
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`
        *,
        current_locations (
          name
        ),
        goal_locations (
          city,
          country
        ),
        chat_sessions!chat_sessions_user_id_fkey (
          id,
          status,
          created_at,
          messages (
            count
          )
        ),
        user_files!user_files_profile_id_fkey (
          id,
          name,
          size,
          type,
          created_at,
          downloaded
        ),
        favorite_courses (
          courses (
            id,
            name,
            category,
            schools (
              id,
              name
            )
          )
        ),
        visa_plans (
          id,
          name,
          status,
          created_at,
          visa_plan_reviews (
            id,
            status,
            created_at
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)
      throw error
    }

    if (!profile) {
      notFound()
    }

    // ユーザーが申請したコース情報を取得
    const { data: courseApplications, error: applicationsError } = await supabase
      .from("course_applications")
      .select(`
        id,
        status,
        preferred_start_date,
        purpose,
        created_at,
        course:course_id (
          id,
          name,
          category,
          schools (
            id,
            name
          )
        )
      `)
      .eq("user_id", params.id)
      .order("created_at", { ascending: false })

    if (applicationsError) {
      console.error("Error fetching course applications:", applicationsError)
    }

    // デバッグ用ログ
    console.log("Profile ID:", params.id)
    console.log("Course Applications:", courseApplications?.length || 0)

    // 職業ポジションデータを取得
    const jobPositions = await getJobPositions()

    return (
      <div className="container mx-auto py-10 bg-gray-50">
        <ProfileDetail 
          profile={profile} 
          jobPositions={jobPositions} 
          courseApplications={courseApplications || []} 
        />
      </div>
    )
  } catch (error) {
    console.error("Error in ProfileDetailPage:", error)
    notFound()
  }
}