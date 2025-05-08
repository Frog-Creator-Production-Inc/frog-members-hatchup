import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function SchoolPhotoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const { data: photo, error } = await supabase
    .from("school_photos")
    .select("*, schools(name)")
    .eq("id", params.id)
    .single()

  if (error) {
    console.error("Error fetching school photo:", error)
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">学校写真詳細</h1>
      <div className="space-y-4">
        <Image
          src={photo.url || "/placeholder.svg"}
          alt={photo.description || "学校の写真"}
          width={400}
          height={300}
          className="object-cover"
        />
        <p>
          <strong>説明:</strong> {photo.description || "説明なし"}
        </p>
        <p>
          <strong>学校名:</strong> {photo.schools?.name || "不明"}
        </p>
        <p>
          <strong>作成日時:</strong> {new Date(photo.created_at).toLocaleString()}
        </p>
      </div>
      <div className="mt-8 space-x-4">
        <Button asChild>
          <Link href={`/admin/school-photos/${photo.id}/edit`}>編集</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/school-photos">戻る</Link>
        </Button>
      </div>
    </div>
  )
}

