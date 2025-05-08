import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // URLパラメーターからコースIDを取得
    const url = new URL(request.url)
    const courseId = url.searchParams.get('courseId')
    const userId = url.searchParams.get('userId') || user.id
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'コースIDが必要です' },
        { status: 400 }
      )
    }
    
    // コース申請の情報を取得
    const { data, error } = await supabase
      .from('course_applications')
      .select('id, status, content_snare_request_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('アプリケーションステータス取得エラー:', error)
      return NextResponse.json(
        { error: 'アプリケーション情報の取得に失敗しました' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: data || null,
    })
  } catch (error) {
    console.error('コース申請ステータスAPI Error:', error)
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 