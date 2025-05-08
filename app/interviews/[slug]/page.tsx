import { Metadata } from "next"
import { notFound } from "next/navigation"
import { client, BlogPost } from "@/lib/microcms"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { User, Calendar, ArrowLeft, Tag, Building, MapPin, ArrowRight, BookOpen } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// 動的メタデータの生成
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { slug } = params

  try {
    // 記事の詳細を取得（slugフィルターを使用）
    const response = await client.get({
      endpoint: "blog",
      queries: {
        filters: `slug[equals]${slug}`,
        fields: "id,title,slug,excerpt,eyecatch",
      },
    }).catch(error => {
      console.error(`Error fetching blog post for metadata with slug "${slug}":`, error);
      return { contents: [] };
    });

    // 記事が見つからない場合
    if (!response.contents || response.contents.length === 0) {
      console.error(`Blog post with slug "${slug}" not found for metadata`);
      return {
        title: "記事が見つかりません | FROG",
        description: "お探しの記事は見つかりませんでした。",
      };
    }

    const post = response.contents[0];

    return {
      title: `${post.title} | 先輩たちのストーリー | FROG`,
      description: post.excerpt || `${post.title}のインタビュー記事`,
      openGraph: post.eyecatch
        ? {
            images: [
              {
                url: post.eyecatch.url,
                width: post.eyecatch.width,
                height: post.eyecatch.height,
                alt: post.title,
              },
            ],
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "記事が見つかりません | FROG",
      description: "お探しの記事は見つかりませんでした。",
    }
  }
}

// 静的パスの生成
export async function generateStaticParams() {
  try {
    // すべての記事を取得
    const response = await client.get({
      endpoint: "blog",
      queries: {
        limit: 100,
        fields: "slug,categories",
      },
    }).catch(error => {
      console.error("Error fetching blog posts for static paths:", error);
      return { contents: [] };
    });

    // インタビュー記事のみをフィルタリング
    const interviewArticles = (response.contents || []).filter((article: BlogPost) => 
      article.categories?.some((category) => 
        category.slug === "interview" || 
        (category.name && category.name.toLowerCase().includes("interview")) || 
        (category.name && category.name.toLowerCase().includes("インタビュー"))
      )
    );

    console.log(`Found ${interviewArticles.length} interview articles for static paths`);
    return interviewArticles.map((post: { slug: string }) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function InterviewDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params

  try {
    // 記事の詳細を取得（slugフィルターを使用）
    const response = await client.get({
      endpoint: "blog",
      queries: {
        filters: `slug[equals]${slug}`,
        depth: 2, // カテゴリやタグの詳細情報を取得
        fields: "id,title,contents,eyecatch,college_name,country,publishedAt,categories,tags",
      },
    }).catch(error => {
      console.error(`Error fetching interview content for slug "${slug}":`, error);
      return { contents: [] };
    });

    // 記事が見つからない場合は404ページを表示
    if (!response.contents || response.contents.length === 0) {
      console.error(`Interview with slug "${slug}" not found`);
      notFound();
    }

    const post = response.contents[0];

    console.log("記事データ:", {
      id: post.id,
      title: post.title,
      contentsExists: !!post.contents,
      contentsLength: post.contents ? post.contents.length : 0,
      fields: Object.keys(post),
    });

    // 関連記事用にすべての記事を取得
    const allPostsResponse = await client.get({
      endpoint: "blog",
      queries: {
        limit: 100,
        fields: "id,title,slug,eyecatch,college_name,publishedAt,categories",
        depth: 2,
      },
    }).catch(error => {
      console.error("Error fetching all interviews for related posts:", error);
      return { contents: [] };
    });

    // インタビュー記事のみをフィルタリング
    const interviewArticles = (allPostsResponse.contents || []).filter((article: BlogPost) => 
      article.categories?.some((category) => 
        category.slug === "interview" || 
        (category.name && category.name.toLowerCase().includes("interview")) || 
        (category.name && category.name.toLowerCase().includes("インタビュー"))
      )
    );

    console.log(`Found ${interviewArticles.length} interview articles for related posts`);

    // 関連記事を取得（同じカテゴリの記事を3件、現在の記事を除く）
    const relatedPosts = interviewArticles
      .filter((article: any) => article.id !== post.id)
      .filter((article: any) => {
        // college_nameが一致する記事を優先
        if (post.college_name && article.college_name) {
          return article.college_name.includes(post.college_name) || 
                 post.college_name.includes(article.college_name);
        }
        return true;
      })
      .slice(0, 3);

    return (
      <div className="space-y-6">
        {/* 戻るリンク */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <Link
            href="/interviews"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            インタビュー一覧に戻る
          </Link>

          {/* 記事ヘッダー */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            
            <div className="flex flex-wrap gap-4 mb-4">
              {post.college_name && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>{post.college_name}</span>
                </div>
              )}
              
              {post.country && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{post.country}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-500" />
                <time dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
              </div>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.map((tag: { id: string; name: string }) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* アイキャッチ画像 */}
        {post.eyecatch && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                <Image
                  src={post.eyecatch.url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        )}

        {/* 記事本文 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          {post.contents ? (
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.contents }}
            />
          ) : (
            <div className="prose prose-lg max-w-none">
              <p>この記事にはまだ内容がありません。</p>
            </div>
          )}
        </div>

        {/* 関連記事 */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-gray-500" />
              <h2 className="text-xl font-bold">関連インタビュー</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost: any) => (
                <Link
                  key={relatedPost.id}
                  href={`/interviews/${relatedPost.slug}`}
                  className="block group"
                >
                  <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                    <div className="relative aspect-video w-full overflow-hidden">
                      {relatedPost.eyecatch?.url ? (
                        <Image
                          src={relatedPost.eyecatch.url}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.college_name && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="line-clamp-1">{relatedPost.college_name}</span>
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 pb-4 px-4">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto font-normal">
                        詳細を読む <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error in InterviewDetailPage:", error)
    notFound()
  }
} 