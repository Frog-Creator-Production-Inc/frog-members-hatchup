import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SchoolNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-medium text-gray-700">学校が見つかりませんでした</h2>
        <p className="text-gray-500">お探しの学校は削除されたか、URLが間違っている可能性があります。</p>
        <Button asChild>
          <Link href="/schools">学校一覧に戻る</Link>
        </Button>
      </div>
    </div>
  )
}

