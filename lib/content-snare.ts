/**
 * Content Snare APIとの連携用ユーティリティ関数
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// メモリキャッシュ（サーバー再起動でリセット）
type TokenCache = {
  [userId: string]: {
    accessToken: string;
    expiresAt: Date;
  }
};

const tokenCache: TokenCache = {};

/**
 * Content Snare APIのアクセストークンを取得
 * キャッシュにあればそれを使用し、なければリフレッシュあるいは再認証を行う
 */
export async function getContentSnareToken(userId?: string): Promise<string | null> {
  if (!userId) {
    return null;
  }
  
  // キャッシュを確認
  const cachedToken = tokenCache[userId];
  if (cachedToken && new Date() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }
  
  try {
    // リフレッシュトークンを使ってアクセストークンを更新
    const refreshResponse = await fetch("/api/content-snare/refresh-token");
    
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      const newAccessToken = data.access_token;
      const expiresAt = new Date(data.expiresAt);
      
      // キャッシュに保存
      tokenCache[userId] = {
        accessToken: newAccessToken,
        expiresAt: expiresAt
      };
      
      return newAccessToken;
    }
    
    const errorData = await refreshResponse.json();
    if (errorData.requireReauth) {
      throw new Error("再認証が必要です");
    } else {
      throw new Error("トークンのリフレッシュに失敗しました");
    }
  } catch (error) {
    return null;
  }
}

/**
 * Content Snare APIへのリクエスト関数
 * アクセストークンの自動リフレッシュ機能付き
 */
export async function contentSnareApiRequest(
  endpoint: string,
  options: RequestInit = {},
  userId?: string
) {
  try {
    // アクセストークンを取得
    const accessToken = await getContentSnareToken(userId);
    if (!accessToken) {
      throw new Error("認証されていないか、トークンの取得に失敗しました");
    }
    
    // リクエストオプションにトークンを追加
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };
    
    // APIリクエスト
    const apiUrl = `https://api.contentsnare.com/partner_api/v1/${endpoint}`;
    const response = await fetch(apiUrl, requestOptions);
    
    // 認証エラーの場合はトークンをリフレッシュして再試行
    if (response.status === 401) {
      // キャッシュを削除
      if (userId) delete tokenCache[userId];
      
      // トークンを再取得
      const newAccessToken = await getContentSnareToken(userId);
      if (!newAccessToken) {
        throw new Error("トークンのリフレッシュに失敗しました");
      }
      
      // リクエストオプションを更新
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${newAccessToken}`
      };
      
      // 再試行
      const retryResponse = await fetch(apiUrl, requestOptions);
      return retryResponse;
    }
    
    return response;
  } catch (error) {
    return null;
  }
}

// クライアントプロファイル作成
export async function createContentSnareClient(
  firstName: string,
  lastName: string,
  email: string
): Promise<{ client_id: string }> {
  const response = await fetch("/api/content-snare/create-client", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `クライアント作成に失敗しました: ${
        errorData.error || response.statusText
      }`
    );
  }

  return response.json();
}

// 申請書提出作成
export async function createSubmission(
  clientId: string,
  courseId: string
): Promise<{ id: string; url: string }> {
  const response = await fetch("/api/content-snare/create-submission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      courseId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `提出作成に失敗しました: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}

// 申請ステータス確認
export async function checkSubmissionStatus(submissionId: string): Promise<{
  status: string;
  contentSnareStatus: string;
  details: any;
}> {
  const response = await fetch(
    `/api/content-snare/check-status?submission_id=${submissionId}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `ステータス確認に失敗しました: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}

// アプリケーションタイプ
export interface CourseApplication {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  submission_id?: string;
  submission_url?: string;
  created_at: string;
  updated_at: string;
}

// コースタイプ
export interface Course {
  id: string;
  name: string;
  description?: string;
  content_snare_template_id?: string;
}

// 提出ステータスを表示用にフォーマット
export function formatApplicationStatus(status: string): {
  label: string;
  color: string;
} {
  switch (status) {
    case "draft":
      return { label: "下書き", color: "gray" };
    case "pending":
      return { label: "処理中", color: "blue" };
    case "submitted":
      return { label: "提出済み", color: "green" };
    case "reviewing":
      return { label: "審査中", color: "yellow" };
    case "approved":
      return { label: "承認済み", color: "green" };
    case "rejected":
      return { label: "却下", color: "red" };
    default:
      return { label: "不明", color: "gray" };
  }
}

// トークンを取得する（キャッシュが有効ならキャッシュから、無効なら新しく取得）
export async function getToken(userId: string, forceRefresh = false): Promise<string | null> {
  const cacheKey = `content_snare_token:${userId}`;
  
  // 強制リフレッシュが指定されていない場合はキャッシュを確認
  if (!forceRefresh) {
    // キャッシュされたトークンを取得
    const cachedToken = tokenCache[userId];
    if (cachedToken && cachedToken.expiresAt > new Date()) {
      // キャッシュからトークンを使用
      return cachedToken.accessToken;
    }
  }
  
  try {
    // ボールト（ローカルストレージ）からトークンを取得
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('integration_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', 'content_snare')
      .single();
    
    if (error || !data || !data.access_token) {
      return null;
    }
    
    // トークンの有効期限を計算（デフォルト8時間）
    const tokenData = data;
    const expiresAt = new Date();
    
    // 作成時間からトークンの有効期限を計算
    const createdAt = new Date(tokenData.created_at || tokenData.updated_at);
    const expiresIn = tokenData.expires_in || 28800; // 8時間（秒）
    expiresAt.setTime(createdAt.getTime() + (expiresIn * 1000));
    
    // 期限切れの場合はnullを返す
    if (expiresAt <= new Date()) {
      return null;
    }
    
    // キャッシュに保存
    tokenCache[userId] = {
      accessToken: tokenData.access_token,
      expiresAt
    };
    
    return tokenData.access_token;
  } catch (error) {
    return null;
  }
}

// Content Snare APIへのリクエストを実行
export async function makeContentSnareRequest(
  userId: string,
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  payload?: Record<string, any>
): Promise<any> {
  try {
    // 認証トークンを取得
    const token = await getToken(userId);
    if (!token) {
      return { error: 'トークンが取得できませんでした' };
    }
    
    // APIエンドポイントURL
    const apiUrl = `https://api.contentsnare.com/v1/${endpoint}`;
    
    // リクエスト設定
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    // リクエストボディがある場合は追加
    if (payload && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(payload);
    }
    
    // リクエスト実行
    const response = await fetch(apiUrl, options);
    
    // レスポンスを解析
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // JSONでない場合はテキストとして取得
      const text = await response.text();
      data = { text };
    }
    
    // エラーレスポンスの場合
    if (!response.ok) {
      return {
        error: true,
        status: response.status,
        data
      };
    }
    
    return data;
  } catch (error) {
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 