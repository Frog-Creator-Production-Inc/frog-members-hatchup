"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { Loader2 } from "lucide-react"

export function SchoolPhotoUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [schools, setSchools] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  // 学校一覧を取得
  const fetchSchools = async () => {
    const { data } = await supabase
      .from('schools')
      .select('id, name')
      .order('name')
    
    if (data) {
      setSchools(data)
    }
  }

  // コンポーネントマウント時に学校一覧を取得
  useEffect(() => {
    fetchSchools()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !description || !schoolId) {
      toast.error("必須項目を入力してください")
      return
    }

    setIsUploading(true)

    try {
      // 1. Storageに画像をアップロード
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = fileName

      console.log('Starting upload:', { fileName, fileSize: file.size })

      // まずアップロード
      const { error: uploadError } = await supabase
        .storage
        .from('school-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // URLを取得
      const { data } = await supabase
        .storage
        .from('school-photos')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365)

      if (!data?.signedUrl) {
        throw new Error('Failed to get signed URL')
      }

      // データベースに記録
      const { error: dbError } = await supabase
        .from('school_photos')
        .insert({
          school_id: schoolId,
          url: data.signedUrl,
          description: description
        })

      if (dbError) {
        console.error('Database error:', dbError)
        throw dbError
      }

      toast.success("写真をアップロードしました")
      router.push("/admin/school-photos")
      router.refresh()

    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      toast.error(`アップロードに失敗しました: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>学校写真のアップロード</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="school">学校</Label>
            <Select value={schoolId} onValueChange={setSchoolId}>
              <SelectTrigger>
                <SelectValue placeholder="学校を選択" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="写真の説明を入力"
            />
          </div>

          <div>
            <Label htmlFor="photo">写真</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button type="submit" disabled={isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "アップロード中..." : "アップロード"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 