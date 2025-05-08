/**
 * Content Snare API用サーバーサイドユーティリティ関数
 * サーバーコンポーネントおよびAPIルートでのみ使用可能
 */
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Supabaseクライアント作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// キャッシュの型定義
type TokenServerCache = {
  accessToken: string;
  expiresAt: Date;
};

// サーバーサイドのトークンキャッシュ
let tokenCache: TokenServerCache | null = null;

/**
 * Content Snare APIのアクセストークンを取得
 * キャッシュがあればそれを使用し、なければリフレッシュトークンで取得
 */
export async function getServerAccessToken(forceRefresh = false): Promise<string | null> {
  // 強制リフレッシュが要求された場合はキャッシュをスキップ
  if (!forceRefresh) {
    // キャッシュを確認
    if (tokenCache && new Date() < tokenCache.expiresAt) {
      return tokenCache.accessToken;
    }

    // 一時的なアクセストークンをチェック（長さのバリデーション追加）
    const tempAccessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    if (tempAccessToken && tempAccessToken.length > 30) {
      return tempAccessToken;
    }
  }

  try {
    // システム共通のContent Snareトークンを取得（最新のもの）
    const query = supabaseAdmin
      .from('refresh_tokens')
      .select('*')
      .eq('service_name', 'content_snare')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    // 結果を取得
    const { data: tokens, error } = await query;
    
    if (error || !tokens || tokens.length === 0) {
      throw new Error(`トークン取得エラー: ${error?.message || 'データがありません'}`);
    }
    
    const tokenData = tokens[0];
    
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
      const errorText = await refreshResponse.text();
      
      // 強制リフレッシュモードでない場合のみ、メモリ内のトークンを再チェック
      if (!forceRefresh) {
        // メモリ内の一時的なアクセストークンを再チェック（長さのバリデーション追加）
        const recheckedTempToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
        if (recheckedTempToken && recheckedTempToken.length > 30) {
          return recheckedTempToken;
        }
      }
      
      throw new Error(`トークンのリフレッシュに失敗: ${errorText}`);
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 3600; // デフォルト1時間
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    // 新しいリフレッシュトークンが提供された場合のみ更新
    if (refreshData.refresh_token) {
      await supabaseAdmin
        .from('refresh_tokens')
        .update({
          refresh_token: refreshData.refresh_token,
          service_name: 'content_snare',
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);
    }
    
    // キャッシュを更新
    tokenCache = {
      accessToken: newAccessToken,
      expiresAt: expiresAt
    };
    
    // 一時的なアクセストークンをメモリに保存
    process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = newAccessToken;
    
    return newAccessToken;
  } catch (error) {
    return null;
  }
}

/**
 * Content Snare APIへのリクエスト実行
 * @param endpoint APIエンドポイント
 * @param options リクエストオプション
 */
export async function contentSnareServerRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      // アクセストークンを取得（リトライ時は強制リフレッシュ）
      const accessToken = await getServerAccessToken(retryCount > 0);
      
      // リクエストオプションにトークンを追加
      const requestOptions: RequestInit = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': options.body ? 'application/json' : 'application/x-www-form-urlencoded',
          'X-Api-Key': process.env.CONTENT_SNARE_API_KEY || "",
          'X-Account-Id': process.env.CONTENT_SNARE_CLIENT_ID || ""
        }
      };
      
      // エンドポイントのURLを構築
      const apiUrl = `https://api.contentsnare.com/partner_api/v1/${endpoint}`;
      
      // リクエスト実行
      const response = await fetch(apiUrl, requestOptions);
      
      // 認証エラーの場合、トークンをキャッシュから削除して再試行
      if (response.status === 401 && retryCount < maxRetries) {
        retryCount++;
        continue;
      }
      
      return response;
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        continue;
      }
      throw error;
    }
  }
  
  throw new Error("最大リトライ回数を超えました");
}

export async function getContentSnareToken(supabase: SupabaseClient) {
  try {
    // メモリ内の一時的なアクセストークンがあれば使用
    const tempAccessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    if (tempAccessToken) {
      return tempAccessToken;
    }

    // システム共通のContent Snareトークンを取得
    const { data: tokens, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('service_name', 'content_snare')
      .order('created_at', { ascending: false })
      .limit(1);

    if (tokenError || !tokens || tokens.length === 0) {
      return null;
    }

    const tokenData = tokens[0];

    // リフレッシュトークンを使用して新しいアクセストークンを取得
    return await refreshToken(tokenData.refresh_token);
  } catch (error) {
    return null;
  }
}

// トークンをリフレッシュする関数
async function refreshToken(refreshToken: string): Promise<string | null> {
  try {
    // リフレッシュトークンを使用して新しいアクセストークンを取得
    const refreshResponse = await fetch('https://api.contentsnare.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.CONTENT_SNARE_CLIENT_ID,
        client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
        refresh_token: refreshToken
      })
    });
    
    // エラーチェック
    if (!refreshResponse.ok) {
      return null;
    }
    
    // レスポンスからトークン情報を取得
    const tokenResponse = await refreshResponse.json();
    
    // メモリ内キャッシュを更新
    const expiresIn = tokenResponse.expires_in || 3600; // デフォルトは1時間
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn - 300); // 5分前に期限切れにする
    
    tokenCache = {
      accessToken: tokenResponse.access_token,
      expiresAt: expiresAt
    };
    
    // 一時トークンも更新
    process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = tokenResponse.access_token;
    
    return tokenResponse.access_token;
  } catch (error) {
    return null;
  }
} 