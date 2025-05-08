import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface Chat {
  id: string
  user_id: string
  status: string
  created_at: string
  profiles?: {
    email: string
  }
}

interface RecentChatsProps {
  chats: Chat[]
}

export function RecentChats({ chats }: RecentChatsProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>新着チャット</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/chats">すべて表示</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {chats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            新着のチャットはありません
          </p>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{chat.profiles?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(chat.created_at)}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/admin/chats/${chat.id}`}>
                    対応する
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