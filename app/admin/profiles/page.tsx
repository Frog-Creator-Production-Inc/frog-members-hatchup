import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ProfileList } from "./components/profile-list"

export const dynamic = "force-dynamic"

export default async function ProfilesPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  try {
    // Get profiles with related data using proper SQL syntax
    const { data: profiles, error } = await supabase
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
          count
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching profiles:", error)
      throw error
    }

    // Transform the data to include counts
    const transformedProfiles = profiles.map(profile => ({
      ...profile,
      chat_count: profile.chat_sessions?.[0]?.count || 0
    }))

    return <ProfileList profiles={transformedProfiles} />
  } catch (error) {
    console.error("Error in ProfilesPage:", error)
    return <div className="p-4 text-center text-red-500">プロフィールデータの取得中にエラーが発生しました。</div>
  }
}