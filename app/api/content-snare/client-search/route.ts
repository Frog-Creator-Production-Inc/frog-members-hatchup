import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log("Content Snare クライアント検索処理開始");
    
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: "emailクエリパラメータは必須です" }, 
        { status: 400 }
      );
    }
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    console.log("認証済みユーザー:", session.user.id);
    
    // アクセストークン取得戦略
    let accessToken = '';
    
    // 1. まず環境変数CONTENT_SNARE_ACCESS_TOKENを確認
    if (process.env.CONTENT_SNARE_ACCESS_TOKEN) {
      console.log("環境変数CONTENT_SNARE_ACCESS_TOKENからトークンを取得");
      accessToken = process.env.CONTENT_SNARE_ACCESS_TOKEN;
    } 
    // 2. 次にメモリ内の一時トークンを確認
    else if (process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN) {
      console.log("メモリ内の一時トークンを取得（長さ:", process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN.length, "）");
      accessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    } 
    // 3. 最後にデータベースからリフレッシュトークンを取得
    else {
      console.log("データベースからトークン取得を試みます");
    
      // まず全てのリフレッシュトークンを確認
      console.log("リフレッシュトークンテーブル内の全トークンを取得中...");
      const { data: allTokens, error: allTokensError } = await supabase
        .from('refresh_tokens')
        .select('*');
        
      if (allTokensError) {
        console.error("全トークン取得エラー:", allTokensError);
      } else {
        console.log(`リフレッシュトークンテーブル内のトークン数: ${allTokens.length}`);
        if (allTokens.length > 0) {
          console.log("トークン例:", allTokens.map(token => ({
            id: token.id,
            service_name: token.service_name,
            token_exists: !!token.refresh_token,
            token_length: token.refresh_token ? token.refresh_token.length : 0
          })));
          
          // service_nameごとにグループ化して表示
          const serviceNames = [...new Set(allTokens.map(token => token.service_name))];
          console.log("存在するservice_name値:", serviceNames);
        }
      }
      
      // 大文字小文字を区別せずにContent Snareトークンを検索
      console.log("Content Snareトークン検索中（大文字小文字区別なし）...");
      
      // 全てのトークンを取得して手動でフィルタリング
      const { data: tokens, error: tokensError } = await supabase
        .from('refresh_tokens')
        .select('*');
        
      if (tokensError) {
        console.error("リフレッシュトークン検索エラー:", tokensError);
        return NextResponse.json({ error: "トークン取得エラー" }, { status: 500 });
      }
      
      // 大文字小文字を区別せずにContent Snareトークンをフィルタリング
      const contentSnareTokens = tokens.filter(token => 
        token.service_name && 
        token.service_name.toLowerCase().trim() === 'content_snare'
      );
      
      console.log(`Content Snareトークン（大文字小文字区別なし）: ${contentSnareTokens.length}件`);
      
      if (contentSnareTokens.length === 0) {
        console.error("Content Snareのリフレッシュトークンが見つかりません");
        return NextResponse.json({ error: "Content Snareの認証が必要です" }, { status: 403 });
      }
      
      // 最新のトークンを使用
      const contentSnareToken = contentSnareTokens[0];
      console.log("Content Snareトークンが見つかりました:", {
        id: contentSnareToken.id,
        service_name: contentSnareToken.service_name,
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
      accessToken = refreshData.access_token;
      
      // 一時的なアクセストークンをメモリに保存
      process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = refreshData.access_token;
      console.log("新しい一時アクセストークンをメモリに保存しました");
      
      // 新しいリフレッシュトークンをシステム用に保存
      await supabase
        .from('refresh_tokens')
        .update({
          refresh_token: refreshData.refresh_token,
          service_name: 'content_snare', // 小文字で統一
          updated_at: new Date().toISOString()
        })
        .eq('id', contentSnareToken.id);
    }
    
    if (!accessToken) {
      console.error("アクセストークンが取得できませんでした");
      return NextResponse.json({ error: "Content Snareへのアクセストークンが取得できませんでした。再認証してください" }, { status: 403 });
    }
    
    console.log("アクセストークン取得成功（長さ:", accessToken.length, "）");
    
    // Content Snare APIを呼び出し
    const apiResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/clients?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Api-Key": process.env.CONTENT_SNARE_API_KEY || "",
        "X-Account-Id": process.env.CONTENT_SNARE_CLIENT_ID || ""
      }
    });
    
    console.log("API呼び出しステータス:", apiResponse.status);
    
    // レスポンスの処理
    if (!apiResponse.ok) {
      // 401エラーは認証エラー
      if (apiResponse.status === 401) {
        return NextResponse.json({ error: "認証エラー。再認証が必要です。" }, { status: 401 });
      }
      
      const errorText = await apiResponse.text();
      console.error("APIエラーレスポンス:", errorText);
      return NextResponse.json(
        { error: "Content Snare APIエラー", details: errorText }, 
        { status: apiResponse.status }
      );
    }
    
    const responseText = await apiResponse.text();
    console.log("APIレスポンス:", responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log("クライアント検索成功:", responseData);
      
      return NextResponse.json({
        clients: responseData,
        success: true
      });
    } catch (jsonError) {
      console.error("JSONパースエラー:", jsonError);
      return NextResponse.json({ 
        error: "レスポンスの解析に失敗しました", 
        raw: responseText 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("クライアント検索エラー:", error);
    return NextResponse.json({ error: "クライアント検索に失敗しました" }, { status: 500 });
  }
} 