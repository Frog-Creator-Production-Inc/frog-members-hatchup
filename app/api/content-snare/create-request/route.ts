import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

// 開発環境でのみ証明書検証をスキップ
const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: NextRequest) {
  try {
    console.log("Content Snare リクエスト作成処理開始");
    
    // リクエストボディを取得
    const body = await request.json();
    const { courseId, clientId } = body;
    
    if (!courseId || !clientId) {
      return NextResponse.json(
        { error: "courseId, clientIdは必須です" }, 
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
    
    const userId = session.user.id;
    console.log("認証済みユーザー:", userId);
    
    // コース情報を取得
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError || !courseData) {
      console.error("コース情報取得エラー:", courseError);
      return NextResponse.json({ error: "指定されたコースが見つかりません" }, { status: 404 });
    }
    
    // テンプレートIDが設定されているか確認
    if (!courseData.content_snare_template_id) {
      console.error("コースにContent Snareテンプレートが設定されていません");
      return NextResponse.json({ error: "このコースはオンライン申込に対応していません" }, { status: 400 });
    }
    
    // ユーザー情報を取得
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData) {
      console.error("プロファイル情報取得エラー:", profileError);
      return NextResponse.json({ error: "ユーザー情報が見つかりません" }, { status: 404 });
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
    console.log("Content Snareトークン取得成功:", { id: tokenData.id, token_length: tokenData.refresh_token?.length || 0 });
    
    // メモリ内の一時的なアクセストークンをチェック
    const tempAccessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    if (tempAccessToken) {
      console.log("メモリ内の一時的なアクセストークンが見つかりました（長さ:", tempAccessToken.length, "）");
    }
    
    let accessToken;
    
    // 一時的なアクセストークンがある場合は、それを使用
    if (tempAccessToken) {
      console.log("メモリ内の一時的なアクセストークンを使用します");
      accessToken = tempAccessToken;
    } else {
      // リフレッシュトークンでアクセストークンを取得
      const refreshOptions = {
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
      };
      
      if (isDevelopment) {
        console.log("開発環境のため証明書検証をスキップします (トークンリフレッシュ)");
      }
      
      const refreshResponse = await fetch('https://api.contentsnare.com/oauth/token', refreshOptions);
      
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
        console.log("新しいアクセストークンをメモリに保存しました（長さ:", refreshData.access_token.length, "）");
      }
    }
    
    // アクセストークンが取得できなかった場合はエラー
    if (!accessToken) {
      console.error("有効なアクセストークンが取得できませんでした");
      return NextResponse.json({ error: "有効なアクセストークンが取得できませんでした。再認証が必要です。" }, { status: 403 });
    }
    
    console.log("アクセストークン取得成功（長さ:", accessToken.length, "）");
    
    // クライアント情報を確認・更新
    console.log("Content Snareクライアント情報を確認中...");
    const clientOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    };
    
    if (isDevelopment) {
      console.log("開発環境のため証明書検証をスキップします (クライアント情報取得)");
    }
    
    const clientResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/clients/${clientId}`, clientOptions);
    
    if (!clientResponse.ok) {
      console.error("クライアント情報取得エラー:", await clientResponse.text());
      return NextResponse.json({ error: "クライアント情報の取得に失敗しました" }, { status: 500 });
    }
    
    let clientData = await clientResponse.json();
    console.log("取得したクライアント情報:", clientData);
    
    // 常にプロファイル情報でクライアント情報を更新する
    console.log("プロファイル情報からクライアント情報を更新します");
    
    // プロファイル情報から更新データを作成
    const updateData = {
      full_name: `${profileData.first_name} ${profileData.last_name}`,
      email: profileData.email || session.user.email,
      language_code: "en"
    };
    
    console.log("クライアント情報更新データ:", updateData);
    
    // クライアント情報を更新
    const updateOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(updateData)
    };
    
    if (isDevelopment) {
      console.log("開発環境のため証明書検証をスキップします (クライアント情報更新)");
    }
    
    const updateResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/clients/${clientId}`, updateOptions);
    
    if (!updateResponse.ok) {
      console.error("クライアント情報更新エラー:", await updateResponse.text());
      return NextResponse.json({ error: "クライアント情報の更新に失敗しました" }, { status: 500 });
    }
    
    console.log("クライアント情報を更新しました");
    
    // 更新されたクライアント情報を取得
    const updatedClientOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    };
    
    if (isDevelopment) {
      console.log("開発環境のため証明書検証をスキップします (更新済みクライアント情報取得)");
    }
    
    const updatedClientResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/clients/${clientId}`, updatedClientOptions);
    
    if (updatedClientResponse.ok) {
      const updatedClientData = await updatedClientResponse.json();
      clientData = updatedClientData;
      console.log("更新後のクライアント情報:", clientData);
    }
    
    // APIリクエストボディの作成
    const apiRequestBody = {
      request_template_id: courseData.content_snare_template_id,
      client_email: clientData.email,
      client_full_name: clientData.full_name,
      name: `${courseData.name} - ${profileData.first_name} ${profileData.last_name}`,
      comments_enabled: true,
      share_via_link_enabled: true,
      status: "published"
    };
    
    console.log("APIリクエスト準備:", apiRequestBody);
    console.log("APIエンドポイント:", `${process.env.CONTENT_SNARE_API_URL || 'https://api.contentsnare.com/partner_api/v1/'}requests`);
    console.log("トークン長:", accessToken.length);
    
    // Content Snare APIを呼び出し
    const apiOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(apiRequestBody)
    };
    
    if (isDevelopment) {
      console.log("開発環境のため証明書検証をスキップします (リクエスト作成)");
    }
    
    const apiResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/requests`, apiOptions);
    
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
    console.log("リクエスト作成成功:", responseData);
    console.log("Content Snare Request ID:", responseData.id);
    
    // コース申請情報をデータベースに保存
    const { data: applicationData, error: applicationError } = await supabase
      .from('course_applications')
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          status: 'draft',
          content_snare_id: clientId,
          content_snare_request_id: responseData.id,
          request_url: responseData.share_link
        }
      ])
      .select()
      .single();
    
    if (applicationError) {
      console.error("コース申請作成エラー:", applicationError);
      return NextResponse.json({ error: "コース申請情報の保存に失敗しました" }, { status: 500 });
    }
    
    return NextResponse.json({
      request_id: responseData.id,
      share_link: responseData.share_link,
      application_id: applicationData.id,
      success: true
    });
    
  } catch (error) {
    console.error("リクエスト作成エラー:", error);
    return NextResponse.json({ error: "リクエスト作成に失敗しました" }, { status: 500 });
  } finally {
    // 開発環境での一時的な設定をリセット
    if (isDevelopment) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
  }
} 