import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    console.log("Content Snare トークン交換API呼び出し開始");
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 認証されていないリクエストを拒否
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("認証なしリクエスト拒否");
      return NextResponse.json({ error: "認証されていません" }, { status: 401 });
    }

    console.log("認証済みユーザー:", session.user.id);

    // システム共通のContent Snareリフレッシュトークンを取得
    console.log("システム共通のContent Snareリフレッシュトークンを検索中...");
    const { data: tokens, error: tokensError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('service_name', 'content_snare')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (tokensError) {
      console.error("リフレッシュトークン検索エラー:", tokensError);
      return NextResponse.json({ error: "トークン取得エラー" }, { status: 500 });
    }
    
    if (!tokens || tokens.length === 0) {
      console.error("Content Snareのリフレッシュトークンが見つかりません");
      return NextResponse.json({ error: "Content Snareの認証が必要です" }, { status: 403 });
    }
    
    const contentSnareToken = tokens[0];
    console.log("Content Snareトークンが見つかりました:", {
      id: contentSnareToken.id,
      token_length: contentSnareToken.refresh_token ? contentSnareToken.refresh_token.length : 0
    });
    
    // リフレッシュトークンでアクセストークンを取得
    const refreshResponse = await fetch(`https://api.contentsnare.com/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.CONTENT_SNARE_CLIENT_ID,
        client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
        refresh_token: contentSnareToken.refresh_token
      })
    });
    
    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("トークンリフレッシュエラー:", errorText);
      return NextResponse.json({ error: "トークンのリフレッシュに失敗しました" }, { status: 403 });
    }
    
    const refreshData = await refreshResponse.json();
    console.log("新しいアクセストークンを取得しました");
    
    // 新しいリフレッシュトークンをシステム用に保存
    await supabase
      .from('refresh_tokens')
      .update({
        refresh_token: refreshData.refresh_token,
        service_name: 'content_snare', // 小文字を確実に維持
        updated_at: new Date().toISOString()
      })
      .eq('id', contentSnareToken.id);
    
    // 一時的なアクセストークンをメモリに保存（開発環境用）
    if (process.env.NODE_ENV === 'development') {
      process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = refreshData.access_token;
      console.log('一時アクセストークンを環境変数に保存しました');
    }
    
    return NextResponse.json({
      access_token: refreshData.access_token,
      token_type: refreshData.token_type,
      expires_in: refreshData.expires_in
    });
  } catch (error) {
    console.error("トークン交換エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" }, 
      { status: 500 }
    );
  }
} 