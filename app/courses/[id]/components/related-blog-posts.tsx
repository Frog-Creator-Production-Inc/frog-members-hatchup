"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { getRelatedBlogPosts } from "@/lib/microcms"
import type { BlogPost } from "@/lib/microcms"
import { ExternalLink } from "lucide-react"

export function RelatedBlogPosts({ schoolName }: { schoolName: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await getRelatedBlogPosts(schoolName)
        setPosts(data)
      } catch (error) {
        console.error("Error loading related posts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [schoolName])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-base font-medium text-gray-800 flex items-center">
            <ExternalLink className="w-4 h-4 mr-2 text-primary" />
            卒業生インタビューを読み込み中...
          </h3>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-base font-medium text-gray-800 flex items-center">
            <ExternalLink className="w-4 h-4 mr-2 text-primary" />
            卒業生インタビュー
          </h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            卒業生インタビューはまだ掲載されていません
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-base font-medium text-gray-800 flex items-center">
          <ExternalLink className="w-4 h-4 mr-2 text-primary" />
          卒業生インタビュー
        </h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`https://frogagent.com/interview/${post.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={post.eyecatch?.url || "/placeholder.jpg"}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {post.course_name}
                </p>
              </div>
            </a>
          ))}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            <a
              href="https://frogagent.com/category/interview/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="text-sm">他の記事を見る</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
