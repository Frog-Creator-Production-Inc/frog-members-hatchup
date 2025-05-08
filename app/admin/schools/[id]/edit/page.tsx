"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import Image from "next/image"
import type { GoalLocation } from "@/types/database.types"

export default function EditSchoolPage({ params }: { params: { id: string } }) {
  const [school, setSchool] = useState<any>(null)
  const [locations, setLocations] = useState<GoalLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 学校データとロケーションデータを並行して取得
        const [schoolResult, locationsResult] = await Promise.all([
          supabase.from("schools").select("*").eq("id", params.id).single(),
          supabase.from("goal_locations").select("*").order("city"),
        ])

        if (schoolResult.error) throw schoolResult.error
        if (locationsResult.error) throw locationsResult.error

        setSchool(schoolResult.data)
        setLocations(locationsResult.data)
        if (schoolResult.data.logo_url) {
          setPreviewUrl(schoolResult.data.logo_url)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("データの取得に失敗しました")
        router.push("/admin/schools")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, router, supabase])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogo(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      let logo_url = school.logo_url

      if (logo) {
        // Delete old logo if exists
        if (school.logo_url) {
          const oldLogoPath = school.logo_url.split("/").pop()
          await supabase.storage.from("school-logos").remove([oldLogoPath])
        }

        // Upload new logo
        const fileExt = logo.name.split(".").pop()
        const fileName = `${params.id}-logo.${fileExt}`
        const { data, error } = await supabase.storage.from("school-logos").upload(fileName, logo, { upsert: true })

        if (error) {
          console.error("Logo upload error:", error)
          throw new Error(`ロゴのアップロードに失敗しました: ${error.message}`)
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("school-logos").getPublicUrl(fileName)

        logo_url = publicUrl
      }

      const { error } = await supabase
        .from("schools")
        .update({
          ...school,
          logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) {
        console.error("Database update error:", error)
        throw new Error(`データベースの更新に失敗しました: ${error.message}`)
      }

      toast.success("学校情報が更新されました")
      router.push("/admin/schools")
    } catch (error: any) {
      console.error("Error updating school:", error)
      toast.error(`学校情報の更新中にエラーが発生しました: ${error.message || "不明なエラー"}`)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">学校情報の編集</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">学校名</Label>
          <Input
            id="name"
            value={school.name}
            onChange={(e) => setSchool({ ...school, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="location">所在地</Label>
          <Select
            value={school.location_id || ""}
            onValueChange={(value) => setSchool({ ...school, location_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="所在地を選択" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.city}, {location.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="website">ウェブサイト</Label>
          <Input
            id="website"
            type="url"
            value={school.website || ""}
            onChange={(e) => setSchool({ ...school, website: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            value={school.description || ""}
            onChange={(e) => setSchool({ ...school, description: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="logo">ロゴ</Label>
          <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
          {previewUrl && (
            <div className="mt-2">
              <Image src={previewUrl || "/placeholder.svg"} alt="School logo preview" width={100} height={100} />
            </div>
          )}
        </div>

        <Button type="submit" disabled={updating}>
          {updating ? "更新中..." : "更新"}
        </Button>
      </form>
    </div>
  )
}

