import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notifyNewCourseApplication } from '@/lib/slack/notifications'

/**
 * コース申請の通知を処理するAPIエンドポイント
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
    
    const { applicationId, courseName } = body
    
    // 必須パラメータのチェック
    if (!applicationId || !courseName) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }
    
    const userId = session.user.id
    let userName = session.user.email || '不明なユーザー'
    
    // ユーザー情報の取得を試みる
    try {
      const { data: application, error: appError } = await supabase
        .from('course_applications')
        .select(`
          id,
          user_id,
          users:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', applicationId)
        .single()
      
      if (application && application.users) {
        // 申請者情報があれば名前をフォーマット
        const user = application.users as any
        if (user.first_name && user.last_name) {
          userName = `${user.first_name} ${user.last_name}`
        }
      } else if (appError) {
        // 申請データの取得に失敗
      }
    } catch (dbError) {
      // エラーがあっても処理を続行
    }
    
    // Slack通知を送信
    try {
      const result = await notifyNewCourseApplication(
        applicationId,
        userId,
        userName,
        courseName
      )
      
      if (result.ok) {
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ error: 'Slack通知の送信に失敗しました' }, { status: 500 })
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