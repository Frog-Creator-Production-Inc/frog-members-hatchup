import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("Content Snare 認証コード取得API呼び出し開始");
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証されていないリクエストを拒否
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("認証なしリクエスト拒否");
      return NextResponse.json({ error: "認証されていません" }, { status: 401 });
    }

    // 固定リダイレクトURI
    const redirectUri = 'https://d1cb-198-47-46-122.ngrok-free.app/oauth/redirect';
    
    // OAuth 2.0の認可コードフローの開始URL生成
    const authUrl = new URL('https://api.contentsnare.com/oauth/authorize');
    authUrl.searchParams.append('client_id', process.env.CONTENT_SNARE_CLIENT_ID || '');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    
    // Content Snare APIドキュメントに基づいてスコープを設定
    // 必要な最小限のスコープのみを指定（セキュリティのため）
    authUrl.searchParams.append('scope', 'read_clients write_clients read_requests write_requests');
    
    // ランダムなstate値を生成してセキュリティを向上
    const state = Math.random().toString(36).substring(2, 15);
    authUrl.searchParams.append('state', state);
    
    // stateをセッションに保存（CSRF対策）
    // 実際のリダイレクトハンドラでこれを検証できる
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        user_id: session.user.id,
        service: 'content_snare',
        state: state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分後に期限切れ
      });
    
    if (stateError) {
      console.error("状態保存エラー:", stateError);
      return NextResponse.json({ error: "認証の準備に失敗しました" }, { status: 500 });
    }
    
    // URLを返す
    return NextResponse.json({
      authUrl: authUrl.toString(),
      state: state
    });
    
  } catch (error) {
    console.error("認証URL生成エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" }, 
      { status: 500 }
    );
  }
} 