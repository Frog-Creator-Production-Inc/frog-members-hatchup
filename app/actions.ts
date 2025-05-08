'use server'

import { createServerClient } from '@/lib/supabase-client'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { notifyNewUser } from '@/lib/slack/notifications'

/**
 * プロファイルが存在するかチェックし、なければ作成するアクション
 */
export async function ensureProfileExists() {
  try {
    // 認証チェック
    const supabase = createServerComponentClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: '認証に失敗しました' }
    }
    
    // サービスロールクライアント
    const serviceClient = createServerClient()
    
    // プロファイル取得
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    // プロファイルが存在しない場合は作成
    if (profileError && profileError.code === 'PGRST116') {
      const newProfileData = {
        id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarding_completed: false
      }
      
      const { data: newProfile, error: createError } = await serviceClient
        .from('profiles')
        .upsert(newProfileData, {
          onConflict: 'id',
          returning: 'minimal'
        })
      
      if (createError) {
        return { success: false, error: 'プロファイルの作成に失敗しました' }
      }
      
      // 新規ユーザー登録の通知をSlackに送信
      await notifyNewUser(
        user.id,
        user.email || '不明',
        user.user_metadata?.full_name
      )
      
      return { success: true, profileCreated: true }
    }
    
    // 既存のプロファイルが見つかった場合
    if (profile) {
      return { success: true, profileCreated: false, hasCompletedOnboarding: profile.onboarding_completed }
    }
    
    return { success: false, error: 'プロファイル確認中にエラーが発生しました' }
  } catch (error) {
    return { success: false, error: '予期せぬエラーが発生しました' }
  }
}

/**
 * ユーザーのログインフローをチェックし、適切なページにリダイレクトするアクション
 */
export async function checkAuthAndRedirect() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/auth')
    }
    
    // プロファイル確認
    const { success, profileCreated, hasCompletedOnboarding, error } = await ensureProfileExists()
    
    if (!success) {
      redirect('/auth')
    }
    
    // プロファイルが作成されたばかり、または未完了の場合はオンボーディングへ
    if (profileCreated || !hasCompletedOnboarding) {
      redirect('/onboarding')
    }
    
    // 問題なければダッシュボードへ
    redirect('/dashboard')
  } catch (error) {
    redirect('/auth')
  }
} 