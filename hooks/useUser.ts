"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export const useUser = () => {
  const supabase = createClientComponentClient<Database>()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true)
        
        // セッションからユーザー情報を取得
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          
          // プロファイル情報も取得
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', session.user.id)
            .single()
            
          if (!error && profileData) {
            setProfile(profileData)
          }
        }
      } catch (error) {
        // エラーログを削除
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // 認証状態変更リスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return {
    user,
    profile,
    loading
  }
} 