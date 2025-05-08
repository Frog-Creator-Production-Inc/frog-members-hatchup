"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface VisaReview {
  id: string
  status: string
  title: string | null
  admin_comments: string | null
  created_at: string
  visa_plans: {
    id: string
    name: string
    description: string
    profiles: {
      id: string
      email: string
    }
  }
}

interface VisaReviewListProps {
  reviews: VisaReview[]
}

export function VisaReviewList({ reviews }: VisaReviewListProps) {
  const [filter, setFilter] = useState<string>("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">レビュー待ち</Badge>
      case "in_review":
        return <Badge variant="default">レビュー中</Badge>
      case "completed":
        return <Badge variant="outline">完了</Badge>
      default:
        return null
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true
    return review.status === filter
  })

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          すべて
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          レビュー待ち
        </Button>
        <Button
          variant={filter === "in_review" ? "default" : "outline"}
          onClick={() => setFilter("in_review")}
        >
          レビュー中
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
        >
          完了
        </Button>
      </div>

      {filteredReviews.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              該当するレビュー申請はありません
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {review.title || review.visa_plans.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      申請者: {review.visa_plans.profiles.email}
                    </p>
                  </div>
                  {getStatusBadge(review.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      申請日時: {formatDate(review.created_at)}
                    </p>
                    {review.visa_plans.description && (
                      <p className="mt-2 text-sm">{review.visa_plans.description}</p>
                    )}
                  </div>
                  <Button asChild>
                    <Link href={`/admin/visa-reviews/${review.id}`}>
                      詳細を確認
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}