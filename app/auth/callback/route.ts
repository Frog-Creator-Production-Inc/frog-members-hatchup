import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  
  // 環境変数からベースURLを取得
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  
  if (code) {
    try {
      console.log("認証コールバック処理開始: コード検出")
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError || !session) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(new URL('/auth?error=session_exchange', baseUrl))
      }

      console.log(`認証成功: ユーザーID=${session.user.id}`)

      // プロフィールの存在確認
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // プロフィールが存在しない場合は作成
      if (!existingProfile) {
        console.log("プロフィールが存在しないため新規作成")
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: session.user.id,
              email: session.user.email,
              updated_at: new Date().toISOString(),
            }
          ])
        
        if (createError) {
          console.error('Profile creation error:', createError)
          return NextResponse.redirect(new URL('/auth?error=profile_creation', baseUrl))
        }
        
        console.log("プロフィール作成成功: オンボーディングへリダイレクト")
      } else {
        console.log("既存プロフィール検出: オンボーディング状態確認")
        if (existingProfile.onboarding_completed) {
          console.log("オンボーディング完了済み: ダッシュボードへリダイレクト")
          return NextResponse.redirect(new URL('/dashboard', baseUrl))
        }
        console.log("オンボーディング未完了: オンボーディングへリダイレクト")
      }

      // 直接オンボーディングページへリダイレクト
      return NextResponse.redirect(new URL('/onboarding', baseUrl))
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(new URL('/auth?error=unexpected', baseUrl))
    }
  }

  console.log("認証コード不検出: トップページへリダイレクト")
  // codeがない場合はトップページへ
  return NextResponse.redirect(new URL('/', baseUrl))
}
