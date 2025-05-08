"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { subscribeToNotifications, getTotalNotificationCount } from "@/lib/notifications"

interface NotificationBadgeProps {
  type?: "chat" | "review" | "application" | "all"
  showIcon?: boolean
  className?: string
}

export function NotificationBadge({ 
  type = "all", 
  showIcon = false,
  className = ""
}: NotificationBadgeProps) {
  const [counts, setCounts] = useState({
    chatCount: 0,
    reviewCount: 0,
    applicationCount: 0,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 初期データの取得
    const fetchCounts = async () => {
      setIsLoading(true)
      try {
        const notificationCounts = await getTotalNotificationCount()
        console.log('Notification counts:', notificationCounts)
        setCounts(notificationCounts)
      } catch (error) {
        console.error("Error fetching notification counts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCounts()

    // リアルタイム更新のサブスクリプション
    const unsubscribe = subscribeToNotifications(() => {
      console.log('Notification subscription triggered')
      fetchCounts()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // 表示するカウントを決定
  const getCount = () => {
    switch (type) {
      case "chat":
        return counts.chatCount
      case "review":
        return counts.reviewCount
      case "application":
        return counts.applicationCount
      case "all":
      default:
        return counts.total
    }
  }

  const count = getCount()

  // カウントが0の場合は何も表示しない
  if (count === 0) {
    return null
  }

  return (
    <Badge 
      variant="destructive" 
      className={`flex items-center gap-1 ${className}`}
    >
      {showIcon && <Bell className="h-3 w-3" />}
      {count}
    </Badge>
  )
} 