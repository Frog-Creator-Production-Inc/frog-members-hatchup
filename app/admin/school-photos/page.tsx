import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

export const dynamic = "force-dynamic"

// 写真データの型定義
interface SchoolPhoto {
  id: string
  url: string
  description: string | null
  school_id: string
  course_id: string | null
  schools: {
    name: string
  } | null
  courses: {
    name: string
  } | null
}

export default async function SchoolPhotosPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: schoolPhotos, error } = await supabase
    .from("school_photos")
    .select("id, url, description, school_id, course_id, schools(name), courses(name)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching school photos:", error)
    return <div>学校写真データの取得中にエラーが発生しました。</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">学校写真一覧</h1>
        <Button asChild>
          <Link href="/admin/school-photos/new">新規写真登録</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>写真</TableHead>
            <TableHead>説明</TableHead>
            <TableHead>学校名</TableHead>
            <TableHead>コース名</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schoolPhotos?.map((photo: any) => (
            <TableRow key={photo.id}>
              <TableCell>
                <Image
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.description || "学校の写真"}
                  width={100}
                  height={100}
                  className="object-cover"
                  unoptimized
                />
              </TableCell>
              <TableCell>{photo.description || "説明なし"}</TableCell>
              <TableCell>
                {photo.schools && typeof photo.schools === 'object' && 'name' in photo.schools
                  ? photo.schools.name
                  : "不明"}
              </TableCell>
              <TableCell>
                {photo.course_id ? (
                  <Link 
                    href={`/admin/courses/${photo.course_id}`}
                    className="text-primary hover:underline"
                  >
                    {photo.courses && typeof photo.courses === 'object' && 'name' in photo.courses
                      ? photo.courses.name
                      : "不明"}
                  </Link>
                ) : (
                  "コースなし"
                )}
              </TableCell>
              <TableCell>
                <Button asChild variant="outline" size="sm" className="mr-2">
                  <Link href={`/admin/school-photos/${photo.id}`}>詳細</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/school-photos/${photo.id}/edit`}>編集</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

