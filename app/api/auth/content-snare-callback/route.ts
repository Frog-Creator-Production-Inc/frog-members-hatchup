import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log("Content Snare OAuth コールバック処理を開始");
    
    // URLからクエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    console.log("認証コード:", code ? `取得済み（長さ: ${code.length}）` : '未取得');
    console.log("State:", state || '未設定');
    
    if (!code) {
      console.error("認証コードが見つかりません");
      return NextResponse.redirect(new URL('/error?message=No+authorization+code+provided', request.url));
    }
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 認証セッションを確認
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.redirect(new URL('/login?redirect=/settings', request.url));
    }
    
    console.log("認証済みユーザー:", session.user.id);
    
    // 認証コードをアクセストークンと交換
    console.log("認証コードをアクセストークンに交換中...");
    console.log("クライアントID長:", process.env.CONTENT_SNARE_CLIENT_ID?.length || 0);
    console.log("クライアントシークレット長:", process.env.CONTENT_SNARE_CLIENT_SECRET?.length || 0);
    console.log("リダイレクトURI:", process.env.CONTENT_SNARE_REDIRECT_URI);
    
    const tokenResponse = await fetch('https://api.contentsnare.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.CONTENT_SNARE_CLIENT_ID,
        client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.CONTENT_SNARE_REDIRECT_URI
      })
    });
    
    console.log("トークン交換レスポンスステータス:", tokenResponse.status);
    
    if (!tokenResponse.ok) {
      try {
        const errorData = await tokenResponse.json();
        console.error("トークン交換エラー (JSON):", JSON.stringify(errorData));
      } catch (e) {
        const errorText = await tokenResponse.text();
        console.error("トークン交換エラー (テキスト):", errorText);
      }
      console.error("レスポンスヘッダー:", JSON.stringify(Object.fromEntries([...tokenResponse.headers.entries()])));
      return NextResponse.redirect(
        new URL(`/settings?error=token_exchange&status=${tokenResponse.status}`, request.url)
      );
    }
    
    const tokenData = await tokenResponse.json();
    console.log("トークン交換成功:", {
      access_token_length: tokenData.access_token?.length || 0,
      refresh_token_length: tokenData.refresh_token?.length || 0,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in
    });
    
    // 既存のトークンを削除
    console.log("既存のContent Snareトークンを削除中...");
    try {
      const { error: deleteError } = await supabase
        .from('refresh_tokens')
        .delete()
        .eq('service_name', 'content_snare');
        
      if (deleteError) {
        console.error("トークン削除エラー:", deleteError);
      } else {
        console.log("既存のトークンを削除しました");
      }
    } catch (deleteException) {
      console.error("トークン削除例外:", deleteException);
    }
    
    // データベースにリフレッシュトークンを保存
    console.log("新しいトークンをデータベースに保存中...");
    const { data: insertData, error: insertError } = await supabase
      .from('refresh_tokens')
      .insert({
        service_name: 'content_snare',
        refresh_token: tokenData.refresh_token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id');
    
    if (insertError) {
      console.error("トークン保存エラー:", insertError);
      return NextResponse.redirect(
        new URL('/settings?error=token_storage', request.url)
      );
    }
    
    console.log("トークン保存成功:", insertData);
    
    // 一時的にアクセストークンをプロセスメモリに保存
    process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = tokenData.access_token;
    console.log("一時アクセストークンをメモリに保存（長さ:", tokenData.access_token.length, "）");
    
    // 成功リダイレクト
    return NextResponse.redirect(new URL('/settings?success=content_snare_connected', request.url));
  } catch (error) {
    console.error("Content Snare OAuth コールバックエラー:", error);
    return NextResponse.redirect(new URL('/settings?error=general', request.url));
  }
} 