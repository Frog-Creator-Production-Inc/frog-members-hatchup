import { createClient } from 'microcms-js-sdk';

// MicroCMSクライアントの初期化
const serviceDomain = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.NEXT_PUBLIC_MICROCMS_API_KEY;

if (!serviceDomain || !apiKey) {
  throw new Error('Missing MicroCMS environment variables');
}

const client = createClient({
  serviceDomain,
  apiKey,
});

// インタビュー記事の型定義
export interface Interview {
  id: string;
  title: string;
  contents: string;
  eyecatch?: {
    url: string;
    height: number;
    width: number;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];
  tags?: string[];
  slug: string;
  publishedAt: string;
  revisedAt: string;
  createdAt?: string;
}

// インタビュー記事の内容を解析して特定の情報を抽出する関数
export function extractInterviewInfo(content: string) {
  // HTMLタグを除去
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // カナダ就職に関する情報を抽出
  // カナダの都市名と就職関連のキーワードが近接して出現する場合、カナダ就職と判定
  const isCanadaJob = /(カナダ|バンクーバー|トロント|カルガリー|モントリオール).*?(就職|仕事|ジョブ|エンジニア|働く|勤務|オフィス)/i.test(plainText) || 
                      /(就職|仕事|ジョブ|エンジニア|働く|勤務|オフィス).*?(カナダ|バンクーバー|トロント|カルガリー|モントリオール)/i.test(plainText);
  
  return {
    isCanadaJob,
    plainText: plainText.substring(0, 1000) // 最初の1000文字だけを返す
  };
}

// キーワードでインタビュー記事を検索する関数
export async function searchInterviews(query: string) {
  try {
    console.log(`MicroCMS: "${query}"でインタビュー記事を検索中...`);
    
    // 検索クエリを分解して複数のキーワードで検索
    const keywords = query.split(/\s+/).filter(k => k.length > 1);
    
    // 検索条件を構築
    // インタビューカテゴリのみに限定（カテゴリーIDを使用）
    let filters = `categories[contains]f5fcdb8ad7`;
    
    // 検索結果を取得
    const response = await client.get({
      endpoint: 'blog',
      queries: {
        q: query,
        filters,
        limit: 100, // より多くの結果を取得
        fields: 'id,title,contents,eyecatch,categories,tags,slug,publishedAt,revisedAt,createdAt',
      },
    });

    console.log(`MicroCMS: ${response.contents?.length || 0}件のインタビュー記事が見つかりました`);
    
    // 検索結果がない場合は、キーワードを分割して再検索
    if (!response.contents || response.contents.length === 0) {
      console.log(`MicroCMS: 検索結果がないため、キーワード分割検索を試みます`);
      
      if (keywords.length > 1) {
        // 各キーワードで個別に検索
        const keywordPromises = keywords.map(keyword => 
          client.get({
            endpoint: 'blog',
            queries: {
              q: keyword,
              filters,
              limit: 50,
              fields: 'id,title,contents,eyecatch,categories,tags,slug,publishedAt,revisedAt,createdAt',
            },
          })
        );
        
        const keywordResults = await Promise.all(keywordPromises);
        const allContents = keywordResults.flatMap(result => result.contents || []);
        
        // 重複を排除
        const uniqueContents = Array.from(
          new Map(allContents.map(item => [item.id, item])).values()
        );
        
        console.log(`MicroCMS: キーワード分割検索で${uniqueContents.length}件のインタビュー記事が見つかりました`);
        return uniqueContents as Interview[];
      }
    }
    
    return response.contents as Interview[];
  } catch (error) {
    console.error('MicroCMS search error:', error);
    return [];
  }
}

// 特定のキーワードに関連するインタビュー記事を検索する関数
export async function searchInterviewsByKeywords(keywords: string[]) {
  try {
    console.log(`MicroCMS: ${keywords.join(', ')}でインタビュー記事を検索中...`);
    
    // 検索条件を構築
    // インタビューカテゴリのみに限定（カテゴリーIDを使用）
    let filters = `categories[contains]f5fcdb8ad7`;
    
    // 複数のキーワードで検索結果を取得
    const promises = keywords.map(keyword => 
      client.get({
        endpoint: 'blog',
        queries: {
          q: keyword,
          filters,
          limit: 50, // 各キーワードごとに50件まで取得
          fields: 'id,title,contents,eyecatch,categories,tags,slug,publishedAt,revisedAt,createdAt',
        },
      })
    );
    
    const results = await Promise.all(promises);
    
    // 結果を統合して重複を排除
    const allContents = results.flatMap(result => result.contents || []);
    const uniqueContents = Array.from(
      new Map(allContents.map(item => [item.id, item])).values()
    );
    
    console.log(`MicroCMS: ${uniqueContents.length}件のインタビュー記事が見つかりました`);
    
    return uniqueContents as Interview[];
  } catch (error) {
    console.error('MicroCMS search error:', error);
    return [];
  }
}

// 最新のインタビュー記事を取得する関数
export async function getLatestInterviews(limit = 10) {
  try {
    const response = await client.get({
      endpoint: 'blog',
      queries: {
        filters: `categories[contains]f5fcdb8ad7`,
        limit,
        orders: '-publishedAt',
        fields: 'id,title,contents,eyecatch,categories,tags,slug,publishedAt,revisedAt,createdAt',
      },
    });

    return response.contents as Interview[];
  } catch (error) {
    console.error('MicroCMS error:', error);
    return [];
  }
}

// 特定のインタビュー記事を取得する関数
export async function getInterviewById(id: string) {
  try {
    const response = await client.get({
      endpoint: 'blog',
      contentId: id,
    });

    return response as Interview;
  } catch (error) {
    console.error('MicroCMS error:', error);
    return null;
  }
} 