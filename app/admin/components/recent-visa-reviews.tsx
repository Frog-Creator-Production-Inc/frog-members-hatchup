import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface Review {
  id: string
  status: string
  created_at: string
  visa_plans?: {
    name: string
    profiles: {
      email: string
    }
  }
}

interface RecentVisaReviewsProps {
  reviews: Review[]
}

export function RecentVisaReviews({ reviews }: RecentVisaReviewsProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>新着ビザレビュー</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/visa-reviews">すべて表示</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            新着のレビュー申請はありません
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{review.visa_plans?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    申請者: {review.visa_plans?.profiles.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(review.created_at)}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/admin/visa-reviews/${review.id}`}>
                    レビューする
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}