"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { updateProfile, getJobPositions, updateUserFutureOccupation, getCurrentLocations, getGoalLocations } from "@/lib/supabase/queries"
import type { Profile, CurrentLocation, GoalLocation, JobPosition } from "@/types/supabase"

interface SettingsFormProps {
  user: User
  profile: Profile | null
  locations: (CurrentLocation | GoalLocation)[]
}

export default function SettingsForm({ user, profile, locations }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [currentLocations, setCurrentLocations] = useState<CurrentLocation[]>([])
  const [goalLocations, setGoalLocations] = useState<GoalLocation[]>([])
  const { toast } = useToast()

  // 職業ポジションと場所データを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positions, currLocations, goalLocs] = await Promise.all([
          getJobPositions(),
          getCurrentLocations(),
          getGoalLocations()
        ])
        setJobPositions(positions || [])
        setCurrentLocations(currLocations || [])
        setGoalLocations(goalLocs || [])
      } catch (error) {
        // エラーハンドリング
      }
    }

    fetchData()
  }, [])

  // future_occupationに対応するjob_positionを検索
  const getJobPositionTitle = (id: string | null) => {
    if (!id) return ""
    const position = jobPositions.find(pos => pos.id === id)
    return position ? position.title : ""
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const fullName = formData.get("fullName") as string
    const migrationGoal = formData.get("migrationGoal") as string
    const currentLocationId = formData.get("currentLocationId") as string
    const goalLocationId = formData.get("goalLocationId") as string
    const futureOccupation = formData.get("futureOccupation") as string

    try {
      // プロファイル情報を更新
      const { error } = await updateProfile({
        id: user.id,
        full_name: fullName,
        migration_goal: migrationGoal,
        current_location_id: currentLocationId,
        goal_location_id: goalLocationId,
      })

      if (error) throw error

      // 希望職種を更新
      await updateUserFutureOccupation(user.id, futureOccupation || null)

      toast({
        title: "プロフィールが更新されました",
        description: "設定が正常に保存されました。",
      })
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "プロフィールの更新中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>設定</CardTitle>
          <CardDescription>プロフィール情報を更新します</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="fullName">フルネーム</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : ""}
                  placeholder="山田 太郎"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="migrationGoal">移住の目標</Label>
                <Select name="migrationGoal" defaultValue={profile?.migration_goal || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overseas_job">海外就職</SelectItem>
                    <SelectItem value="improve_language">語学力向上</SelectItem>
                    <SelectItem value="career_change">キャリアチェンジ</SelectItem>
                    <SelectItem value="find_new_home">移住先探し</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="currentLocationId">現在の場所</Label>
                <Select name="currentLocationId" defaultValue={profile?.current_location_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
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
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="goalLocationId">目標の場所</Label>
                <Select name="goalLocationId" defaultValue={profile?.goal_location_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
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
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="futureOccupation">希望する職種</Label>
                <Select name="futureOccupation" defaultValue={profile?.future_occupation || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください">
                      {profile?.future_occupation && jobPositions.length > 0 ? 
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

