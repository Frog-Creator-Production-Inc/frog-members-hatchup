"use client"

import { useState, ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut } from "lucide-react"
import { LucideIcon } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: ReactNode
}

interface NavigationProps {
  items: NavigationItem[]
  logoUrl?: string
  logoAlt?: string
  onLogout?: () => Promise<void>
  className?: string
}

/**
 * LogoutButtonコンポーネント - ログアウト機能を提供するボタン
 */
export function LogoutButton({ 
  onLogout,
  className 
}: { 
  onLogout?: () => Promise<void>,
  className?: string 
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    try {
      setIsLoggingOut(true)
      
      if (onLogout) {
        await onLogout()
      } else {
        await supabase.auth.signOut()
        router.push("/auth")
        toast.success("ログアウトしました")
      }
    } catch (error) {
      toast.error("ログアウト中にエラーが発生しました")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={cn(
        "flex items-center w-full p-4 gap-4 rounded-full hover:bg-primary/10 text-gray-700 transition-all ease-linear", 
        isLoggingOut && "opacity-70 cursor-not-allowed",
        className
      )}
    >
      <LogOut className="w-6 h-6 flex-shrink-0" />
      <span className="font-medium">ログアウト</span>
    </button>
  )
}

/**
 * MobileNavigationコンポーネント - モバイル用ナビゲーション
 */
export function MobileNavigation({ 
  items,
  logoUrl = "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png",
  logoAlt = "Logo",
  onLogout
}: NavigationProps) {
  const pathname = usePathname()

  return (
    <div className="lg:hidden flex h-16 items-center border-b bg-white px-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">メニューを開く</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col pt-6 w-72">
          <div className="flex justify-center mb-8">
            <Logo src={logoUrl} alt={logoAlt} size={48} priority />
          </div>
          
          <div className="flex-1 overflow-auto">
            <nav className="flex flex-col gap-1">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-md hover:bg-primary/10 transition-colors group",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className={cn(
                      "h-6 w-6",
                      isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"
                    )} />
                    <span className={cn(
                      "font-medium", 
                      isActive ? "text-primary" : "text-gray-700"
                    )}>
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="ml-auto">{item.badge}</span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="mt-auto border-t pt-4">
            <LogoutButton onLogout={onLogout} />
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="flex-grow flex items-center justify-center">
        <Logo src={logoUrl} alt={logoAlt} size={48} priority />
      </div>
    </div>
  )
}

/**
 * SidebarNavigationコンポーネント - デスクトップ用サイドバー
 */
export function SidebarNavigation({ 
  items,
  logoUrl = "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png",
  logoAlt = "Logo",
  onLogout,
  className
}: NavigationProps) {
  const pathname = usePathname()
  
  return (
    <div className={cn("hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col", className)}>
      <div className="flex flex-col flex-grow bg-white shadow-md shadow-primary/10 p-5">
        <div className="logo-wrapper mx-auto my-4">
          <Logo 
            src={logoUrl} 
            alt={logoAlt} 
            size={64} 
            priority 
            withContainer 
            containerClassName="w-[100px] h-[100px]" 
          />
        </div>
        
        <nav className="flex-1 space-y-1 px-2 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center w-full p-3 gap-3 rounded-md transition-all ease-linear group",
                  isActive 
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-primary/5 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-700"
                )} />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto">{item.badge}</span>
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-auto pb-4">
          <LogoutButton onLogout={onLogout} />
        </div>
      </div>
    </div>
  )
}

/**
 * NavigationWrapperコンポーネント - モバイルとデスクトップのナビゲーションを組み合わせた便利なラッパー
 */
export function NavigationWrapper({
  items,
  children,
  logoUrl,
  logoAlt,
  onLogout,
  className
}: NavigationProps & { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation
        items={items}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        onLogout={onLogout}
      />
      <SidebarNavigation
        items={items}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        onLogout={onLogout}
        className={className}
      />
      <div className="lg:pl-72">
        <main className="p-8 relative">
          {children}
        </main>
      </div>
    </div>
  )
} 