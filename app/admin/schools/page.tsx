import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function SchoolsPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: schools, error } = await supabase
    .from("schools")
    .select("id, name, website, logo_url")
    .order("name")

  if (error) {
    console.error("Error fetching schools:", error)
    return <div>学校データの取得中にエラーが発生しました。</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">学校一覧</h1>
        <Button asChild>
          <Link href="/admin/schools/new">新規学校登録</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ロゴ</TableHead>
            <TableHead>名前</TableHead>
            <TableHead>ウェブサイト</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.map((school) => (
            <TableRow key={school.id}>
              <TableCell>
                {school.logo_url ? (
                  <Image
                    src={school.logo_url || "/placeholder.svg"}
                    alt={`${school.name} logo`}
                    width={50}
                    height={50}
                  />
                ) : (
                  "なし"
                )}
              </TableCell>
              <TableCell>{school.name}</TableCell>
              <TableCell>{school.website || "未設定"}</TableCell>
              <TableCell>
                <Button asChild variant="outline" size="sm" className="mr-2">
                  <Link href={`/admin/schools/${school.id}`}>詳細</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/schools/${school.id}/edit`}>編集</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

