import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    console.log("Content Snareテンプレート取得APIが呼び出されました");
    
    // 認証確認
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    console.log(`認証ユーザー: ${session.user.id}`);

    // 管理者権限確認
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('user_id')
      .eq('user_id', session.user.id)
      .single();

    if (!adminRole) {
      console.log("管理者権限がありません");
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    console.log("管理者権限が確認されました");

    // Content Snareトークンを取得
    const { data: tokens, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('service_name', 'content_snare')
      .order('created_at', { ascending: false })
      .limit(1);

    if (tokenError) {
      console.error("トークン取得エラー:", tokenError);
      return NextResponse.json({ error: "トークン取得エラー", details: tokenError }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      console.log("Content Snareトークンが見つかりません");
      return NextResponse.json({ error: "Content Snareトークンが見つかりません" }, { status: 404 });
    }

    const contentSnareToken = tokens[0];
    console.log(`トークン情報: ID=${contentSnareToken.id}, リフレッシュトークン長=${contentSnareToken.refresh_token ? contentSnareToken.refresh_token.length : 0}`);

    // メモリ内の一時的なアクセストークンをチェック
    const tempAccessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    
    let accessToken;
    
    // 一時的なアクセストークンがある場合は、それを使用
    if (tempAccessToken) {
      console.log("メモリ内の一時的なアクセストークンを使用します");
      accessToken = tempAccessToken;
    } else {
      console.log("メモリ内にアクセストークンがないため、リフレッシュトークンを使用します");
      
      // リフレッシュトークンでアクセストークンを取得
      const refreshResponse = await fetch('https://api.contentsnare.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: contentSnareToken.refresh_token,
          client_id: process.env.CONTENT_SNARE_CLIENT_ID,
          client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
        }),
      });

      console.log(`リフレッシュレスポンスステータス: ${refreshResponse.status}`);
      
      if (!refreshResponse.ok) {
        let errorMessage = '';
        try {
          const errorData = await refreshResponse.json();
          errorMessage = JSON.stringify(errorData);
          console.error("トークンリフレッシュエラー (JSON):", errorMessage);
        } catch (e) {
          try {
            errorMessage = await refreshResponse.text();
            console.error("トークンリフレッシュエラー (テキスト):", errorMessage);
          } catch (textError) {
            console.error("レスポンスボディを読み込めませんでした:", textError);
          }
        }
        
        // メモリ内の一時的なアクセストークンを再チェック
        const recheckedTempToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
        if (recheckedTempToken) {
          console.log("リフレッシュトークンでの取得に失敗したため、メモリ内の一時的なアクセストークンを使用します");
          accessToken = recheckedTempToken;
        } else {
          return NextResponse.json(
            { error: "Content Snareトークンのリフレッシュに失敗しました", details: errorMessage },
            { status: 500 }
          );
        }
      } else {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        console.log("トークンリフレッシュ成功:", {
          access_token_length: refreshData.access_token?.length,
          refresh_token_length: refreshData.refresh_token?.length,
          expires_in: refreshData.expires_in
        });
        
        // 新しいリフレッシュトークンを保存
        await supabase
          .from('refresh_tokens')
          .update({
            refresh_token: refreshData.refresh_token,
            updated_at: new Date().toISOString()
          })
          .eq('id', contentSnareToken.id);
          
        console.log("新しいリフレッシュトークンを保存しました");
        
        // 一時的なアクセストークンをメモリに保存
        process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = refreshData.access_token;
        console.log("新しいアクセストークンをメモリに保存しました（長さ: " + refreshData.access_token.length + "）");
      }
    }
    
    // アクセストークンが取得できなかった場合はエラー
    if (!accessToken) {
      console.error("有効なアクセストークンが取得できませんでした");
      return NextResponse.json({ error: "有効なアクセストークンが取得できませんでした。再認証が必要です。" }, { status: 403 });
    }

    // テンプレート一覧を取得（400件取得）
    const apiUrl = `https://api.contentsnare.com/partner_api/v1/request_templates?limit=400`;
    console.log(`Content Snare APIリクエスト:`, apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Content Snare APIレスポンスステータス: ${apiResponse.status}`);

    // レスポンスが401ならトークンを削除して再認証が必要
    if (apiResponse.status === 401) {
      console.log("401エラー: 認証エラー");
      // 一時トークンを削除
      delete process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
      return NextResponse.json({ error: "認証エラー。再認証が必要です。" }, { status: 401 });
    }

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`APIエラー: ${apiResponse.status} ${errorText}`);
      return NextResponse.json(
        { error: `テンプレート取得に失敗しました: ${apiResponse.statusText}`, details: errorText },
        { status: apiResponse.status }
      );
    }

    const responseData = await apiResponse.json();
    console.log(`テンプレート取得成功:`, {
      type: typeof responseData,
      isArray: Array.isArray(responseData),
    });
    
    // レスポンス形式によってデータ抽出を変える
    let templates: any[] = [];
    
    if (Array.isArray(responseData)) {
      templates = responseData;
      console.log(`テンプレート数: ${templates.length}件`);
    } else if (responseData.results && Array.isArray(responseData.results)) {
      templates = responseData.results;
      console.log(`テンプレート数: ${templates.length}件`);
      if (responseData.pagination) {
        console.log(`ページネーション情報: 全${responseData.pagination.total_count}件`);
      }
    } else {
      console.warn(`予期しないレスポンス形式:`, responseData);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(templates);

  } catch (error) {
    console.error("テンプレート取得エラー:", error);
    return NextResponse.json(
      { error: "テンプレート取得中に問題が発生しました", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 