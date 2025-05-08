import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Frog Members | ダッシュボード",
  description: "あなたの学習進捗と次のステップを確認しましょう",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4FD1C5",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

