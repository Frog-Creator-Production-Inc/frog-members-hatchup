import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"

// ベースURLを取得
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export function useInvitedAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkInvitedUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // 招待メールアドレスリストを取得
          const invitedEmails = process.env.NEXT_PUBLIC_INVITED_EMAILS?.split(',') || []
          
          // ユーザーのメールアドレスが招待リストにない場合
          if (user.email && !invitedEmails.includes(user.email)) {
            await supabase.auth.signOut()
            
            // 絶対URLを使用してリダイレクト
            const baseUrl = getBaseUrl();
            const unauthorizedUrl = `${baseUrl}/unauthorized`;
            window.location.href = unauthorizedUrl;
          }
        }
        
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    
    checkInvitedUser()
  }, [router, supabase.auth])

  return { user, loading }
} 