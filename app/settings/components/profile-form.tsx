"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"
import { getCurrentLocations, getGoalLocations, getJobPositions } from "@/lib/supabase/queries"
import type { Profile, CurrentLocation, GoalLocation, JobPosition } from "@/types/supabase"
import { AvatarUpload } from "./avatar-upload"

interface ProfileFormProps {
  initialProfile: Profile
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [loading, setLoading] = useState(false)
  const [currentLocations, setCurrentLocations] = useState<CurrentLocation[]>([])
  const [goalLocations, setGoalLocations] = useState<GoalLocation[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [currentLocs, goalLocs, positions] = await Promise.all([
          getCurrentLocations(), 
          getGoalLocations(),
          getJobPositions()
        ])
        setCurrentLocations(currentLocs)
        setGoalLocations(goalLocs)
        setJobPositions(positions || [])
      } catch (error) {
        toast.error("データの取得に失敗しました")
      }
    }
    fetchLocations()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev: Profile) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string | null) => {
    setProfile((prev: Profile) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (url: string | null) => {
    setProfile((prev: Profile) => ({ ...prev, avatar_url: url }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase
        .from('profiles')
        .update({
          ...profile,
          id: profile.id
        })
        .eq('id', profile.id);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          id: profile.id
        })
        .eq('id', profile.id);

      if (error && !error.message?.includes('duplicate key value')) {
        throw error;
      }

      toast.success("プロフィールが更新されました")
      router.refresh()
    } catch (error) {
      toast.error("プロフィールの更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm("本当に解約しますか？")) {
      return
    }

    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: profile.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel subscription")
      }

      toast.success("解約完了しました")
      window.location.href = "/dashboard"
    } catch (error) {
      toast.error("解約に失敗しました")
    }
  }

  const handleOpenCustomerPortal = async () => {
    try {
      const response = await fetch("/api/create-customer-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId: profile.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to create customer portal session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      toast.error("顧客ポータルの開封に失敗しました")
    }
  }

  // future_occupationに対応するjob_positionを検索
  const getJobPositionTitle = (id: string | null) => {
    if (!id) return ""
    const position = jobPositions.find(pos => pos.id === id)
    return position ? position.title : ""
  }

  // support_neededの確認ボックスでの型エラーを修正
  const handleSupportNeededChange = (support: string, checked: boolean) => {
    const currentSupport = profile.support_needed ? profile.support_needed.split(",") : []
    const updatedSupport = checked
      ? [...currentSupport, support]
      : currentSupport.filter((s: string) => s !== support)
    handleSelectChange("support_needed", updatedSupport.join(","))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <AvatarUpload
        userId={profile.id}
        avatarUrl={profile.avatar_url}
        firstName={profile.first_name}
        email={profile.email}
        onAvatarChange={handleAvatarChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <Input
            id="first_name"
            name="first_name"
            value={profile.first_name || ""}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <Input
            id="last_name"
            name="last_name"
            value={profile.last_name || ""}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          メールアドレス
        </label>
        <Input
          type="email"
          name="email"
          id="email"
          value={profile.email}
          onChange={handleChange}
          disabled
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="migration_goal" className="block text-sm font-medium text-gray-700">
          海外に行く目的
        </label>
        <Select value={profile.migration_goal} onValueChange={(value) => handleSelectChange("migration_goal", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="目的を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overseas_job">海外就職</SelectItem>
            <SelectItem value="improve_language">語学力向上</SelectItem>
            <SelectItem value="career_change">キャリアチェンジ</SelectItem>
            <SelectItem value="find_new_home">移住</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="english_level" className="block text-sm font-medium text-gray-700">
          英語レベル
        </label>
        <Select
          value={profile.english_level || ""}
          onValueChange={(value) => handleSelectChange("english_level", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="英語レベルを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">初心者（日常会話も難しい）</SelectItem>
            <SelectItem value="intermediate">中級者（日常会話ができる）</SelectItem>
            <SelectItem value="advanced">上級者（ビジネスでも使える）</SelectItem>
            <SelectItem value="native">ネイティブレベル</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="work_experience" className="block text-sm font-medium text-gray-700">
          職務経験年数
        </label>
        <Select
          value={profile.work_experience || ""}
          onValueChange={(value) => handleSelectChange("work_experience", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="経験年数を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-2">0-2年</SelectItem>
            <SelectItem value="3-5">3-5年</SelectItem>
            <SelectItem value="6-10">6-10年</SelectItem>
            <SelectItem value="10+">10年以上</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="working_holiday" className="block text-sm font-medium text-gray-700">
          ワーキングホリデービザ
        </label>
        <Select
          value={profile.working_holiday || ""}
          onValueChange={(value) => handleSelectChange("working_holiday", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="ワーキングホリデービザの状況を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">検討中</SelectItem>
            <SelectItem value="no">検討していない</SelectItem>
            <SelectItem value="already_applied">申請済み</SelectItem>
            <SelectItem value="not_eligible">対象年齢ではない</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="age_range" className="block text-sm font-medium text-gray-700">
          年齢層
        </label>
        <Select value={profile.age_range || ""} onValueChange={(value) => handleSelectChange("age_range", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="年齢層を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="18-25">18-25歳</SelectItem>
            <SelectItem value="26-30">26-30歳</SelectItem>
            <SelectItem value="31-35">31-35歳</SelectItem>
            <SelectItem value="36-40">36-40歳</SelectItem>
            <SelectItem value="40+">40歳以上</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="abroad_timing" className="block text-sm font-medium text-gray-700">
          海外渡航の時期
        </label>
        <Select
          value={profile.abroad_timing || ""}
          onValueChange={(value) => handleSelectChange("abroad_timing", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="渡航時期を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asap">できるだけ早く</SelectItem>
            <SelectItem value="within_6_months">6ヶ月以内</SelectItem>
            <SelectItem value="within_1_year">1年以内</SelectItem>
            <SelectItem value="1_year_plus">1年以上先</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">必要なサポート</label>
        <div className="mt-2 space-y-2">
          {["visa", "job_search", "language_study", "accommodation", "cultural_adjustment"].map((support) => (
            <div key={support} className="flex items-center">
              <Checkbox
                id={support}
                checked={(profile.support_needed || "").includes(support)}
                onCheckedChange={(checked) => handleSupportNeededChange(support, checked)}
              />
              <label htmlFor={support} className="ml-2 text-sm text-gray-700">
                {support === "visa"
                  ? "ビザ申請サポート"
                  : support === "job_search"
                    ? "就職先の紹介"
                    : support === "language_study"
                      ? "語学学習サポート"
                      : support === "accommodation"
                        ? "住居探しサポート"
                        : "文化適応サポート"}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="current_location_id" className="block text-sm font-medium text-gray-700">
          現在の場所
        </label>
        <Select
          value={profile.current_location_id || ""}
          onValueChange={(value) => handleSelectChange("current_location_id", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="現在の場所を選択" />
          </SelectTrigger>
          <SelectContent>
            {currentLocations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="goal_location_id" className="block text-sm font-medium text-gray-700">
          目標の場所
        </label>
        <Select
          value={profile.goal_location_id || ""}
          onValueChange={(value) => handleSelectChange("goal_location_id", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="目標の場所を選択" />
          </SelectTrigger>
          <SelectContent>
            {goalLocations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.city}, {location.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="current_occupation" className="block text-sm font-medium text-gray-700">
          現在の職業
        </label>
        <Input
          type="text"
          name="current_occupation"
          id="current_occupation"
          value={profile.current_occupation || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="future_occupation" className="block text-sm font-medium text-gray-700">
          将来希望する職業
        </label>
        <Select 
          name="future_occupation" 
          value={profile.future_occupation || "none"} 
          onValueChange={(value) => handleSelectChange("future_occupation", value === "none" ? null : value)}
        >
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="選択してください">
              {profile.future_occupation ? 
                getJobPositionTitle(profile.future_occupation) || "選択してください" 
                : "選択してください"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">選択なし</SelectItem>
            {jobPositions.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "更新中..." : "プロフィールを更新"}
      </Button>
    </form>
  )
}