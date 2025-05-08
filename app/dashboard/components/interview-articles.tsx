"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, ArrowRight, Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { client } from "@/lib/microcms"
import type { BlogPost } from "@/lib/microcms"

// BlogPost型を拡張してtagsフィールドを追加
interface ExtendedBlogPost extends BlogPost {
  tags?: {
    id: string
    name: string
  }[]
}

export default function InterviewArticles() {
  const [articles, setArticles] = useState<ExtendedBlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        console.log("インタビュー記事の取得を開始します...", {
          timestamp: new Date().toISOString(),
          clientExists: !!client,
          environment: typeof window !== 'undefined' ? 'client' : 'server'
        });
        
        // 方法1: カテゴリーのslugが"interview"の記事を直接フィルタリングして取得
        console.log("MicroCMS API呼び出し前:", {
          endpoint: "blog",
          filters: 'categories[contains]interview'
        });
        
        const response = await client.get({
          endpoint: "blog",
          queries: {
            limit: 100, // 十分な数の記事を取得
            orders: '-publishedAt',
            filters: 'categories[contains]interview',
            depth: 2, // カテゴリの詳細情報を取得するために深さを指定
            fields: 'id,title,eyecatch,college_name,slug,publishedAt,categories,tags'
          },
        });
        
        console.log("MicroCMS API レスポンス (方法1):", {
          取得件数: response.contents?.length || 0,
          総件数: response.totalCount,
          取得時刻: new Date().toISOString(),
          responseType: typeof response,
          hasContents: !!response.contents,
          contentsType: response.contents ? typeof response.contents : 'undefined'
        });
        
        if (response.contents && response.contents.length > 0) {
          // college_nameが存在する記事のみをフィルタリング
          const articlesWithCollegeName = response.contents.filter((article: BlogPost) => 
            article.college_name && article.college_name.trim() !== ""
          );
          
          console.log(`college_nameあり記事: ${articlesWithCollegeName.length}件/${response.contents.length}件`);
          
          // 最新3件に制限
          const latestInterviewArticles = articlesWithCollegeName.slice(0, 3);
          console.log(`インタビュー記事: ${articlesWithCollegeName.length}件中${latestInterviewArticles.length}件表示`);
          
          if (latestInterviewArticles.length > 0) {
            setArticles(latestInterviewArticles);
          } else {
            console.log("方法1でcollege_nameありの記事が見つかりませんでした。方法2を試します...");
            fallbackMethod();
          }
        } else {
          console.log("方法1でインタビュー記事が見つかりませんでした。方法2を試します...");
          fallbackMethod();
        }
      } catch (error) {
        console.error("ブログ記事の取得に失敗しました:", error);
        console.error("エラーの詳細:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          clientExists: !!client,
          clientType: typeof client,
          clientMethods: Object.keys(client || {}).join(', ')
        });
        setError(true);
        setLoading(false);
      }
    };
    
    // フォールバック方法を関数として定義
    const fallbackMethod = async () => {
      try {
        console.log("フォールバック方法を試行中...", {
          timestamp: new Date().toISOString()
        });
        
        // 方法2: すべての記事を取得してからフィルタリング
        const fallbackResponse = await client.get({
          endpoint: "blog",
          queries: {
            limit: 100, // 十分な数の記事を取得
            orders: '-publishedAt',
            depth: 2, // カテゴリの詳細情報を取得するために深さを指定
            fields: 'id,title,eyecatch,college_name,slug,publishedAt,categories,tags'
          },
        });
        
        console.log("MicroCMS API レスポンス (方法2):", {
          取得件数: fallbackResponse.contents?.length || 0,
          総件数: fallbackResponse.totalCount,
          取得時刻: new Date().toISOString(),
          responseType: typeof fallbackResponse,
          hasContents: !!fallbackResponse.contents,
          contentsType: fallbackResponse.contents ? typeof fallbackResponse.contents : 'undefined',
          firstItem: fallbackResponse.contents && fallbackResponse.contents.length > 0 ? 
            JSON.stringify(fallbackResponse.contents[0], null, 2).substring(0, 200) + '...' : 'なし'
        });
        
        if (fallbackResponse.contents && fallbackResponse.contents.length > 0) {
          // カテゴリのslugが"interview"の記事のみをフィルタリング
          const interviewArticles = fallbackResponse.contents.filter((article: BlogPost) => 
            article.categories?.some((category) => 
              category.slug === "interview" || 
              (category.name && category.name.toLowerCase().includes("interview")) || 
              (category.name && category.name.toLowerCase().includes("インタビュー"))
            )
          );
          
          // さらにcollege_nameが存在する記事のみをフィルタリング
          const interviewArticlesWithCollegeName = interviewArticles.filter((article: BlogPost) => 
            article.college_name && article.college_name.trim() !== ""
          );
          
          console.log(`方法2: college_nameあり記事: ${interviewArticlesWithCollegeName.length}件/${interviewArticles.length}件`);
          
          // 最新3件に制限
          const latestInterviewArticles = interviewArticlesWithCollegeName.slice(0, 3);
          console.log(`方法2: インタビュー記事 ${interviewArticlesWithCollegeName.length}件中${latestInterviewArticles.length}件表示`);
          
          if (latestInterviewArticles.length > 0) {
            setArticles(latestInterviewArticles);
          } else {
            // college_nameがない場合は、通常のインタビュー記事を表示
            console.log("college_nameありの記事が見つからなかったため、通常のインタビュー記事を表示します");
            const regularLatestInterviewArticles = interviewArticles.slice(0, 3);
            setArticles(regularLatestInterviewArticles);
          }
        } else {
          // 記事が見つからない場合は空配列を設定
          setArticles([]);
          console.log("どの方法でもインタビュー記事が見つかりませんでした");
        }
      } catch (fallbackError) {
        console.error("フォールバック方法でのブログ記事の取得に失敗しました:", fallbackError);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <Card className="shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            先輩たちのストーリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            記事の読み込み中にエラーが発生しました。しばらく経ってからもう一度お試しください。
          </p>
        </CardContent>
      </Card>
    )
  }

  if (articles.length === 0) {
    return (
      <Card className="shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            先輩たちのストーリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            インタビュー記事はまだ掲載されていません
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span>先輩たちのストーリー</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 bg-white">
        <div className="space-y-3">
          {articles.map((article) => (
            <Link 
              key={article.id} 
              href={`/interviews/${article.slug}`}
              className="block"
            >
              <div className="group flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors bg-white">
                <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                  {article.eyecatch?.url ? (
                    <Image
                      src={article.eyecatch.url}
                      alt={article.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  
                  {article.college_name && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {article.college_name}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mt-1">
                    {article.tags && article.tags.length > 0 ? (
                      article.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-[10px] px-1 py-0 h-auto">
                          {tag.name}
                        </Badge>
                      ))
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          <Link 
            href="/interviews" 
            className="flex items-center justify-center w-full text-xs text-primary hover:text-primary/80 transition-colors mt-2 pt-2 border-t"
          >
            <span>すべてのインタビューを見る</span>
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}