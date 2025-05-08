"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ReviewCommentsProps {
  comments: string
  title: string | null
  date: string
  status?: 'in_review' | 'completed'
}

export function ReviewComments({ comments, title, date, status = 'completed' }: ReviewCommentsProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'in_review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200">
            レビュー中
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
            完了
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <article className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-primary">
                {title || "レビューコメント"}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(date)}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </header>

        <div className="mt-6 text-gray-700 whitespace-pre-wrap">
          {comments}
        </div>
      </section>

      <footer className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
      </footer>
    </article>
  )
}