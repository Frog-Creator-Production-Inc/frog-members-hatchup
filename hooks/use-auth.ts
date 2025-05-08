import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      if (!user) {
        router.push("/auth")
      }
    }
    getUser()
  }, [router.push, supabase.auth.getUser]) // Added router.push and supabase.auth.getUser to dependencies

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/auth")
  }

  return { user, loading, signOut }
}

