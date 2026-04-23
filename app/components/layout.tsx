"use client"

import { Suspense } from "react"
import Sidebar from "../dashboard/components/sidebar"
import { ErrorBoundary } from "@/components/error-boundary"
import Chat from "@/app/dashboard/components/chat"
import { MobileNav } from "./mobile-nav"
import Image from "next/image"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-16 items-center border-b bg-white px-4 lg:hidden sticky top-0 z-50">
        <MobileNav />
        <div className="flex-grow flex items-center justify-center">
          <div className="relative w-10 h-12 my-2">
            <Image
              src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
              alt="Frog Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </div>
      <Sidebar />
      <div className="lg:pl-72">
        <main className="p-4 md:p-8 relative">
          <ErrorBoundary>
            <Suspense fallback={<div>読み込み中...</div>}>{children}</Suspense>
          </ErrorBoundary>
          <Chat />
        </main>
      </div>
    </div>
  )
}