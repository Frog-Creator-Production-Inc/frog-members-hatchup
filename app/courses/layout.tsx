import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Frog Members | コース検索",
  description: "あなたに最適なコースを見つけましょう",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

