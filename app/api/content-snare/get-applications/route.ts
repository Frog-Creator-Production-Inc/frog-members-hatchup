import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log("コース申請一覧取得処理開始");
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("認証済みユーザー:", userId);
    
    // ユーザーのコース申請情報を取得
    const { data: applications, error: applicationsError } = await supabase
      .from('course_applications')
      .select(`
        *,
        course:courses(id, name, school_id, category, description, content_snare_template_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (applicationsError) {
      console.error("申請一覧取得エラー:", applicationsError);
      return NextResponse.json({ error: "申請情報の取得に失敗しました" }, { status: 500 });
    }
    
    return NextResponse.json({
      applications,
      success: true
    });
    
  } catch (error) {
    console.error("申請一覧取得エラー:", error);
    return NextResponse.json({ error: "申請一覧の取得に失敗しました" }, { status: 500 });
  }
} 