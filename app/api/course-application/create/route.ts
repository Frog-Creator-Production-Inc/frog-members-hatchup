import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// Database型をインポートせずにジェネリックを指定しない形に修正
// import { Database } from "@/types/supabase";

// 開発環境でのみ証明書検証をスキップ
const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: NextRequest) {
  try {
    console.log("コース申請作成処理開始");
    
    // リクエストボディを取得
    const body = await request.json();
    const { courseId, clientId } = body;
    let { intake_date_id } = body;  // letに変更し再代入可能に
    
    if (!courseId || !clientId) {
      return NextResponse.json(
        { error: "courseId, clientIdは必須です" }, 
        { status: 400 }
      );
    }
    
    // 入学日IDが必須
    if (!intake_date_id) {
      return NextResponse.json(
        { error: "入学日（スタート日）の選択は必須です" }, 
        { status: 400 }
      );
    }
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("認証済みユーザー:", userId);
    
    // クライアントの認証Cookieを取得
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    console.log(`利用可能なCookie数: ${allCookies.length}`);
    
    // サーバー間のAPI呼び出しでは直接データを取得・処理する方式に変更
    console.log("コース情報とプロファイル情報を取得中...");
    
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
    
    // 入学日情報の取得
    let intakeDate = null;
    if (intake_date_id) {
      const { data: intakeDateData, error: intakeDateError } = await supabase
        .from('course_intake_dates')
        .select('*')
        .eq('id', intake_date_id)
        .single();
      
      if (!intakeDateError && intakeDateData) {
        intakeDate = intakeDateData;
        console.log('選択された入学日情報:', intakeDate);
      } else {
        console.log('入学日情報取得エラーまたは存在しません:', intakeDateError);
        return NextResponse.json({ error: "指定された入学日情報が見つかりません。有効な入学日を選択してください。" }, { status: 400 });
      }
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
    console.log("APIエンドポイント: https://api.contentsnare.com/partner_api/v1/requests");
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
          request_url: responseData.share_link,
          intake_date_id: intake_date_id || null
        }
      ])
      .select()
      .single();
    
    if (applicationError) {
      console.error("コース申請作成エラー:", applicationError);
      return NextResponse.json({ error: "コース申請情報の保存に失敗しました" }, { status: 500 });
    }
    
    // Slack通知の送信
    try {
      console.log("Slack通知を送信します...");
      
      // ユーザー名の取得
      const userName = profileData.first_name && profileData.last_name
        ? `${profileData.first_name} ${profileData.last_name}`
        : profileData.email || "不明なユーザー";
      
      // コース名の取得
      const courseName = courseData?.name || courseData?.title || "未設定コース";
      
      // 通知APIを使用してSlack通知を送信
      console.log("通知APIを使用してSlack通知を送信します...");
      
      // URLはリクエストオブジェクトから構築
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || '';
      const baseUrl = `${protocol}://${host}`;
      
      const notifyApiUrl = `${baseUrl}/api/slack/notify-course-application`;
      console.log("通知API URL:", notifyApiUrl);
      
      const notifyResponse = await fetch(notifyApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 認証情報を含む
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || ''
        },
        body: JSON.stringify({
          applicationId: applicationData.id,
          courseName: courseName,
          // 追加情報
          userId: userId,
          userName: userName,
          contentSnareRequestId: responseData.id,
          shareLink: responseData.share_link
        })
      });
      
      if (notifyResponse.ok) {
        console.log("通知APIによるSlack通知が成功しました");
      } else {
        console.warn("通知APIによるSlack通知が失敗しました:", 
          notifyResponse.status, notifyResponse.statusText);
      }
    } catch (slackError) {
      console.error("Slack通知送信中にエラーが発生しました:", slackError);
      // 通知エラーはアプリケーション作成の失敗とはしない
    }
    
    // 入学予定のユーザースケジュールを作成
    try {
      // intakeDateからスケジュール用の日付情報を取得
      console.log("入学予定日情報:", intakeDate);
      
      // 年月日の値を取得
      let scheduleYear, scheduleMonth, scheduleDay;
      
      if (intakeDate && intakeDate.year && intakeDate.month) {
        // yearとmonthとdayがある場合はそれを使用
        scheduleYear = intakeDate.year;
        scheduleMonth = intakeDate.month;
        scheduleDay = intakeDate.day || 1;
        console.log("入学日フィールドから直接日付情報を使用:", { scheduleYear, scheduleMonth, scheduleDay });
      } else if (intakeDate && intakeDate.start_date) {
        // start_dateがある場合はそれをパース
        try {
          const startDate = new Date(intakeDate.start_date);
          scheduleYear = startDate.getFullYear();
          scheduleMonth = startDate.getMonth() + 1; // JavaScriptの月は0始まり
          scheduleDay = startDate.getDate();
          console.log("start_dateから日付情報を抽出:", { scheduleYear, scheduleMonth, scheduleDay, original: intakeDate.start_date });
        } catch (parseError) {
          console.error("start_dateの解析エラー:", parseError);
          throw new Error("入学予定日の日付形式が不正です");
        }
      } else if (intakeDate && intakeDate.month) {
        // monthのみがある場合は、現在の年を使用し、dayはデフォルト値を設定
        const currentDate = new Date();
        scheduleYear = intakeDate.year || currentDate.getFullYear();
        scheduleMonth = intakeDate.month;
        scheduleDay = intakeDate.day || 1;
        console.log("部分的な日付情報から推測:", { scheduleYear, scheduleMonth, scheduleDay });
      } else {
        // いずれの条件も満たさない場合は、現在の年月を使用し、dayはデフォルト値を設定
        const currentDate = new Date();
        scheduleYear = currentDate.getFullYear();
        scheduleMonth = currentDate.getMonth() + 1; // JavaScriptの月は0始まり
        scheduleDay = 1;
        console.log("日付情報がないため現在の年月を使用:", { scheduleYear, scheduleMonth, scheduleDay });
      }
      
      // スケジュールタイトルを作成
      const scheduleTitle = `${courseData?.title || courseData?.name || '未設定コース'}入学予定`;
      console.log("作成するスケジュールタイトル:", scheduleTitle);
      console.log("スケジュール日付:", { 年: scheduleYear, 月: scheduleMonth, 日: scheduleDay });
      
      // テーブル構造を確認
      console.log("user_schedulesテーブルに挿入準備中...");
      
      // user_schedulesテーブルに直接挿入
      const { data: insertedSchedule, error: scheduleError } = await supabase
        .from('user_schedules')
        .insert({
          user_id: userId, // ユーザーIDを明示的に設定（冗長だが安全のため）
          course_application_id: applicationData.id, // 主要な関連付け
          title: scheduleTitle,
          description: 'コース入学予定日',
          year: scheduleYear,
          month: scheduleMonth,
          day: scheduleDay,
          is_admin_locked: true,
          is_completed: false,
          sort_order: 0,
          intake_date_id: intake_date_id
        })
        .select('id')
        .single();
      
      if (scheduleError) {
        console.error("ユーザースケジュール作成エラー:", scheduleError);
        
        // 詳細なエラー情報を表示
        if (scheduleError.details) {
          console.error("エラー詳細:", scheduleError.details);
        }
        if (scheduleError.hint) {
          console.error("エラーヒント:", scheduleError.hint);
        }
        
        // スケジュール作成に失敗してもアプリケーション作成は続行
      } else {
        console.log("入学予定スケジュールを作成しました (ID: " + insertedSchedule.id + ")");
      }
    } catch (scheduleError) {
      console.error("スケジュール作成処理中の例外:", scheduleError);
      // スケジュール作成に失敗してもアプリケーション作成は続行
    }
    
    return NextResponse.json({
      request_id: responseData.id,
      share_link: responseData.share_link,
      application_id: applicationData.id,
      success: true
    });
    
  } catch (error) {
    console.error("コース申請作成エラー:", error);
    return NextResponse.json({ error: "コース申請の作成に失敗しました" }, { status: 500 });
  } finally {
    // 開発環境での一時的な設定をリセット（他のリクエストへの影響を最小限に）
    if (isDevelopment) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
  }
} 