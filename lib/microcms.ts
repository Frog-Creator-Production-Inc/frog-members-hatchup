import { createClient } from "microcms-js-sdk"
import { cache } from 'react'
import type { MicroCMSQueries, MicroCMSImage } from 'microcms-js-sdk'

// 環境変数から値を取得
const MICROCMS_SERVICE_DOMAIN = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN
const MICROCMS_API_KEY = process.env.NEXT_PUBLIC_MICROCMS_API_KEY

// キャッシュ設定
// デフォルトのTTLを1時間（秒単位）に設定
const DEFAULT_CACHE_TTL = 60 * 60; // 1時間（秒単位）
const memoryCache: Record<string, { data: any; timestamp: number }> = {};

if (!MICROCMS_SERVICE_DOMAIN) {
  throw new Error("Missing MicroCMS service domain")
}

if (!MICROCMS_API_KEY) {
  throw new Error("Missing MicroCMS API key")
}

// MicroCMSクライアントの作成
export const client = createClient({
  serviceDomain: MICROCMS_SERVICE_DOMAIN,
  apiKey: MICROCMS_API_KEY,
})

/**
 * キャッシュ付きのget関数
 * @param endpoint エンドポイント名
 * @param queries クエリパラメータ
 * @param forceRefresh キャッシュを無視して強制的に再取得するかどうか
 * @param ttl キャッシュの有効期間（秒単位）
 */
