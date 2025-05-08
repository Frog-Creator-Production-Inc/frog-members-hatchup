import { Metadata } from "next"
import { client, BlogPost } from "@/lib/microcms"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { User, Calendar, Tag, ArrowRight, BookOpen } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// BlogPost型を拡張してtagsフィールドを追加
interface ExtendedBlogPost extends BlogPost {
  tags?: {
    id: string
    name: string
  }[]
}

export const metadata: Metadata = {
  title: "先輩たちのストーリー | FROG",
  description: "海外で活躍する先輩たちのインタビュー記事を紹介します。",
}

// 1ページあたりの記事数
const PER_PAGE = 12

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  // ページ番号を取得（デフォルトは1）
  const page = searchParams.page ? parseInt(searchParams.page) : 1
  const offset = (page - 1) * PER_PAGE

  try {
    // MicroCMSからインタビュー記事を取得
    const response = await client.get({
      endpoint: "blog",
      queries: {
        limit: 100, // 十分な数の記事を取得
        offset: 0,
        orders: "-publishedAt",
        depth: 2, // カテゴリの詳細情報を取得するために深さを指定
        fields: "id,title,eyecatch,college_name,slug,publishedAt,categories,tags",
      },
    }).catch(error => {
      console.error("Error fetching blog posts for interviews page:", error);
      throw error; // エラーを上位に伝播させる
    });

    if (!response || !response.contents) {
      console.error("No contents returned from MicroCMS API");
      throw new Error("Failed to fetch interview articles");
    }

    // カテゴリのslugが"interview"の記事のみをフィルタリング
    const interviewArticles = response.contents.filter((article: BlogPost) => 
      article.categories?.some((category) => 
        category.slug === "interview" || 
        (category.name && category.name.toLowerCase().includes("interview")) || 
        (category.name && category.name.toLowerCase().includes("インタビュー"))
      )
    );
    
    console.log(`Found ${interviewArticles.length} interview articles for listing`);
    
    // ページネーション用に記事を切り出す
    const startIndex = offset;
    const endIndex = Math.min(startIndex + PER_PAGE, interviewArticles.length);
    const articles = interviewArticles.slice(startIndex, endIndex) as ExtendedBlogPost[];
    
    // 総ページ数を計算
    const totalCount = interviewArticles.length;
    const totalPages = Math.ceil(totalCount / PER_PAGE);
    
    console.log(`インタビュー記事: 全${totalCount}件中${articles.length}件表示（${page}ページ目/${totalPages}ページ中）`);

    return (
      <div className="space-y-6">
        {/* ヘッダーセクション */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">先輩たちのストーリー</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            海外で活躍する先輩たちのインタビュー記事を紹介します。彼らの経験から学び、あなたの海外挑戦への一歩を踏み出しましょう。
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-muted-foreground py-8">
              インタビュー記事はまだ掲載されていません。
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: ExtendedBlogPost) => (
                <Link
                  key={article.id}
                  href={`/interviews/${article.slug}`}
                  className="block h-full group"
                >
                  <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                    <div className="relative aspect-video w-full overflow-hidden">
                      {article.eyecatch?.url ? (
                        <Image
                          src={article.eyecatch.url}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <User className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h2 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h2>
                      
                      {article.college_name && (
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="line-clamp-1">{article.college_name}</span>
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={article.publishedAt}>
                          {formatDate(article.publishedAt)}
                        </time>
                      </div>
                      
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {article.tags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
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

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={`/interviews?page=${pageNum}`}
                    className={`px-4 py-2 rounded ${
                      pageNum === page
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error in InterviewsPage:", error);
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">先輩たちのストーリー</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            海外で活躍する先輩たちのインタビュー記事を紹介します。彼らの経験から学び、あなたの海外挑戦への一歩を踏み出しましょう。
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-red-500 py-8">
            記事の読み込み中にエラーが発生しました。しばらくしてから再度お試しください。
          </p>
        </div>
      </div>
    );
  }
} 