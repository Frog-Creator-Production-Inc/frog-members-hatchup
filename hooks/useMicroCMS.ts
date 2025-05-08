'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseMicroCMSOptions {
  type: 'blog' | 'interview' | 'course' | 'all'
  limit?: number
  offset?: number
  category?: string
  slug?: string
  id?: string
  revalidate?: boolean
  ttl?: number // キャッシュTTL（秒）
}

export function useMicroCMS<T>(options: UseMicroCMSOptions) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async (forceRevalidate = false) => {
    setIsLoading(true)
    setError(null)

    try {
      // クエリパラメータを構築
      const params = new URLSearchParams()
      params.append('type', options.type)
      
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())
      if (options.category) params.append('category', options.category)
      if (options.slug) params.append('slug', options.slug)
      if (options.id) params.append('id', options.id)
      if (options.ttl) params.append('ttl', options.ttl.toString())
      if (forceRevalidate) params.append('revalidate', 'true')

      // APIリクエストを送信
      
      // 強制再検証の場合はキャッシュを無視、それ以外は指定されたTTLまたはデフォルト（1時間）
      const revalidateValue = forceRevalidate ? 0 : (options.ttl || 3600);
      
      const response = await fetch(`/api/microcms?${params.toString()}`, {
        next: {
          revalidate: revalidateValue
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const result = await response.json()
      setData(result as T)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [options])

  // 初回マウント時にデータを取得
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // データを再取得する関数
  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch,
    router
  }
}

// MicroCMS APIを呼び出す
export const useMicroCMSApi = <T>(
  options: {
    type: string;
    contentId?: string;
    queries?: Record<string, any>;
    customFetch?: typeof fetch;
  },
  deps: any[] = []
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // MicroCMS APIクライアントの生成とデータ取得は別のファイルで実装
        // ここではモックデータで対応
        const mockResponse = { id: 'mock', type: options.type };
        
        if (isMounted) {
          setData(mockResponse as T);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, deps);

  return { data, loading, error };
}; 