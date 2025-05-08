import { NextRequest, NextResponse } from 'next/server';
import { getListWithCache, getWithCache } from '@/lib/microcms';
import type { BlogPost, InterviewArticle } from '@/lib/microcms';

// デフォルトのキャッシュ時間（秒）
const DEFAULT_CACHE_MAX_AGE = 3600; // 1時間

export async function GET(request: NextRequest) {
  try {
    // URLからクエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const category = searchParams.get('category') || undefined;
    const slug = searchParams.get('slug') || undefined;
    const id = searchParams.get('id') || undefined;
    const ttl = parseInt(searchParams.get('ttl') || DEFAULT_CACHE_MAX_AGE.toString(), 10);
    const forceRevalidate = searchParams.get('revalidate') === 'true';

    const microcmsParams = {
      type,
      category,
      limit,
      offset,
      ttl,
      forceRevalidate,
      timestamp: new Date().toISOString()
    };

    // リクエスト情報
    // console.log('MicroCMS API リクエスト:', {
    //   endpoint,
    //   type,
    //   queries: microcmsParams
    // });

    // リクエストに応じて適切なデータを取得
    let data: any = {};

    switch (type) {
      case 'blog':
        if (slug) {
          // 特定のブログ記事を取得
          data = await getWithCache<BlogPost>(`blog/${slug}`, undefined, forceRevalidate, ttl);
        } else {
          // ブログ記事一覧を取得
          const queries = {
            limit,
            offset,
            orders: '-publishedAt',
            fields: 'id,title,eyecatch,slug,publishedAt,categories,excerpt'
          };
          
          if (category) {
            // @ts-ignore
            queries.filters = `categories[contains]${category}`;
          }
          
          data = await getListWithCache<BlogPost>('blog', queries, forceRevalidate, ttl);
        }
        break;

      case 'interview':
        // インタビュー記事を取得
        data = await getListWithCache<InterviewArticle>('blog', {
          limit,
          offset,
          orders: '-publishedAt',
          filters: 'category[contains]interview',
          fields: 'id,title,excerpt,eyecatch,thumbnail,profession,country,slug,publishedAt'
        }, forceRevalidate, ttl);
        break;

      case 'course':
        if (id) {
          // 特定のコース情報を取得
          data = await getWithCache(`courses/${id}`, {
            fields: 'id,title,description,thumbnail,details,requirements,price'
          }, forceRevalidate, ttl);
        } else {
          // コース一覧を取得
          data = await getListWithCache('courses', {
            limit,
            offset,
            fields: 'id,title,description,thumbnail,price'
          }, forceRevalidate, ttl);
        }
        break;

      case 'all':
      default:
        // 複数のデータを並行して取得
        const [blogData, interviewData, featuredCourses] = await Promise.all([
          getListWithCache<BlogPost>('blog', {
            limit: 5,
            orders: '-publishedAt',
            fields: 'id,title,eyecatch,slug,publishedAt,categories,excerpt'
          }, forceRevalidate, ttl),
          getListWithCache<InterviewArticle>('blog', {
            limit: 3,
            orders: '-publishedAt',
            filters: 'category[contains]interview',
            fields: 'id,title,excerpt,eyecatch,thumbnail,profession,country,slug,publishedAt'
          }, forceRevalidate, ttl),
          getListWithCache('courses', {
            limit: 3,
            fields: 'id,title,description,thumbnail,price'
          }, forceRevalidate, ttl)
        ]);
        
        data = {
          blog: blogData,
          interviews: interviewData,
          courses: featuredCourses
        };
        break;
    }

    // キャッシュヘッダーを設定してレスポンスを返す
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl * 2}, stale-while-revalidate=${ttl * 4}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // エラーレスポンス
    // console.error('MicroCMS API集約エラー:', error);
    return NextResponse.json(
      { 
        error: 'MicroCMS APIでエラーが発生しました',
        message: error instanceof Error ? error.message : '予期せぬエラー',
      }, 
      { status: 500 }
    );
  }
} 