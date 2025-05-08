"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Home, School, Camera, Book, Users, LogOut, MessageSquare, FileText, GraduationCap, ClipboardList, Globe, FileSpreadsheet, Briefcase } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { NotificationBadge } from "./notification-badge"

const navItems = [
  { href: "/admin", icon: Home, label: "ダッシュボード" },
  { href: "/admin/schools", icon: School, label: "学校" },
  { href: "/admin/school-photos", icon: Camera, label: "学校写真" },
  { href: "/admin/courses", icon: Book, label: "コース" },
  { href: "/admin/applications", icon: ClipboardList, label: "コース申し込み", notificationType: "application" },
  { href: "/admin/profiles", icon: Users, label: "ユーザー" },
  { href: "/admin/job-positions", icon: Briefcase, label: "職種管理" },
  { href: "/admin/chats", icon: MessageSquare, label: "チャット", notificationType: "chat" },
  { href: "/admin/visa-reviews", icon: FileText, label: "ビザレビュー", notificationType: "review" },
  { href: "/admin/visas", icon: Globe, label: "ビザ管理" },
  { href: "/admin/learning", icon: GraduationCap, label: "学習コンテンツ" },
  { href: "/admin/content-snare", icon: FileSpreadsheet, label: "Content Snare" },
]

export function Sidebar() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // 新しいAPIエンドポイントを使用して管理者チェック
        const response = await fetch('/api/admin/check')
        
        if (!response.ok) {
          console.error("管理者チェックAPIエラー:", response.status)
          setLoading(false)
          return
        }
        
        const { isAdmin, user } = await response.json()
        
        if (isAdmin && user) {
          setUser(user)
          setIsAdmin(true)
        } else {
          // 管理者でない場合はダッシュボードへリダイレクト
          router.push('/dashboard')
        }
      } catch (error) {
        console.error("管理者チェック例外:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAdmin || !user) {
    return null
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("サインアウトしました")
      router.push("/auth")
    } catch (error) {
      console.error("サインアウトエラー:", error)
      toast.error("サインアウトに失敗しました")
    }
  }

  return (
    <div className="flex flex-col w-64 bg-white h-screen border-r overflow-hidden">
      <div className="flex items-center h-16 border-b px-4">
        <h1 className="text-xl font-semibold text-gray-800">Admin</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="flex flex-col py-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
                {item.notificationType && (
                  <div className="ml-auto">
                    <NotificationBadge type={item.notificationType as "chat" | "review" | "application"} />
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t py-2">
        <button onClick={handleSignOut} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full">
          <LogOut className="w-5 h-5 mr-3" />
          <span>ログアウト</span>
        </button>
      </div>
    </div>
  )
}