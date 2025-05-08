import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    console.log("Content Snare ステータス確認API呼び出し開始");
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 認証されていないリクエストを拒否
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("認証なしリクエスト拒否");
      return NextResponse.json({ error: "認証されていません" }, { status: 401 });
    }

    console.log("認証済みユーザー:", session.user.id);

    // リクエストボディを解析
    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      console.error("submissionId が不足しています");
      return NextResponse.json(
        { error: "submissionId が必要です" }, 
        { status: 400 }
      );
    }

    console.log(`サブミッションID: ${submissionId}`);

    // アクセストークン取得戦略
    let accessToken = '';
    
    // 1. まず環境変数CONTENT_SNARE_ACCESS_TOKENを確認（最も信頼性が高い）
    if (process.env.CONTENT_SNARE_ACCESS_TOKEN) {
      console.log("環境変数CONTENT_SNARE_ACCESS_TOKENからトークンを取得");
      accessToken = process.env.CONTENT_SNARE_ACCESS_TOKEN;
    } 
    // 2. 次にメモリ内の一時トークンを確認
    else if (process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN) {
      console.log("メモリ内の一時トークンを取得");
      accessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    } 
    // 3. 最後にデータベースを確認
    else {
      try {
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
        accessToken = refreshData.access_token;
        
        // 新しいリフレッシュトークンをシステム用に保存
        await supabase
          .from('refresh_tokens')
          .update({
            refresh_token: refreshData.refresh_token,
            service_name: 'content_snare', // 小文字を確実に維持
            updated_at: new Date().toISOString()
          })
          .eq('id', contentSnareToken.id);
          
      } catch (error) {
        const dbError = error as Error;
        console.log("データベース操作エラー:", dbError.message);
        // データベースエラーは無視して続行
      }
    }
    
    // トークンが見つからない場合はエラー
    if (!accessToken) {
      console.error("トークンが見つかりません");
      return NextResponse.json(
        { error: "Content Snareのアクセストークンが見つかりません。.env.localファイルまたは環境変数にCONTENT_SNARE_ACCESS_TOKENを設定してください。" }, 
        { status: 403 }
      );
    }

    // Content Snare APIを呼び出し
    const apiResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/submissions/${submissionId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Api-Key": process.env.CONTENT_SNARE_API_KEY || "",
        "X-Account-Id": process.env.CONTENT_SNARE_CLIENT_ID || ""
      }
    });

    // レスポンスをログに出力
    const responseStatus = apiResponse.status;
    const responseText = await apiResponse.text();
    console.log("Content Snare APIレスポンスステータス:", responseStatus);
    console.log("Content Snare APIレスポンス:", responseText);

    // APIからのレスポンスを解析して返す
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: "Content Snare APIエラー", details: responseText, status: responseStatus }, 
        { status: responseStatus }
      );
    }

    try {
      const responseData = JSON.parse(responseText);
      return NextResponse.json(responseData);
    } catch (jsonError) {
      console.error("JSONパースエラー:", jsonError);
      return NextResponse.json(
        { error: "レスポンスの解析に失敗しました", raw: responseText }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("ステータス確認エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" }, 
      { status: 500 }
    );
  }
} 