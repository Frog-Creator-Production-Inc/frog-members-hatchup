import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

// Frog管理者のロゴURL
const FROG_ADMIN_LOGO = "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"

interface Comment {
  id: string
  comment: string
  created_at: string
  user_id: string
  profile?: {
    first_name?: string
    last_name?: string
    email?: string
    avatar_url?: string
  }
}

interface CommentListProps {
  comments: Comment[]
  adminUserIds: string[]
  currentUserId?: string
}

export function CommentList({ comments, adminUserIds, currentUserId }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        コメントはまだありません
      </div>
    )
  }

  // コメントを日付順に並べ替え
  const sortedComments = [...comments].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // ユーザーのイニシャルを取得
  const getUserInitials = (profile?: { first_name?: string; last_name?: string; email?: string }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    }
    
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase()
    }
    
    return 'U'
  }

  // ユーザー名を取得
  const getUserName = (comment: Comment) => {
    if (comment.profile?.first_name && comment.profile?.last_name) {
      return `${comment.profile.first_name} ${comment.profile.last_name}`
    }
    
    if (comment.profile?.email) {
      return comment.profile.email
    }
    
    if (adminUserIds.includes(comment.user_id)) {
      return "Frog管理者"
    }
    
    return "ユーザー"
  }

  // ユーザーのアバターURLを取得
  const getAvatarUrl = (comment: Comment) => {
    if (adminUserIds.includes(comment.user_id)) {
      return FROG_ADMIN_LOGO
    }
    
    return comment.profile?.avatar_url
  }

  // 自分のコメントかどうかを判定
  const isOwnComment = (userId: string) => {
    return currentUserId && userId === currentUserId
  }

  return (
    <div className="space-y-4">
      {sortedComments.map((comment) => (
        <Card key={comment.id} className={`overflow-hidden ${isOwnComment(comment.user_id) ? 'border-blue-200 bg-blue-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(comment)} />
                <AvatarFallback>{getUserInitials(comment.profile)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium text-sm">{getUserName(comment)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 