import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    console.log("Content Snare クライアント作成処理開始");
    
    // リクエストボディを取得
    const body = await request.json();
    const { firstName, lastName, email } = body;
    
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "firstName, lastName, emailは必須です" }, 
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
    
    // ユーザープロファイルからメールアドレスを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error("プロファイル取得エラー:", profileError);
      // プロファイルが取得できない場合はリクエストのメールアドレスを使用
    } else if (profile && profile.email) {
      // ユーザーのメールアドレスを使用（リクエストのメールを上書き）
      console.log(`ユーザープロファイルのメールアドレスを使用: ${profile.email}`);
      // email = profile.email; // リクエストのメールアドレスを尊重するためコメントアウト
    }
    
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
    console.log("リフレッシュトークンでアクセストークンを取得します。トークン長:", contentSnareToken.refresh_token?.length);
    console.log("CONTENT_SNARE_CLIENT_ID長:", process.env.CONTENT_SNARE_CLIENT_ID?.length);
    console.log("CONTENT_SNARE_CLIENT_SECRET長:", process.env.CONTENT_SNARE_CLIENT_SECRET?.length);
    
    // メモリ内の一時的なアクセストークンをチェック
    const tempAccessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    if (tempAccessToken) {
      console.log("メモリ内の一時的なアクセストークンが見つかりました（長さ:", tempAccessToken.length, "）");
    }
    
    let accessToken = null;
    
    // 一時的なアクセストークンがある場合は、それを使用
    if (tempAccessToken) {
      console.log("メモリ内の一時的なアクセストークンを使用します");
      accessToken = tempAccessToken;
    } else {
      // リフレッシュトークンでアクセストークンを取得
      const tokenRequestPayload = {
        grant_type: 'refresh_token',
        client_id: process.env.CONTENT_SNARE_CLIENT_ID,
        client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
        refresh_token: contentSnareToken.refresh_token
      };
      
      console.log("トークンリクエストペイロード:", JSON.stringify(tokenRequestPayload).replace(/(client_secret":"[^"]{5})[^"]+/, "$1...").replace(/(refresh_token":"[^"]{5})[^"]+/, "$1..."));
      
      // 正確なOAuthトークンエンドポイントURLを使用
      const refreshResponse = await fetch('https://api.contentsnare.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenRequestPayload)
      });
      
      if (!refreshResponse.ok) {
        let errorMessage = '';
        try {
          const errorData = await refreshResponse.json();
          errorMessage = JSON.stringify(errorData);
          console.error("トークンリフレッシュエラー (JSON):", errorMessage);
        } catch (e) {
          try {
            // refreshResponseはすでに消費されている可能性があるためtryで囲む
            errorMessage = await refreshResponse.text();
            console.error("トークンリフレッシュエラー (テキスト):", errorMessage);
          } catch (textError) {
            console.error("レスポンスボディを読み込めませんでした:", textError);
          }
        }
        console.error("HTTPステータス:", refreshResponse.status);
        console.error("レスポンスヘッダー:", JSON.stringify(Object.fromEntries([...refreshResponse.headers.entries()])));
        
        // メモリ内の一時的なアクセストークンがあればフォールバックとして使用
        if (tempAccessToken) {
          console.log("リフレッシュトークンでの取得に失敗したため、メモリ内の一時的なアクセストークンを使用します");
          accessToken = tempAccessToken;
        } else {
          return NextResponse.json({ error: "トークンのリフレッシュに失敗しました。再認証が必要です。", details: errorMessage }, { status: 403 });
        }
      } else {
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
        
        console.log("新しいリフレッシュトークンを保存しました");
      }
    }
    
    // アクセストークンが取得できなかった場合はエラー
    if (!accessToken) {
      console.error("有効なアクセストークンが取得できませんでした");
      return NextResponse.json({ error: "有効なアクセストークンが取得できませんでした。再認証が必要です。" }, { status: 403 });
    }
    
    console.log("アクセストークン取得成功（長さ:", accessToken.length, "）");
    
    // まず既存のクライアントを検索
    console.log(`メールアドレス '${email}' でクライアントを検索します`);
    const searchResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/clients?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log("クライアント検索結果:", searchData);
      
      if (searchData.results && searchData.results.length > 0) {
        const existingClient = searchData.results.find((client: { email: string }) => 
          client.email.toLowerCase() === email.toLowerCase()
        );
        
        if (existingClient) {
          console.log("既存クライアント情報:", existingClient);
          return NextResponse.json({
            client_id: existingClient.id,
            success: true,
            already_exists: true,
            client_info: existingClient
          });
        }
      }
    } else {
      console.log("クライアント検索に失敗しました、新規作成を試みます");
    }
    
    // APIリクエストボディの作成
    const apiRequestBody = {
      full_name: `${firstName} ${lastName}`,
      email: email,
      language_code: "en"
    };
    
    console.log("APIリクエスト準備:", apiRequestBody);
    
    // Content Snare APIを呼び出し
    const apiResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(apiRequestBody)
    });
    
    // レスポンスの処理
    if (!apiResponse.ok) {
      // 401エラーは認証エラー
      if (apiResponse.status === 401) {
        return NextResponse.json({ error: "認証エラー。再認証が必要です。" }, { status: 401 });
      }
      
      let errorDetails;
      try {
        errorDetails = await apiResponse.json();
        console.error("Content Snare APIエラー詳細 (JSON):", JSON.stringify(errorDetails));
        
        // already_invitedエラーの場合は、既存のクライアントを検索して返す
        if (errorDetails.errors && errorDetails.errors.includes("already_invited")) {
          console.log("クライアントはすでに存在します。既存のクライアントを検索します。");
          
          // クライアント検索APIを呼び出し
          const searchResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/clients?email=${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${accessToken}`
            }
          });
          
          if (!searchResponse.ok) {
            console.error("既存クライアント検索失敗:", await searchResponse.text());
            return NextResponse.json({ error: "クライアントは既に存在しますが、詳細を取得できませんでした。", details: errorDetails }, { status: 422 });
          }
          
          const searchData = await searchResponse.json();
          console.log("既存クライアント検索結果:", searchData);
          
          if (searchData.results && searchData.results.length > 0) {
            const existingClient = searchData.results.find((client: { email: string }) => client.email.toLowerCase() === email.toLowerCase());
            if (existingClient) {
              console.log("既存クライアント情報:", existingClient);
              return NextResponse.json({
                client_id: existingClient.id,
                success: true,
                already_exists: true,
                client_info: existingClient
              });
            }
          }
        }
      } catch (e) {
        errorDetails = await apiResponse.text();
        console.error("Content Snare APIエラー詳細 (テキスト):", errorDetails);
      }
      
      return NextResponse.json(
        { error: "Content Snare APIエラー", details: errorDetails }, 
        { status: apiResponse.status }
      );
    }
    
    const responseData = await apiResponse.json();
    console.log("クライアント作成成功:", responseData);
    
    return NextResponse.json({
      client_id: responseData.id,
      success: true
    });
    
  } catch (error) {
    console.error("クライアント作成エラー:", error);
    return NextResponse.json({ error: "クライアント作成に失敗しました" }, { status: 500 });
  }
} 