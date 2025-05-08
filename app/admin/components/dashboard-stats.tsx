"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { School, Book, MessageSquare, FileText } from "lucide-react"
import { getTotalNotificationCount } from "@/lib/notifications"
import Link from "next/link"

interface DashboardStatsProps {
  schoolCount: number
  courseCount: number
  contentCount: number
}

export function DashboardStats({ 
  schoolCount, 
  courseCount, 
  contentCount 
}: DashboardStatsProps) {
  const [notificationCounts, setNotificationCounts] = useState({
    chatCount: 0,
    reviewCount: 0,
    applicationCount: 0
  })

  useEffect(() => {
    const fetchNotifications = async () => {
      const counts = await getTotalNotificationCount()
      setNotificationCounts({
        chatCount: counts.chatCount,
        reviewCount: counts.reviewCount,
        applicationCount: counts.applicationCount
      })
    }

    fetchNotifications()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">学校</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{schoolCount}</div>
          <p className="text-xs text-muted-foreground">登録学校数</p>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">コース</CardTitle>
          <Book className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{courseCount}</div>
          <p className="text-xs text-muted-foreground">登録コース数</p>
        </CardContent>
      </Card>
      
      <Card className={notificationCounts.chatCount > 0 ? "bg-red-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Link href="/admin/chats" className="hover:underline">未読チャット</Link>
          </CardTitle>
          <MessageSquare className={`h-4 w-4 ${notificationCounts.chatCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${notificationCounts.chatCount > 0 ? "text-red-600" : ""}`}>
            {notificationCounts.chatCount}
          </div>
          <p className="text-xs text-muted-foreground">未読メッセージ</p>
        </CardContent>
      </Card>
      
      <Card className={notificationCounts.reviewCount > 0 ? "bg-red-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Link href="/admin/visa-reviews" className="hover:underline">ビザレビュー</Link>
          </CardTitle>
          <FileText className={`h-4 w-4 ${notificationCounts.reviewCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${notificationCounts.reviewCount > 0 ? "text-red-600" : ""}`}>
            {notificationCounts.reviewCount}
          </div>
          <p className="text-xs text-muted-foreground">保留中のレビュー</p>
        </CardContent>
      </Card>
      
      <Card className={notificationCounts.applicationCount > 0 ? "bg-red-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Link href="/admin/applications" className="hover:underline">コース申請</Link>
          </CardTitle>
          <Book className={`h-4 w-4 ${notificationCounts.applicationCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${notificationCounts.applicationCount > 0 ? "text-red-600" : ""}`}>
            {notificationCounts.applicationCount}
          </div>
          <p className="text-xs text-muted-foreground">新規申請</p>
        </CardContent>
      </Card>
    </div>
  )
}