import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// 学校担当者が新規コースを登録するためのエンドポイント
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: schoolId } = params
    const supabase = createRouteHandlerClient({ cookies })
    
    // リクエストボディの取得
    const { course, token, email } = await request.json()
    
    if (!course || !token || !email) {
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
    
    // 2. 新規コースの登録
    // 登録対象のフィールドを指定
    const insertData = {
      school_id: schoolId,
      name: course.name,
      category: course.category,
      description: course.description,
      total_weeks: course.total_weeks,
      lecture_weeks: course.lecture_weeks,
      work_permit_weeks: course.work_permit_weeks,
      tuition_and_others: course.tuition_and_others,
      url: course.url,
      admission_requirements: course.admission_requirements,
      graduation_requirements: course.graduation_requirements,
      job_support: course.job_support,
      notes: course.notes
    }
    
    const { data: newCourse, error: insertError } = await supabase
      .from('courses')
      .insert(insertData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating course:', insertError)
      return NextResponse.json(
        { error: "コースの作成中にエラーが発生しました" },
        { status: 500 }
      )
    }
    
    // 3. トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
    
    return NextResponse.json({
      success: true,
      message: "新規コースが作成されました",
      course: newCourse
    })
  } catch (error) {
    console.error('Error in course creation API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
} 