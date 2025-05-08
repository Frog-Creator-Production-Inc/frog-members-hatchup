import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// コース開始日を取得するエンドポイント
export async function GET(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      )
    }
    
    // 1. トークンの有効性確認
    const now = new Date().toISOString()
    const { data: tokenData, error: tokenError } = await supabase
      .from('school_access_tokens')
      .select('*')
      .eq('token', token)
      .eq('school_id', schoolId)
      .eq('email', email)
      .gt('expires_at', now)
      .single()
    
    if (tokenError || !tokenData) {
      console.error('Invalid or expired token:', tokenError)
      return NextResponse.json(
        { error: "無効または期限切れのトークンです" },
        { status: 401 }
      )
    }
    
    // 2. コースが指定された学校に属していることを確認
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, school_id')
      .eq('id', courseId)
      .eq('school_id', schoolId)
      .single()
    
    if (courseError || !courseData) {
      console.error('Course not found or not associated with the school:', courseError)
      return NextResponse.json(
        { error: "指定されたコースが見つからないか、この学校に属していません" },
        { status: 404 }
      )
    }
    
    // 3. 開始日情報を取得
    const { data: intakeDates, error: fetchError } = await supabase
      .from('course_intake_dates')
      .select('*')
      .eq('course_id', courseId)
      .order('year', { ascending: true })
      .order('month', { ascending: true })
      .order('day', { ascending: true })
    
    if (fetchError) {
      console.error('Error fetching intake dates:', fetchError)
      return NextResponse.json(
        { error: "開始日の取得中にエラーが発生しました" },
        { status: 500 }
      )
    }
    
    // 4. トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
    
    return NextResponse.json({
      success: true,
      intakeDates
    })
  } catch (error) {
    console.error('Error in intake dates fetch API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

// コース開始日を作成するエンドポイント
export async function POST(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params
    const supabase = createRouteHandlerClient({ cookies })
    
    // リクエストボディを取得
    const { month, day, year, is_tentative, notes, token, email } = await request.json()
    
    if (!month || !token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      )
    }
    
    // 1. トークンの有効性確認
    const now = new Date().toISOString()
    const { data: tokenData, error: tokenError } = await supabase
      .from('school_access_tokens')
      .select('*')
      .eq('token', token)
      .eq('school_id', schoolId)
      .eq('email', email)
      .gt('expires_at', now)
      .single()
    
    if (tokenError || !tokenData) {
      console.error('Invalid or expired token:', tokenError)
      return NextResponse.json(
        { error: "無効または期限切れのトークンです" },
        { status: 401 }
      )
    }
    
    // 2. コースが指定された学校に属していることを確認
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, school_id')
      .eq('id', courseId)
      .eq('school_id', schoolId)
      .single()
    
    if (courseError || !courseData) {
      console.error('Course not found or not associated with the school:', courseError)
      return NextResponse.json(
        { error: "指定されたコースが見つからないか、この学校に属していません" },
        { status: 404 }
      )
    }
    
    // 3. 開始日情報を登録
    const intakeData = {
      course_id: courseId,
      month,
      day: day || null,
      year: year || null,
      is_tentative: is_tentative !== undefined ? is_tentative : true,
      notes: notes || null
    }
    
    const { data: intakeDate, error: insertError } = await supabase
      .from('course_intake_dates')
      .insert(intakeData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting intake date:', insertError)
      return NextResponse.json(
        { error: "開始日の登録中にエラーが発生しました" },
        { status: 500 }
      )
    }
    
    // 4. トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
    
    return NextResponse.json({
      success: true,
      message: "開始日が登録されました",
      intakeDate
    })
  } catch (error) {
    console.error('Error in intake date create API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

// コース開始日を削除するエンドポイント
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const intakeDateId = searchParams.get('intakeDateId')
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!intakeDateId || !token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      )
    }
    
    // 1. トークンの有効性確認
    const now = new Date().toISOString()
    const { data: tokenData, error: tokenError } = await supabase
      .from('school_access_tokens')
      .select('*')
      .eq('token', token)
      .eq('school_id', schoolId)
      .eq('email', email)
      .gt('expires_at', now)
      .single()
    
    if (tokenError || !tokenData) {
      console.error('Invalid or expired token:', tokenError)
      return NextResponse.json(
        { error: "無効または期限切れのトークンです" },
        { status: 401 }
      )
    }
    
    // 2. コースが指定された学校に属していることを確認
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, school_id')
      .eq('id', courseId)
      .eq('school_id', schoolId)
      .single()
    
    if (courseError || !courseData) {
      console.error('Course not found or not associated with the school:', courseError)
      return NextResponse.json(
        { error: "指定されたコースが見つからないか、この学校に属していません" },
        { status: 404 }
      )
    }
    
    // 3. 開始日が指定されたコースに属していることを確認
    const { data: intakeDateData, error: intakeDateError } = await supabase
      .from('course_intake_dates')
      .select('*')
      .eq('id', intakeDateId)
      .eq('course_id', courseId)
      .single()
    
    if (intakeDateError || !intakeDateData) {
      console.error('Intake date not found or not associated with the course:', intakeDateError)
      return NextResponse.json(
        { error: "指定された開始日が見つからないか、このコースに属していません" },
        { status: 404 }
      )
    }
    
    // 4. 開始日を削除
    const { error: deleteError } = await supabase
      .from('course_intake_dates')
      .delete()
      .eq('id', intakeDateId)
    
    if (deleteError) {
      console.error('Error deleting intake date:', deleteError)
      return NextResponse.json(
        { error: "開始日の削除中にエラーが発生しました" },
        { status: 500 }
      )
    }
    
    // 5. トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
    
    return NextResponse.json({
      success: true,
      message: "開始日が削除されました"
    })
  } catch (error) {
    console.error('Error in intake date delete API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
} 