export async function getWithCache<T>(
  endpoint: string,
  queries?: MicroCMSQueries,
  forceRefresh = false,
  ttl = DEFAULT_CACHE_TTL
): Promise<T> {
  const cacheKey = `${endpoint}:${JSON.stringify(queries || {})}`;
  const ttlMs = ttl * 1000; // 秒からミリ秒へ変換
  
  // キャッシュが有効な場合はキャッシュから返す
  if (
    !forceRefresh &&
    memoryCache[cacheKey] &&
    Date.now() - memoryCache[cacheKey].timestamp < ttlMs
  ) {
    return memoryCache[cacheKey].data as T;
  }

  // APIからデータを取得
  try {
    const data = await client.get<T>({ endpoint, queries });
    
    // キャッシュに保存
    memoryCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };
    
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * キャッシュ付きのgetList関数
 * @param endpoint エンドポイント名
 * @param queries クエリパラメータ
 * @param forceRefresh キャッシュを無視して強制的に再取得するかどうか
 * @param ttl キャッシュの有効期間（秒単位）
 */
export async function getListWithCache<T>(
  endpoint: string,
  queries?: MicroCMSQueries,
  forceRefresh = false,
  ttl = DEFAULT_CACHE_TTL
): Promise<{ contents: T[]; totalCount: number }> {
  const cacheKey = `list:${endpoint}:${JSON.stringify(queries || {})}`;
  const ttlMs = ttl * 1000; // 秒からミリ秒へ変換
  
  if (
    !forceRefresh &&
    memoryCache[cacheKey] &&
    Date.now() - memoryCache[cacheKey].timestamp < ttlMs
  ) {
    return memoryCache[cacheKey].data;
  }
  
  try {
    const data = await client.getList<T>({ endpoint, queries });
    
    memoryCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };
    
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * 画像URLを最適化する関数
 * @param imageUrl MicroCMSの画像URL
 * @param width 希望する幅
 * @param format 画像フォーマット（webpなど）
 * @param quality 画像品質（0-100）
 */
export function getOptimizedImageUrl(
  imageUrl: string | undefined,
  width: number = 800,
  format: string = 'webp',
  quality: number = 80
): string {
  if (!imageUrl) return '';
  
  // すでにパラメータがある場合は&で、ない場合は?で連結
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}w=${width}&fm=${format}&q=${quality}`;
}

// 型定義
export interface BlogPost {
  id: string
  title: string
  contents?: string
  eyecatch?: MicroCMSImage
  college_name?: string
  course_name?: string
  slug: string
  publishedAt: string,
  categories?: {
    id: string
    name: string
    slug: string
  }[]
}

export interface InterviewArticle {
  id: string
  title: string
  content: string
  excerpt?: string
  eyecatch?: MicroCMSImage
  thumbnail?: MicroCMSImage
  profession?: string
  country?: string
  visaType?: string
  duration?: string
  category?: string
  successPoints?: string[] | string
  slug: string
  publishedAt: string
}

/**
 * 関連するブログ記事を取得する関数
 */
export async function getRelatedBlogPosts(schoolName: string): Promise<BlogPost[]> {
  return getRelatedBlogPostsCached(schoolName);
}

/**
 * 最新のインタビュー記事を取得する関数
 */
export const getLatestInterviews = cache(async (limit = 3) => {
  try {
    const response = await getInterviewsCached(undefined, limit);
    return response.contents;
  } catch (error) {
    return [];
  }
});

/**
 * コース情報を取得する関数
 */
export const getMicroCMSCourse = cache(async (id: string) => {
  try {
    return await getCourseCached(id);
  } catch (error) {
    throw error;
  }
});

/**
 * ブログ記事を取得する関数
 */
export const getBlogPost = cache(async (slug: string) => {
  try {
    return await getBlogPostCached(slug);
  } catch (error) {
    throw error;
  }
});

/**
 * ブログ記事一覧を取得する関数
 */
export const getBlogPosts = cache(async (limit = 10, offset = 0, category?: string) => {
  const queries: MicroCMSQueries = {
    limit,
    offset,
    orders: '-publishedAt',
    fields: 'id,title,eyecatch,slug,publishedAt,categories'
  };
  
  if (category) {
    queries.filters = `categories[contains]${category}`;
  }
  
  try {
    return await getListWithCache<BlogPost>("blog", queries);
  } catch (error) {
    return { contents: [], totalCount: 0 };
  }
});

/**
 * 再利用可能なインタビュー記事キャッシュ取得関数
 * @param category カテゴリー（オプション）
 * @param limit 取得数（デフォルト: 10）
 * @param ttl キャッシュの有効期間（秒単位、デフォルト: 10分）
 */
export async function getInterviewsCached(
  category?: string, 
  limit = 10,
  ttl = 60 * 10
): Promise<{ contents: InterviewArticle[]; totalCount: number }> {
  const queries: MicroCMSQueries = {
    limit,
    orders: '-publishedAt',
    fields: 'id,title,excerpt,eyecatch,thumbnail,profession,country,slug,publishedAt'
  };
  
  if (category) {
    queries.filters = `category[contains]${category}`;
  }
  
  const cacheKey = category ? `interviews:${category}:${limit}` : `interviews:all:${limit}`;
  return await getListWithCache<InterviewArticle>('blog', queries, false, ttl);
}

/**
 * 再利用可能なブログ記事キャッシュ取得関数
 * @param slug 記事のスラッグ
 * @param ttl キャッシュの有効期間（秒単位、デフォルト: 10分）
 */
export async function getBlogPostCached(
  slug: string,
  ttl = 60 * 10
): Promise<BlogPost> {
  return await getWithCache<BlogPost>(`blog/${slug}`, undefined, false, ttl);
}

/**
 * 再利用可能なコース情報キャッシュ取得関数
 * @param id コースID
 * @param ttl キャッシュの有効期間（秒単位、デフォルト: 30分）
 */
export async function getCourseCached(
  id: string,
  ttl = 60 * 30
) {
  return await getWithCache(`courses/${id}`, {
    fields: 'id,title,description,thumbnail,details,requirements,price'
  }, false, ttl);
}

/**
 * 関連するブログ記事を取得する関数（キャッシュ付き）
 * @param schoolName 学校名
 * @param ttl キャッシュの有効期間（秒単位、デフォルト: 30分）
 */
export async function getRelatedBlogPostsCached(
  schoolName: string,
  ttl = 60 * 30
): Promise<BlogPost[]> {
  try {
    const response = await getListWithCache<BlogPost>("blog", {
      filters: `college_name[contains]${schoolName}`,
      limit: 3,
      fields: 'id,title,eyecatch,slug,publishedAt,categories'
    }, false, ttl);

    return response.contents;
  } catch (error) {
    return [];
  }
}

// APIルート用の関数
export async function handleMicroCMSRequest(
  request: Request,
  endpoint: string,
  params: Record<string, string>
) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const contentType = searchParams.get('contentType')
  const contentId = searchParams.get('contentId')

  if (!contentType) {
    throw new Error('contentType is required')
  }

  const queryParams: MicroCMSQueries = {
    ...Object.fromEntries(searchParams),
  }

  switch (endpoint) {
    case 'list':
      return getListWithCache(contentType, queryParams)
    case 'detail':
      if (!contentId) {
        throw new Error('contentId is required for detail endpoint')
      }
      return getWithCache(contentType, contentId, queryParams)
    case 'related':
      if (!contentId) {
        throw new Error('contentId is required for related endpoint')
      }
      return getListWithCache(contentType, {
        ...queryParams,
        filters: `related[equals]${contentId}`,
      } as MicroCMSQueries)
    default:
      throw new Error('Invalid endpoint')
  }
}
