import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-[#4FD1C5]">404</h1>
        <h2 className="text-2xl font-medium text-gray-700">ページが見つかりませんでした</h2>
        <p className="text-gray-500">お探しのページは削除されたか、URLが間違っている可能性があります。</p>
        <Button asChild className="mt-4 bg-[#4FD1C5] hover:bg-[#45B8AE]">
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    </div>
  )
}

