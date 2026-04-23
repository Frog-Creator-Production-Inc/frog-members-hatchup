"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, Home, Search, Clipboard, BarChart, BookOpen, Users, Calendar, Settings, User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"

const navigation = [
  { name: "ホーム", href: "/dashboard", icon: Home },
  { name: "コース検索", href: "/courses", icon: Search },
  { name: "ビザプランナー", href: "/visa", icon: Clipboard },
  { name: "AIアシスタント", href: "/aiagent", icon: Bot },
  { name: "統計", href: "/statistics", icon: BarChart },
  { name: "学習", href: "/learning", icon: BookOpen },
  { name: "コミュニティ", href: "/community", icon: Users },
  { name: "イベント", href: "/events", icon: Calendar },
  { name: "先輩たちのストーリー", href: "/interviews", icon: User },
  { name: "設定", href: "/settings", icon: Settings },
]

function LogoutButton() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
    toast.success("ログアウトしました")
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center w-full p-4 gap-4 rounded-md hover:bg-green-100 hover:shadow-inner transition-all ease-linear group"
    >
      <LogOut className="w-6 h-6 group-hover:stroke-green-600" />
      <span className="font-semibold group-hover:text-green-600">ログアウト</span>
    </button>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="メニューを開く">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-white">
        <div className="flex flex-col h-full">
          <div className="flex-1 py-6">
            <nav className="grid items-start gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium active:bg-green-100 active:shadow-inner transition-all ease-linear",
                    pathname === item.href ? "bg-gradient-to-r from-green-400 to-green-600 text-white" : "bg-transparent text-gray-700"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto border-t pt-4">
            <LogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 