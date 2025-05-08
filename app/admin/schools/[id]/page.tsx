import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Edit, Mail, ExternalLink, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const { data: school, error } = await supabase.from("schools").select("*").eq("id", params.id).single()

  if (error) {
    console.error("Error fetching school:", error)
    notFound()
  }

  // コース数を取得
  const { count: coursesCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("school_id", params.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{school.name}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/schools">
            <ArrowLeft className="h-4 w-4 mr-2" />
            学校一覧に戻る
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {school.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={school.logo_url} 
                  alt={school.name} 
                  className="h-16 object-contain"
                />
              </div>
            )}
            <div className="space-y-2">
              <p>
                <strong>ウェブサイト:</strong>{" "}
                {school.website ? (
                  <a 
                    href={school.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {school.website}
                  </a>
                ) : (
                  "未設定"
                )}
              </p>
              <p>
                <strong>コース数:</strong> {coursesCount || 0}
              </p>
              <p>
                <strong>作成日時:</strong> {new Date(school.created_at).toLocaleString()}
              </p>
              <p>
                <strong>更新日時:</strong> {new Date(school.updated_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              コース情報管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              学校担当者にコース情報編集用のリンクを送信できます。
              担当者はログインせずにコース情報を編集できます。
            </p>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href={`/admin/schools/${school.id}/invite`}>
                  <Mail className="mr-2 h-4 w-4" />
                  学校担当者を招待
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>学校説明</CardTitle>
          </CardHeader>
          <CardContent>
            {school.description ? (
              <p className="whitespace-pre-line">{school.description}</p>
            ) : (
              <p className="text-gray-500 italic">説明は設定されていません</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex space-x-4">
        <Button asChild>
          <Link href={`/admin/schools/${school.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            学校情報を編集
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/schools/${school.id}`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            公開ページを表示
          </Link>
        </Button>
      </div>
    </div>
  )
}

