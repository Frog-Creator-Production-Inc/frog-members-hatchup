import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from '@supabase/supabase-js'

// サービスロールクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// コースに関連付けられた職種を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  const schoolId = params.id
  const courseId = params.courseId
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")
  const email = request.headers.get("X-Email")

  // トークンと電子メールの確認
  if (!token || !email) {
    return NextResponse.json(
      { error: "必要な認証情報が不足しています" },
      { status: 400 }
    )
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // トークンの有効性確認
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

    // コースが学校に所属しているか確認
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("school_id", schoolId)
      .single()

    if (courseError || !courseData) {
      return NextResponse.json(
        { error: "コースが見つからないか、この学校に所属していません" },
        { status: 404 }
      )
    }

    // コースに関連付けられた職種を取得
    const { data, error } = await supabase
      .from("course_job_positions")
      .select(`
        course_id,
        job_position_id,
        job_positions (
          id,
          title,
          description,
          industry
        )
      `)
      .eq("course_id", courseId)

    if (error) {
      console.error("Error fetching course job positions:", error)
      return NextResponse.json(
        { error: "コースの職種データの取得に失敗しました" },
        { status: 500 }
      )
    }

    // トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error in course job positions API:", error)
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    )
  }
}

// コースの職種を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  const schoolId = params.id
  const courseId = params.courseId
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")
  const email = request.headers.get("X-Email")

  // トークンと電子メールの確認
  if (!token || !email) {
    return NextResponse.json(
      { error: "必要な認証情報が不足しています" },
      { status: 400 }
    )
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // トークンの有効性確認
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

    const { jobPositionIds } = await request.json()

    if (!Array.isArray(jobPositionIds)) {
      return NextResponse.json(
        { error: "jobPositionIdsは配列である必要があります" },
        { status: 400 }
      )
    }

    // コースが学校に所属しているか確認
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("school_id", schoolId)
      .single()

    if (courseError || !courseData) {
      return NextResponse.json(
        { error: "コースが見つからないか、この学校に所属していません" },
        { status: 404 }
      )
    }

    // サービスロールを使用して既存の関連付けを削除
    const { error: deleteError } = await supabaseAdmin
      .from("course_job_positions")
      .delete()
      .eq("course_id", courseId)

    if (deleteError) {
      console.error("Error deleting course job positions:", deleteError)
      return NextResponse.json(
        { error: "既存の職種関連付けの削除に失敗しました" },
        { status: 500 }
      )
    }

    // 新しい関連付けがある場合は追加
    if (jobPositionIds.length > 0) {
      const insertData = jobPositionIds.map(jobPositionId => ({
        course_id: courseId,
        job_position_id: jobPositionId
      }))

      // サービスロールを使用して挿入
      const { error: insertError } = await supabaseAdmin
        .from("course_job_positions")
        .insert(insertData)

      if (insertError) {
        console.error("Error inserting course job positions:", insertError)
        return NextResponse.json(
          { error: "職種関連付けの追加に失敗しました" },
          { status: 500 }
        )
      }
    }

    // トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in course job positions API:", error)
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    )
  }
} 