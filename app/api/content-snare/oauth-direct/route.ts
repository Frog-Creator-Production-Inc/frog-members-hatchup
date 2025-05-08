import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("Content Snare OAuth URL生成開始");
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("認証済みユーザー:", userId);
    
    // OAuth 認可URL生成
    const oauth_url = new URL("https://api.contentsnare.com/oauth/authorize");
    oauth_url.searchParams.append("client_id", process.env.CONTENT_SNARE_CLIENT_ID || "");
    oauth_url.searchParams.append("redirect_uri", process.env.CONTENT_SNARE_REDIRECT_URI || "");
    oauth_url.searchParams.append("response_type", "code");
    oauth_url.searchParams.append("scope", "read_clients write_clients read_team_members write_team_members read_requests write_requests review_requests read_templates administration");
    
    // 状態パラメータとして現在のユーザーIDを含める（オプション）
    oauth_url.searchParams.append("state", userId);
    
    console.log("OAuth URL生成完了:", oauth_url.toString());
    
    return NextResponse.json({ url: oauth_url.toString() });
    
  } catch (error) {
    console.error("OAuth URL生成エラー:", error);
    return NextResponse.json({ error: "認証URLの生成に失敗しました" }, { status: 500 });
  }
} 