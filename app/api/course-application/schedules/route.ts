import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    
    if (!applicationId) {
      return NextResponse.json({ error: "applicationIdは必須です" }, { status: 400 })
    }
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies })
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error("認証セッションがありません")
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }
    
    // コース申請情報を取得し、ユーザーが所有者であることを確認
    const { data: applicationData, error: applicationError } = await supabase
      .from('course_applications')
      .select('user_id')
      .eq('id', applicationId)
      .single()
    
    if (applicationError) {
      return NextResponse.json({ error: "コース申請が見つかりません" }, { status: 404 })
    }
    
    // ユーザーが所有者でない場合はエラー
    if (applicationData.user_id !== session.user.id) {
      return NextResponse.json({ error: "このコース申請へのアクセス権がありません" }, { status: 403 })
    }
    
    // スケジュールを取得
    const { data: schedules, error: schedulesError } = await supabase
      .from('user_schedules')
      .select('*')
      .or(`course_application_id.eq.${applicationId},application_id.eq.${applicationId}`)
      .order('year', { ascending: true })
      .order('month', { ascending: true })
      .order('day', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true })
    
    console.log("スケジュール取得クエリ:", `course_application_id.eq.${applicationId},application_id.eq.${applicationId}`);
    console.log("取得したスケジュール:", schedules);
    
    if (schedulesError) {
      return NextResponse.json({ error: "スケジュールの取得に失敗しました" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data: schedules })
  } catch (error) {
    console.error("スケジュール取得エラー:", error)
    return NextResponse.json({ error: "スケジュールの取得に失敗しました" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    // リクエストボディからデータを取得
    const requestData = await request.json()
    const { 
      applicationId, 
      scheduleId, 
      completed,
      year,
      month,
      day,
      action = 'toggle_completed' // デフォルトはcompletedの切り替え
    } = requestData
    
    if (!applicationId || !scheduleId) {
      return NextResponse.json(
        { error: 'applicationIdとscheduleIdは必須です' },
        { status: 400 }
      )
    }
    
    // コース申請の存在確認と権限チェック
    const { data: application, error: appError } = await supabase
      .from('course_applications')
      .select('id, user_id')
      .eq('id', applicationId)
      .single()
    
    if (appError) {
      return NextResponse.json(
        { error: 'コース申請が見つかりません' },
        { status: 404 }
      )
    }
    
    // 自分の申請か確認
    const isOwnApplication = application.user_id === user.id
    
    if (!isOwnApplication) {
      // 管理者権限チェック
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        
      if (!adminRole) {
        return NextResponse.json(
          { error: 'このコース申請へのアクセス権がありません' },
          { status: 403 }
        )
      }
    }
    
    // スケジュールの存在確認
    const { data: schedule, error: scheduleError } = await supabase
      .from('user_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('course_application_id', applicationId)
      .single()
    
    if (scheduleError) {
      return NextResponse.json(
        { error: 'スケジュールが見つかりません' },
        { status: 404 }
      )
    }
    
    // 管理者ロックされていて、管理者でない場合は編集不可
    if (schedule.is_admin_locked && isOwnApplication) {
      // 管理者権限チェック
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        
      if (!adminRole) {
        return NextResponse.json(
          { error: 'このスケジュールは管理者のみ編集可能です' },
          { status: 403 }
        )
      }
    }
    
    // 更新するデータを準備
    let updateData: any = { updated_at: new Date().toISOString() };
    
    if (action === 'toggle_completed') {
      // 完了状態の切り替え
      updateData.is_completed = completed;
    } else if (action === 'update_date') {
      // 日付の更新
      if (year !== undefined) updateData.year = year;
      if (month !== undefined) updateData.month = month;
      if (day !== undefined) updateData.day = day;
    }
    
    // スケジュール更新
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('user_schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .select()
    
    if (updateError) {
      console.error('スケジュール更新エラー:', updateError)
      return NextResponse.json(
        { error: 'スケジュールの更新に失敗しました' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updatedSchedule[0],
    })
  } catch (error) {
    console.error('スケジュール更新API Error:', error)
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
} 