"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EditSchoolPhotoPage({ params }: { params: { id: string } }) {
  const [photo, setPhoto] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      const [photoResult, schoolsResult] = await Promise.all([
        supabase.from("school_photos").select("*").eq("id", params.id).single(),
        supabase.from("schools").select("id, name").order("name"),
      ])

      if (photoResult.error) {
        console.error("Error fetching school photo:", photoResult.error)
        router.push("/admin/school-photos")
      } else {
        setPhoto(photoResult.data)
      }

      if (schoolsResult.error) {
        console.error("Error fetching schools:", schoolsResult.error)
      } else {
        setSchools(schoolsResult.data || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [params.id, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    const { error } = await supabase
      .from("school_photos")
      .update({
        url: photo.url,
        description: photo.description,
        school_id: photo.school_id,
      })
      .eq("id", params.id)

    setUpdating(false)

    if (error) {
      console.error("Error updating school photo:", error)
      alert("学校写真の更新中にエラーが発生しました。")
    } else {
      router.push("/admin/school-photos")
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">学校写真の編集</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="url">写真URL</Label>
          <Input
            id="url"
            type="url"
            value={photo.url}
            onChange={(e) => setPhoto({ ...photo, url: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            value={photo.description || ""}
            onChange={(e) => setPhoto({ ...photo, description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="schoolId">学校</Label>
          <Select value={photo.school_id} onValueChange={(value) => setPhoto({ ...photo, school_id: value })}>
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
        <Button type="submit" disabled={updating}>
          {updating ? "更新中..." : "更新"}
        </Button>
      </form>
    </div>
  )
}

