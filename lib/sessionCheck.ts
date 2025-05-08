import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getSessionAndProfile() {
  const supabase = createServerComponentClient({ cookies })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { session: null, profile: null }
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    return { session, profile }
  } catch (error) {
    return { session: null, profile: null }
  }
}

