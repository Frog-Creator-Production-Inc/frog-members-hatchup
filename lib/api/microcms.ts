import { createClient } from 'microcms-js-sdk';
import { cache } from 'react';

// MicroCMS クライアントの作成
const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN || '',
  apiKey: process.env.NEXT_PUBLIC_MICROCMS_API_KEY || '',
});

// インタビュー記事の取得パラメータ
interface InterviewsParams {
  limit?: number;
  offset?: number;
  filters?: string;
  orders?: string;
  fields?: string[];
  depth?: 1 | 2 | 3; // MicroCMSのdepthは1, 2, 3のみ許可
  ids?: string[];
}

// インメモリキャッシュ
const CACHE_TTL = 60 * 5 * 1000; // 5分間
interface CacheItem {
  data: any;
  expiry: number;
}
const apiCache = new Map<string, CacheItem>();

// キャッシュキーの生成
const generateCacheKey = (endpoint: string, params: any) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

// キャッシュからデータを取得または新しく取得する関数
const fetchWithCache = async (endpoint: string, params: any) => {
  const cacheKey = generateCacheKey(endpoint, params);
  const now = Date.now();
  
  // キャッシュにデータがあり、有効期限内であれば使用
  if (apiCache.has(cacheKey)) {
    const cachedItem = apiCache.get(cacheKey)!;
    if (cachedItem.expiry > now) {
      return cachedItem.data;
    }
    apiCache.delete(cacheKey);
  }
  
  // 新しいデータを取得
  const response = await client.get({
    endpoint,
    queries: params,
  });
  
  // キャッシュに保存
  apiCache.set(cacheKey, {
    data: response,
    expiry: now + CACHE_TTL,
  });
  
  return response;
};

// インタビュー記事を取得する関数
export const fetchMicroCMSInterviews = cache(async (params: InterviewsParams = {}) => {
  try {
    const optimizedParams = {
      limit: params.limit || 10,
      offset: params.offset || 0,
      filters: params.filters,
      orders: params.orders || '-publishedAt', // 公開日の降順
      fields: params.fields || ['id', 'title', 'eyecatch', 'slug', 'publishedAt', 'categories'].join(','),
      depth: params.depth,
      ids: params.ids,
    };
    
    return await fetchWithCache('interviews', optimizedParams);
  } catch (error) {
    throw error;
  }
});

// 特定のインタビュー記事を取得する関数
export const fetchMicroCMSInterviewById = cache(async (id: string) => {
  try {
    const cacheKey = `interviews:${id}`;
    const now = Date.now();
    
    if (apiCache.has(cacheKey)) {
      const cachedItem = apiCache.get(cacheKey)!;
      if (cachedItem.expiry > now) {
        return cachedItem.data;
      }
      apiCache.delete(cacheKey);
    }
    
    const response = await client.get({
      endpoint: 'interviews',
      contentId: id,
    });
    
    apiCache.set(cacheKey, {
      data: response,
      expiry: now + CACHE_TTL,
    });
    
    return response;
  } catch (error) {
    throw error;
  }
});

// カテゴリー別のインタビュー記事を取得する関数
export const fetchMicroCMSInterviewsByCategory = cache(async (category: string, params: InterviewsParams = {}) => {
  try {
    const optimizedParams = {
      limit: params.limit || 10,
      offset: params.offset || 0,
      filters: `category[contains]${category}`,
      orders: params.orders || '-publishedAt',
      fields: params.fields || ['id', 'title', 'eyecatch', 'slug', 'publishedAt', 'categories'].join(','),
      depth: params.depth,
    };
    
    return await fetchWithCache('interviews', optimizedParams);
  } catch (error) {
    throw error;
  }
}); 