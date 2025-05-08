import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// 学校・コース写真をアップロードするためのエンドポイント
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: schoolId } = params
    const supabase = createRouteHandlerClient({ cookies })
    
    // リクエストボディを取得
    const { imageUrl, description, token, email, courseId } = await request.json()
    
    if (!imageUrl || !token || !email) {
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
    
    // 2. 写真情報をデータベースに保存
    const photoData = {
      school_id: schoolId,
      url: imageUrl,
      description: description || null,
      course_id: courseId || null,
      created_at: new Date().toISOString()
    }
    
    const { data: photo, error: insertError } = await supabase
      .from('school_photos')
      .insert(photoData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting photo:', insertError)
      return NextResponse.json(
        { error: "写真の登録中にエラーが発生しました" },
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
      message: "写真が登録されました",
      photo
    })
  } catch (error) {
    console.error('Error in photo upload API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

// 学校・コース写真を取得するエンドポイント
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: schoolId } = params
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
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
    
    // 2. 写真情報を取得
    let query = supabase
      .from('school_photos')
      .select('*')
      .eq('school_id', schoolId)
    
    // コースIDが指定されている場合はフィルタリング
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    const { data: photos, error: fetchError } = await query
    
    if (fetchError) {
      console.error('Error fetching photos:', fetchError)
      return NextResponse.json(
        { error: "写真の取得中にエラーが発生しました" },
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
      photos
    })
  } catch (error) {
    console.error('Error in photo fetch API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

// 学校・コース写真を削除するエンドポイント
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: schoolId } = params
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!photoId || !token || !email) {
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
    
    // 2. 写真情報を削除
    const { error: deleteError } = await supabase
      .from('school_photos')
      .delete()
      .eq('id', photoId)
      .eq('school_id', schoolId)
    
    if (deleteError) {
      console.error('Error deleting photo:', deleteError)
      return NextResponse.json(
        { error: "写真の削除中にエラーが発生しました" },
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
      message: "写真が削除されました"
    })
  } catch (error) {
    console.error('Error in photo delete API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
} 