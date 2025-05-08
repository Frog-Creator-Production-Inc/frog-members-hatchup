import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from "@/types/supabase"

// クライアントのインスタンスをキャッシュするためのシングルトンパターン
// 用途別に異なるクライアントインスタンスを保持
const clientCache: {
  default?: ReturnType<typeof createClientComponentClient<Database>>;
  realtime?: ReturnType<typeof createClientComponentClient<Database>>;
  noCache?: ReturnType<typeof createClientComponentClient<Database>>;
} = {};

// キャッシュを無効化するためのデフォルト設定
const noCacheOptions = {
  global: {
    headers: {
      'X-Supabase-Cache-Control': 'no-cache',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    },
    fetch: (url: RequestInfo | URL, init?: RequestInit) => {
      // カスタムフェッチ関数でキャッシュを無効化
      const customInit = {
        ...init,
        cache: 'no-store' as RequestCache,
        headers: {
          ...init?.headers,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      };
      return fetch(url, customInit);
    }
  }
};

// 環境変数がセットされているかチェック
function validateEnvVars() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missingVars = requiredVars.filter(varName => {
    const value = process.env[varName]
    return !value || value.trim() === ''
  })
  
  if (missingVars.length > 0) {
    // console.error(`環境変数が設定されていません: ${missingVars.join(', ')}`)
    // 本番環境ではエラーを投げる、開発環境では警告だけ
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`必須環境変数が設定されていません: ${missingVars.join(', ')}`)
    }
  }
}

/**
 * 通常のSupabaseクライアントを作成
 * 一般的なデータ取得に使用
 */
export const createClient = () => {
  // 環境変数からAPIキーを取得
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // 毎回新しいクライアントを作成してキャッシュの問題を回避
  clientCache.default = createClientComponentClient<Database>({
    options: {
      ...noCacheOptions,
      global: {
        ...noCacheOptions.global,
        headers: {
          ...noCacheOptions.global.headers,
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
      },
      realtime: {
        timeout: 60000, // タイムアウトを60秒に設定
        heartbeatIntervalMs: 15000, // ハートビート間隔を15秒に設定
      }
    },
  });

  return clientCache.default;
};

/**
 * リアルタイム更新用のSupabaseクライアントを作成
 * チャットなどのリアルタイム機能に使用
 */
export const createRealtimeClient = () => {
  // 環境変数からAPIキーを取得
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // 毎回新しいクライアントを作成してキャッシュの問題を回避
  clientCache.realtime = createClientComponentClient<Database>({
    options: {
      ...noCacheOptions,
      global: {
        ...noCacheOptions.global,
        headers: {
          ...noCacheOptions.global.headers,
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
      },
      realtime: {
        timeout: 60000, // タイムアウトを60秒に設定
        heartbeatIntervalMs: 5000, // ハートビート間隔を5秒に短縮
      },
      db: {
        schema: 'public'
      }
    },
  });

  return clientCache.realtime;
};

/**
 * キャッシュを無効化したSupabaseクライアントを作成
 * 最新データの取得が必要な場合に使用
 */
export const createNoCacheClient = () => {
  // 環境変数からAPIキーを取得
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // 毎回新しいクライアントを作成
  clientCache.noCache = createClientComponentClient<Database>({
    options: {
      ...noCacheOptions,
      global: {
        ...noCacheOptions.global,
        headers: {
          ...noCacheOptions.global.headers,
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
      }
    }
  });

  return clientCache.noCache;
};

/**
 * サーバーコンポーネント用のSupabaseクライアントを作成
 * サーバーサイドでの直接API通信に使用
 */
export function createServerClient() {
  try {
    validateEnvVars()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase環境変数が設定されていません')
    }
    
    return createSupabaseClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  } catch (error) {
    // console.error('Supabaseクライアント作成エラー:', error)
    
    // エラーが発生した場合でも、最低限動作するダミークライアントを返す（開発環境のみ）
    if (process.env.NODE_ENV !== 'production') {
      // console.warn('ダミーのSupabaseクライアントを使用します - 実際のデータは取得できません')
      return {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } })
            }),
            in: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } }),
            order: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } }),
            limit: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } })
          }),
          insert: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } }),
          update: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } }),
          upsert: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } }),
          delete: () => ({ data: null, error: { code: 'DUMMY_CLIENT' } })
        }),
        auth: {
          getUser: () => ({ data: { user: null }, error: { code: 'DUMMY_CLIENT' } })
        }
      } as any
    }
    
    // 本番環境ではエラーを投げる
    throw error
  }
}

