import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('request_id');
    const verbose = request.nextUrl.searchParams.get('verbose') === 'true';
    
    if (!requestId) {
      console.error('リクエストIDが指定されていません');
      return NextResponse.json(
        { error: "request_idは必須です" },
        { status: 400 }
      );
    }
    
    console.log(`【ユーザー】Content Snareリクエスト情報取得 (ID: ${requestId}, verbose: ${verbose})`);
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証セッションを取得（ユーザー認証のみ - 管理者権限不要）
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    // ユーザーIDを取得
    const userId = session.user.id;
    
    // コース申請データを確認（ユーザー自身の申請データのみアクセス可能）
    let contentSnareRequestId;
    
    console.log(`リクエストID: ${requestId}`);
    console.log(`ユーザーID: ${userId}`);
    
    // 1. まず指定されたIDが直接Content Snare Request IDの場合を確認
    // (アプリケーションIDより先にContent Snare Request IDかどうかをチェック)
    const { data: directRequestData } = await supabase
      .from('course_applications')
      .select('id, user_id')
      .eq('content_snare_request_id', requestId)
      .single();
    
    if (directRequestData) {
      console.log(`直接Content Snare Request IDとして一致: ${requestId}`);
      console.log(`所有者ID: ${directRequestData.user_id}, 現在のユーザーID: ${userId}`);
      
      // ユーザー自身のものかチェック
      if (directRequestData.user_id === userId) {
        console.log("所有者とユーザーが一致");
        contentSnareRequestId = requestId;
      } else {
        console.error("このContent Snare Request IDにアクセスする権限がありません");
        return NextResponse.json(
          { error: "指定されたContent Snareデータにアクセスする権限がありません" },
          { status: 403 }
        );
      }
    } else {
      // 2. 申請IDから検索
      console.log(`申請IDとして検索: ${requestId}`);
      const { data: applicationData, error: applicationError } = await supabase
        .from('course_applications')
        .select('content_snare_request_id, content_snare_id, user_id')
        .eq('id', requestId)
        .single();
      
      if (applicationData) {
        console.log(`申請データ検索結果:`, {
          content_snare_request_id: applicationData.content_snare_request_id,
          content_snare_id: applicationData.content_snare_id,
          user_id: applicationData.user_id
        });
        
        // ユーザー自身のものかチェック
        if (applicationData.user_id !== userId) {
          console.error("この申請データにアクセスする権限がありません");
          return NextResponse.json(
            { error: "指定された申請データにアクセスする権限がありません" },
            { status: 403 }
          );
        }
        
        // content_snare_request_idかcontent_snare_idを使用
        if (applicationData.content_snare_request_id) {
          contentSnareRequestId = applicationData.content_snare_request_id;
          console.log(`申請IDからContent Snare Request IDを取得: ${contentSnareRequestId}`);
        } else if (applicationData.content_snare_id) {
          // content_snare_idがある場合はそれを使用
          contentSnareRequestId = applicationData.content_snare_id;
          console.log(`申請IDからContent Snare IDを使用: ${contentSnareRequestId}`);
        }
      } else {
        // 3. 最後の手段として、直接パラメータをContent Snare IDとして使用
        console.log(`直接パラメータをContent Snare IDとして使用: ${requestId}`);
        contentSnareRequestId = requestId;
      }
    }
    
    if (!contentSnareRequestId) {
      console.error("Content Snare Request IDを特定できませんでした");
      return NextResponse.json(
        { error: "Content Snare Request IDを特定できませんでした", details: "指定されたIDからContent Snare情報を見つけられません" },
        { status: 404 }
      );
    }
    
    console.log(`Content Snare Request ID: ${contentSnareRequestId}`);
    
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
    
    // Content Snare APIを呼び出す関数
    const callContentSnareApi = async (token: string) => {
      const apiUrl = `https://api.contentsnare.com/partner_api/v1/requests/${contentSnareRequestId}`;
      console.log("APIエンドポイント:", apiUrl);

      return await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
    };

    // 最初のAPI呼び出し
    let apiResponse = await callContentSnareApi(accessToken);

    // 401エラーの場合、トークンを再発行して再試行
    if (apiResponse.status === 401) {
      console.log("401エラー発生: トークンの再発行を試みます");
      
      // メモリ内のトークンをクリア
      process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = undefined;

      // リフレッシュトークンでアクセストークンを再取得
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
        console.error("トークン再発行に失敗しました:", await refreshResponse.text());
        return NextResponse.json({ error: "トークンの再発行に失敗しました。再認証が必要です。" }, { status: 401 });
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.access_token;

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
      process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = newAccessToken;
      console.log("新しいアクセストークンをメモリに保存しました");

      // 新しいトークンでAPI再呼び出し
      apiResponse = await callContentSnareApi(newAccessToken);
    }

    // レスポンスの処理
    if (!apiResponse.ok) {
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
    console.log("リクエスト情報取得成功:", { 
      id: responseData.id, 
      name: responseData.name, 
      status: responseData.status 
    });
    
    // ページ情報を処理して進捗状況を計算
    const pages = responseData.pages || [];
    
    // 総フィールド数と完了フィールド数を計算
    const totalFields = pages.reduce((acc: number, page: any) => {
      return acc + (page.fields_count !== undefined && page.fields_count !== null 
        ? Number(page.fields_count) 
        : 0);
    }, 0);
    
    const doneTotalFields = pages.reduce((acc: number, page: any) => {
      return acc + (page.done_fields_count !== undefined && page.done_fields_count !== null 
        ? Number(page.done_fields_count) 
        : 0);
    }, 0);
    
    // セクション情報を処理
    const sections = responseData.sections || [];
    let completedSections = 0;
    
    // 完了セクション数を計算
    sections.forEach((section: any) => {
      if (section.status === 'complete') {
        completedSections++;
      }
    });
    
    // 進捗率を計算
    let percent = 0;
    if (responseData.completion_percentage !== undefined) {
      percent = Number(responseData.completion_percentage);
      console.log(`APIから直接取得した完了率を使用: ${percent}%`);
    } else if (totalFields > 0) {
      percent = Math.round((doneTotalFields / totalFields) * 100);
      console.log(`計算した完了率を使用: ${percent}%`);
    }
    
    // progressオブジェクトを作成
    const progress = {
      total_fields: totalFields,
      done_fields: doneTotalFields,
      percent: percent,
      completed_sections: completedSections,
      total_sections: sections.length
    };
    
    console.log('進捗状況:', progress);
    
    // ページ情報を簡略化（オプション）
    const simplifiedPages = !verbose ? pages.map((page: any) => ({
      id: page.id,
      name: page.name,
      status: page.status,
      fields_count: page.fields_count,
      done_fields_count: page.done_fields_count
    })) : pages;
    
    // 統合したレスポンスを返す
    const result: any = {
      id: responseData.id,
      name: responseData.name,
      status: responseData.status,
      url: responseData.url,
      created_at: responseData.created_at,
      updated_at: responseData.updated_at,
      progress,
      sections,
      pages: simplifiedPages,
      client: responseData.client,
      has_unread_comments: responseData.has_unread_comments,
      // 古いAPIとの互換性のために追加
      fields_count: totalFields,
      done_fields_count: doneTotalFields,
      completion_percentage: percent,
      client_full_name: responseData.client?.full_name || '',
      client_email: responseData.client?.email || '',
      share_link: responseData.share_link,
      due: responseData.due,
      folder_name: responseData.folder_name,
      last_activity_at: responseData.last_activity_at
    };
    
    // 詳細モードの場合は、responsesも含める
    if (verbose && responseData.responses) {
      result.responses = responseData.responses;
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Content Snare情報取得エラー:", error);
    return NextResponse.json({ error: "Content Snare情報の取得に失敗しました" }, { status: 500 });
  }
} 