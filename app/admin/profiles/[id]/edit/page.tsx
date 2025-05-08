"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function EditProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", params.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
        router.push("/admin/profiles")
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [params.id, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    setUpdating(false)

    if (error) {
      console.error("Error updating profile:", error)
      alert("プロフィールの更新中にエラーが発生しました。")
    } else {
      router.push("/admin/profiles")
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">ユーザープロフィールの編集</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="englishLevel">英語レベル</Label>
          <Select
            value={profile.english_level || ""}
            onValueChange={(value) => setProfile({ ...profile, english_level: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="英語レベルを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">初級</SelectItem>
              <SelectItem value="intermediate">中級</SelectItem>
              <SelectItem value="advanced">上級</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="workExperience">職務経験</Label>
          <Input
            id="workExperience"
            value={profile.work_experience || ""}
            onChange={(e) => setProfile({ ...profile, work_experience: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="workingHoliday">ワーキングホリデー</Label>
          <Input
            id="workingHoliday"
            value={profile.working_holiday || ""}
            onChange={(e) => setProfile({ ...profile, working_holiday: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="ageRange">年齢層</Label>
          <Input
            id="ageRange"
            value={profile.age_range || ""}
            onChange={(e) => setProfile({ ...profile, age_range: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="abroadTiming">海外渡航時期</Label>
          <Input
            id="abroadTiming"
            value={profile.abroad_timing || ""}
            onChange={(e) => setProfile({ ...profile, abroad_timing: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="supportNeeded">必要なサポート</Label>
          <Input
            id="supportNeeded"
            value={profile.support_needed || ""}
            onChange={(e) => setProfile({ ...profile, support_needed: e.target.value })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="onboardingCompleted"
            checked={profile.onboarding_completed}
            onCheckedChange={(checked) => setProfile({ ...profile, onboarding_completed: checked })}
          />
          <Label htmlFor="onboardingCompleted">オンボーディング完了</Label>
        </div>
        <div>
          <Label htmlFor="migrationGoal">渡航目的</Label>
          <Input
            id="migrationGoal"
            value={profile.migration_goal || ""}
            onChange={(e) => setProfile({ ...profile, migration_goal: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="currentOccupation">現在の職業</Label>
          <Input
            id="currentOccupation"
            value={profile.current_occupation || ""}
            onChange={(e) => setProfile({ ...profile, current_occupation: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="futureOccupation">将来の職業</Label>
          <Input
            id="futureOccupation"
            value={profile.future_occupation || ""}
            onChange={(e) => setProfile({ ...profile, future_occupation: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={updating}>
          {updating ? "更新中..." : "更新"}
        </Button>
      </form>
    </div>
  )
}

