"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, BookOpen, Users, Calendar, Settings, Search, FileText, BarChart2, LogOut, Bot } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"

const navigation = [
  { name: "ホーム", href: "/dashboard", icon: Home },
  { name: "コース検索", href: "/courses", icon: BookOpen },
  { name: "ビザプランナー", href: "/visa", icon: FileText },
  { name: "AIアシスタント", href: "/aiagent", icon: Bot },
  { name: "統計", href: "/statistics", icon: BarChart2 },
  { name: "学習", href: "/learning", icon: BookOpen },
  { name: "コミュニティ", href: "/community", icon: Users },
  { name: "イベント", href: "/events", icon: Calendar },
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
      className="flex items-center w-full p-4 gap-4 rounded-full hover:bg-green-100 hover:shadow-inner focus:bg-gradient-to-r from-green-400 to-green-600 focus:text-white transition-all ease-linear group"
    >
      <LogOut className="w-6 h-6 group-focus:stroke-white" />
      <span className="font-semibold">ログアウト</span>
    </button>
  )
}

export default function Sidebar() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white shadow-md shadow-green-200/50 p-5">
        <div className="logo-wrapper mx-auto my-4">
          <div className="logo-container relative w-[160px] h-[160px]">
            <div className="wave-container absolute inset-0 rounded-full overflow-hidden bg-white/80">
              <div className="wave-effect">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
              <div className="relative w-16 h-16">
                <Image
                  src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
                  alt="Frog Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-2 px-2 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center w-full p-4 gap-4 rounded-full hover:bg-green-100 hover:shadow-inner focus:bg-gradient-to-r from-green-400 to-green-600 focus:text-white text-gray-700 transition-all ease-linear group"
            >
              <item.icon className="w-6 h-6 group-focus:stroke-white" />
              <span className="font-semibold">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pb-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
} 