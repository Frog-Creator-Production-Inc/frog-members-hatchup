import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータからapplicationIdを取得
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    
    if (!applicationId) {
      return NextResponse.json({ error: "applicationIdは必須です" }, { status: 400 });
    }
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    // コース申請情報を取得（intake_date_idを含む）
    const { data: application, error: applicationError } = await supabase
      .from('course_applications')
      .select(`
        *,
        intake_date:intake_date_id (
          id,
          course_id,
          start_date,
          application_deadline,
          month,
          day,
          year,
          is_tentative,
          notes
        )
      `)
      .eq('id', applicationId)
      .single();
    
    if (applicationError) {
      console.error("コース申請取得エラー:", applicationError);
      return NextResponse.json({ error: "コース申請が見つかりません" }, { status: 404 });
    }
    
    // ユーザーが所有者でない場合はエラー
    if (application.user_id !== session.user.id) {
      console.error("権限エラー: ユーザーIDが一致しません");
      return NextResponse.json({ error: "このコース申請へのアクセス権がありません" }, { status: 403 });
    }
    
    // コース情報を取得
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', application.course_id)
      .single();
    
    if (courseError) {
      console.error("コース情報取得エラー:", courseError);
      return NextResponse.json({ error: "コース情報が見つかりません" }, { status: 404 });
    }
    
    // レスポンスデータを作成
    const responseData = {
      application,
      course
    };
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error("API内部エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" }, 
      { status: 500 }
    );
  }
} 