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

export default function NewSchoolPage() {
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [locationId, setLocationId] = useState("")
  const [locations, setLocations] = useState<GoalLocation[]>([])
  const [logo, setLogo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // ロケーションデータの取得
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase.from("goal_locations").select("*").order("city")

      if (error) {
        console.error("Error fetching locations:", error)
        toast.error("ロケーションデータの取得に失敗しました")
      } else {
        setLocations(data || [])
      }
    }

    fetchLocations()
  }, [supabase])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogo(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Insert school data
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .insert([
          {
            name,
            website,
            description,
            location_id: locationId || null, // ロケーションIDを追加
          },
        ])
        .select()

      if (schoolError) {
        console.error("School creation error:", schoolError)
        throw new Error(`学校データの作成に失敗しました: ${schoolError.message}`)
      }

      const schoolId = schoolData[0].id

      let logo_url = null
      if (logo) {
        // Upload logo
        const fileExt = logo.name.split(".").pop()
        const fileName = `${schoolId}-logo.${fileExt}`
        const { data, error } = await supabase.storage.from("school-logos").upload(fileName, logo)

        if (error) {
          console.error("Logo upload error:", error)
          throw new Error(`ロゴのアップロードに失敗しました: ${error.message}`)
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("school-logos").getPublicUrl(fileName)

        logo_url = publicUrl

        // Update school with logo URL
        const { error: updateError } = await supabase.from("schools").update({ logo_url }).eq("id", schoolId)

        if (updateError) {
          console.error("Logo URL update error:", updateError)
          throw new Error(`ロゴURLの更新に失敗しました: ${updateError.message}`)
        }
      }

      toast.success("学校が登録されました")
      router.push("/admin/schools")
    } catch (error: any) {
      console.error("Error creating school:", error)
      toast.error(`学校の登録中にエラーが発生しました: ${error.message || "不明なエラー"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">新規学校登録</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">学校名</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="location">所在地</Label>
          <Select value={locationId} onValueChange={setLocationId}>
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
          <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="description">説明</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
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

        <Button type="submit" disabled={loading}>
          {loading ? "登録中..." : "登録"}
        </Button>
      </form>
    </div>
  )
}

