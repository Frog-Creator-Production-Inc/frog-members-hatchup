import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log(`【管理者】Content Snareリクエスト一覧取得`);
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    // 管理者権限の確認
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (!adminRole) {
      console.error("管理者権限がありません");
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }
    
    // リフレッシュトークンからアクセストークンを取得
    const { data: tokens, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('service_name', 'content_snare')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (tokenError || !tokens || tokens.length === 0) {
      console.error("トークン取得エラー:", tokenError);
      return NextResponse.json({ error: "Content Snareの認証が必要です" }, { status: 403 });
    }
    
    const tokenData = tokens[0];
    console.log("Content Snareトークン取得成功:", { id: tokenData.id });
    
    // メモリ内の一時的なアクセストークンをチェック
    const tempAccessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    
    let accessToken;
    
    // 一時的なアクセストークンがある場合は、それを使用
    if (tempAccessToken) {
      console.log("メモリ内の一時的なアクセストークンを使用します");
      accessToken = tempAccessToken;
    } else {
      // リフレッシュトークンでアクセストークンを取得
      const refreshResponse = await fetch('https://api.contentsnare.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: process.env.CONTENT_SNARE_CLIENT_ID,
          client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token
        })
      });
      
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
          return NextResponse.json({ error: "トークンのリフレッシュに失敗しました", details: errorMessage }, { status: 403 });
        }
      } else {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        // 新しいリフレッシュトークンを保存
        await supabase
          .from('refresh_tokens')
          .update({
            refresh_token: refreshData.refresh_token,
            updated_at: new Date().toISOString()
          })
          .eq('id', tokenData.id);
          
        console.log("新しいリフレッシュトークンを保存しました");
        
        // 一時的なアクセストークンをメモリに保存
        process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = refreshData.access_token;
        console.log("新しいアクセストークンをメモリに保存しました");
      }
    }
    
    // アクセストークンが取得できなかった場合はエラー
    if (!accessToken) {
      console.error("有効なアクセストークンが取得できませんでした");
      return NextResponse.json({ error: "有効なアクセストークンが取得できませんでした。再認証が必要です。" }, { status: 403 });
    }
    
    console.log("アクセストークン取得成功");
    
    // Content Snare API(Requests一覧)を呼び出し
    const apiUrl = `https://api.contentsnare.com/partner_api/v1/requests`;
    console.log("APIエンドポイント:", apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
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
    console.log("Content Snare APIのレスポンス形式:", JSON.stringify(responseData, null, 2));
    
    // レスポンスの形式をチェック
    let requestItems = [];
    
    if (Array.isArray(responseData)) {
      // 従来の形式：配列
      requestItems = responseData;
      console.log(`従来のレスポンス形式（配列）: ${requestItems.length}件`);
    } else if (responseData && responseData.results && Array.isArray(responseData.results)) {
      // 新しい形式：{ results: [...], pagination: {...} }
      requestItems = responseData.results;
      console.log(`新しいレスポンス形式（results配列）: ${requestItems.length}件`);
      if (responseData.pagination) {
        console.log(`ページネーション情報: 全${responseData.pagination.total_count}件`);
      }
    } else {
      console.warn("Content Snare APIからの応答が想定外の形式です:", responseData);
      // 空の配列を返す
      return NextResponse.json([]);
    }
    
    // 最初の1件をサンプルとしてログ出力
    if (requestItems.length > 0) {
      console.log("Content Snare APIのサンプルデータ（1件目）:", JSON.stringify(requestItems[0], null, 2));
    }
    
    // course_applicationsからcontent_snare_request_idを持つレコードを取得
    const { data: applications, error: applicationsError } = await supabase
      .from('course_applications')
      .select('id, content_snare_request_id')
      .not('content_snare_request_id', 'is', null);
    
    if (applicationsError) {
      console.error("申請情報取得エラー:", applicationsError);
    }
    
    // Content Snare IDとコース申請IDのマッピングを作成
    const requestIdToApplicationId = new Map();
    if (applications) {
      applications.forEach(app => {
        if (app.content_snare_request_id) {
          requestIdToApplicationId.set(app.content_snare_request_id, app.id);
        }
      });
    }
    
    // 簡略化したレスポンスデータを作成（リクエストIDとコース申請IDの対応関係を含む）
    // 一覧ページに必要な情報のみに絞る
    const simplifiedData = requestItems.map((item: any) => ({
      // 必須情報
      id: item.id,
      application_id: requestIdToApplicationId.get(item.id) || null,
      name: item.name,
      status: item.status,
      share_link: item.share_link,
      due: item.due,
      // 時間情報
      created_at: item.created_at,
      updated_at: item.updated_at,
      last_activity_at: item.last_activity_at,
      // フォルダ情報
      folder_name: item.folder_name,
      // クライアント基本情報
      client_name: item.client?.full_name,
      client_email: item.client?.email
      // 以下の情報は一覧ページでは不要なので削除
      // client_id: item.client?.id,
      // sections_count: item.sections?.length || 0,
      // pages_count: item.pages?.length || 0,
      // progress: calculateProgress(item),
      // template_id: item.template_id,
      // template_name: item.template_name,
      // has_unread_comments: item.has_unread_comments || false,
      // last_comment_at: item.last_comment_at || null,
      // sections: (item.sections || []).map((section: any) => ({
      //   id: section.id,
      //   name: section.name,
      //   status: section.status || 'pending'
      // }))
    }));
    
    // 進捗計算のヘルパー関数は削除（一覧ページでは使わない）
    
    return NextResponse.json(simplifiedData);
    
  } catch (error) {
    console.error("リクエスト一覧取得エラー:", error);
    return NextResponse.json({ error: "リクエスト一覧の取得に失敗しました" }, { status: 500 });
  }
} 