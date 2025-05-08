import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Frog Members | 管理者チャット",
  description: "チャットセッションを管理します",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function AdminChatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

