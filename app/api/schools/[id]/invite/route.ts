import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

// 学校の担当者用に一時アクセストークンを生成するエンドポイント
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 管理者のみがトークンを生成できるようにする
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }
    
    // 管理者かどうかを確認
    const { data: isAdmin } = await supabase
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .single()
    
    if (!isAdmin) {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 })
    }
    
    // リクエストからメールアドレスを取得
    const { email } = await request.json()
    
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "有効なメールアドレスが必要です" }, { status: 400 })
    }
    
    // 学校IDの存在確認
    const schoolId = params.id
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, name")
      .eq("id", schoolId)
      .single()
    
    if (schoolError || !school) {
      return NextResponse.json({ error: "指定された学校が見つかりません" }, { status: 404 })
    }
    
    // 30日間有効なトークンを生成
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    // 既存のトークンがあれば無効化（オプション）
    await supabase
      .from("school_access_tokens")
      .update({ expires_at: new Date().toISOString() })
      .eq("school_id", schoolId)
      .eq("email", email)
    
    // トークンをデータベースに保存
    const { error: insertError } = await supabase
      .from("school_access_tokens")
      .insert({
        school_id: schoolId,
        token,
        email,
        expires_at: expiresAt.toISOString(),
        created_by: user.id
      })
    
    if (insertError) {
      console.error("Token insert error:", insertError)
      return NextResponse.json(
        { error: "トークン生成に失敗しました" },
        { status: 500 }
      )
    }
    
    // 環境変数からベースURLを取得してアクセスURLを生成
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const accessUrl = `${baseUrl}/schools/${schoolId}/editor?token=${token}`
    
    return NextResponse.json({ 
      success: true,
      accessUrl,
      school: school.name,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error("Error generating school access token:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
} 