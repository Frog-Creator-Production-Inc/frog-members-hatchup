import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notifyNewUser } from '@/lib/slack/notifications'

/**
 * オンボーディング完了時のSlack通知を処理するAPIエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    // セッションを取得 (認証チェック)
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    // リクエストボディを取得
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 })
    }
    
    const { userId, profileData } = body
    
    // 認証ユーザーIDとリクエストIDが一致することを確認
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'ユーザーIDが一致しません' }, { status: 403 })
    }
    
    // プロフィールデータがない場合は警告を表示
    if (!profileData) {
      return NextResponse.json({ error: 'プロフィールデータがありませんが処理を続行します' }, { status: 400 })
    }
    
    let userData: {
      email: string;
      name: string | null;
      first_name?: string;
      last_name?: string;
      [key: string]: any;
    } = {
      email: session.user.email || 'メールアドレスなし',
      name: session.user.user_metadata?.name || null
    }
    
    // より詳細なプロフィール情報があれば取得
    try {
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileResult) {
        userData = {
          ...userData,
          ...profileResult
        }
      } else if (profileError) {
        return NextResponse.json({ error: 'プロフィールデータ取得に失敗しましたが、セッション情報で処理を続行します' }, { status: 400 })
      }
    } catch (dbError) {
      return NextResponse.json({ error: 'データベースアクセスエラー' }, { status: 500 })
    }
    
    // Slack通知を送信
    try {
      const result = await notifyNewUser(
        userId,
        userData.email,
        userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`
          : userData.name || undefined,
        profileData || userData
      )
      
      if (result) {
        return NextResponse.json({ success: true }, { status: 200 });
      } else {
        return NextResponse.json({ error: 'Slack通知の送信に失敗しました' }, { status: 500 });
      }
    } catch (notifyError) {
      return NextResponse.json({ 
        error: 'Slack通知の送信に失敗しました',
        details: notifyError instanceof Error ? notifyError.message : '不明なエラー'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: '内部サーバーエラー',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
  }
} 