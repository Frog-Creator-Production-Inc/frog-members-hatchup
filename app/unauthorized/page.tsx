import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <h1 className="text-6xl font-bold text-red-500">403</h1>
        <h2 className="text-2xl font-medium text-gray-700">アクセス権限がありません</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
          <p className="text-gray-700 mb-2">
            このサービスは現在、<span className="font-bold">招待ユーザーのみ</span>がアクセス可能なプレリリース期間中です。
          </p>
          <p className="text-gray-700">
            アクセス権限をご希望の方は、管理者までメールアドレスをお知らせください。
          </p>
        </div>
        <div className="flex flex-col space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth">ログインページに戻る</Link>
          </Button>
          <Button asChild className="w-full">
            <Link href="/">トップページに戻る</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

