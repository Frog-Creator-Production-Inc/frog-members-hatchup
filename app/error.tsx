"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h2 className="text-2xl font-medium text-gray-700">エラーが発生しました</h2>
        <p className="text-gray-500">申し訳ありません。予期せぬエラーが発生しました。</p>
        <div className="space-x-4">
          <Button onClick={reset} className="bg-[#4FD1C5] hover:bg-[#45B8AE]">
            もう一度試す
          </Button>
          <Button asChild variant="outline">
            <Link href="/">ホームに戻る</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

