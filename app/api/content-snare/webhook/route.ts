import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notifyNewCourseApplication } from '@/lib/slack/notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // リクエストボディを取得
    const body = await request.json()
    console.log('受信したContent Snareウェブフックデータ:', JSON.stringify(body))
    
    // イベントタイプをチェック
    const eventType = body.event
    const requestId = body.request_id
    
    if (!eventType || !requestId) {
      console.error('無効なウェブフックデータ: イベントタイプまたはリクエストIDがありません')
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }
    
    // リクエストIDに対応するコース申請を検索
    const { data: application, error: appError } = await supabase
      .from('course_applications')
      .select(`
        id, 
        status, 
        user_id,
        course_id,
        courses:course_id (
          id,
          name
        ),
        profiles:user_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('content_snare_request_id', requestId)
      .single()
    
    if (appError || !application) {
      console.error('コース申請の検索エラー:', appError || '申請が見つかりません')
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    console.log(`申請ID ${application.id} のイベント ${eventType} を処理します`)
    
    // イベントに応じた処理
    if (eventType === 'request.submitted') {
      // 申請が提出された場合の処理
      const { error: updateError } = await supabase
        .from('course_applications')
        .update({ 
          status: 'submitted',
          updated_at: new Date().toISOString() 
        })
        .eq('id', application.id)
      
      if (updateError) {
        console.error('申請更新エラー:', updateError)
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
      }
      
      console.log(`申請ID ${application.id} のステータスを submitted に更新しました`)
      
      // プロファイル情報とコース情報の安全な取得
      const profile = application.profiles as any
      const course = application.courses as any
      
      // ユーザー名とコース名を安全に取得
      const userName = profile && profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile && profile.email ? profile.email : '不明なユーザー'
      
      const courseName = course && course.name ? course.name : '不明なコース'
      
      console.log(`Slack通知を送信します: ユーザー=${userName}, コース=${courseName}`)
      
      try {
        // Slack通知を送信
        await notifyNewCourseApplication(
          application.id,
          application.user_id,
          userName,
          courseName
        )
        console.log(`申請ID ${application.id} のSlack通知を送信しました`)
      } catch (notifyError) {
        console.error('Slack通知送信エラー:', notifyError)
        // 通知エラーはログに記録するだけで処理は続行
      }
    } else if (eventType === 'request.approved') {
      // 申請が承認された場合の処理
      const { error: updateError } = await supabase
        .from('course_applications')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString() 
        })
        .eq('id', application.id)
      
      if (updateError) {
        console.error('申請更新エラー:', updateError)
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
      }
      
      console.log(`申請ID ${application.id} のステータスを approved に更新しました`)
    } else if (eventType === 'request.rejected') {
      // 申請が却下された場合の処理
      const { error: updateError } = await supabase
        .from('course_applications')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString() 
        })
        .eq('id', application.id)
      
      if (updateError) {
        console.error('申請更新エラー:', updateError)
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
      }
      
      console.log(`申請ID ${application.id} のステータスを rejected に更新しました`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content Snareウェブフック処理エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 