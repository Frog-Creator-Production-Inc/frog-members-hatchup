'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ベースURLを取得
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL;
};

export default function AuthChecker() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    const checkInvitedUser = async () => {
      try {
        // ユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const userEmail = user.email
          
          // 招待メールアドレスリストを取得
          const invitedEmails = process.env.NEXT_PUBLIC_INVITED_EMAILS?.split(',') || []
          
          // ユーザーのメールアドレスが招待リストにない場合
          if (userEmail && !invitedEmails.includes(userEmail)) {
            
            // ログアウト処理
            await supabase.auth.signOut()
            
            // 未認可ページにリダイレクト
            const baseUrl = getBaseUrl();
            const unauthorizedUrl = `${baseUrl}/unauthorized`;
            
            // 絶対URLへのリダイレクトはwindow.locationを使用
            window.location.href = unauthorizedUrl;
          }
        }
      } catch (error) {
        // エラー処理
      }
    }
    
    // 初回実行
    checkInvitedUser()
    
    // 認証状態変更イベントのリスナーを設定
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userEmail = session.user.email
        const invitedEmails = process.env.NEXT_PUBLIC_INVITED_EMAILS?.split(',') || []
        
        if (userEmail && !invitedEmails.includes(userEmail)) {
          // ログアウト処理
          supabase.auth.signOut().then(() => {
            const baseUrl = getBaseUrl();
            const unauthorizedUrl = `${baseUrl}/unauthorized`;
            
            // 絶対URLへのリダイレクトはwindow.locationを使用
            window.location.href = unauthorizedUrl;
          })
        }
      }
    })
    
    // クリーンアップ関数
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])
  
  // 何もレンダリングしない
  return null
} 