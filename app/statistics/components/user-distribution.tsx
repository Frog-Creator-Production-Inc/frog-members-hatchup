"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDistributionStats, getLocations } from "@/lib/supabase/queries"
import type { Location, DistributionStats, GoalLocation } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"

// 仮のデータ
const mockLocations: GoalLocation[] = [
  { id: "1", city: "バンクーバー", country: "カナダ", region: null, created_at: "", updated_at: "" },
  { id: "2", city: "トロント", country: "カナダ", region: null, created_at: "", updated_at: "" },
  { id: "3", city: "シドニー", country: "オーストラリア", region: null, created_at: "", updated_at: "" },
  { id: "4", city: "メルボルン", country: "オーストラリア", region: null, created_at: "", updated_at: "" },
  { id: "5", city: "ロンドン", country: "イギリス", region: null, created_at: "", updated_at: "" },
]

const mockStats: DistributionStats[] = [
  { id: "1", location_id: "1", school_id: null, course_id: null, user_count: 120, last_updated: "" },
  { id: "2", location_id: "2", school_id: null, course_id: null, user_count: 85, last_updated: "" },
  { id: "3", location_id: "3", school_id: null, course_id: null, user_count: 95, last_updated: "" },
  { id: "4", location_id: "4", school_id: null, course_id: null, user_count: 70, last_updated: "" },
  { id: "5", location_id: "5", school_id: null, course_id: null, user_count: 110, last_updated: "" },
]

export default function UserDistribution() {
  const [locations, setLocations] = useState<GoalLocation[]>([])
  const [stats, setStats] = useState<DistributionStats[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // 実際のデータ取得の代わりに仮データを使用
        // const [locationsData, statsData] = await Promise.all([getLocations(), getDistributionStats()])
        setLocations(mockLocations)
        setStats(mockStats)
      } catch (error) {
        // エラーハンドリングのみ残す
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleLocationChange = async (locationId: string) => {
    setSelectedLocation(locationId)
    if (locationId !== "all") {
      // 実際のデータ取得の代わりに仮データをフィルタリング
      // const filteredStats = await getDistributionStats(locationId)
      const filteredStats = mockStats.filter(stat => stat.location_id === locationId)
      setStats(filteredStats)
    } else {
      // const allStats = await getDistributionStats()
      setStats(mockStats)
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>ユーザー分布</CardTitle>
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            サンプルデータ
          </Badge>
        </div>
        <Select value={selectedLocation} onValueChange={handleLocationChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="地域を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての地域</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.city}, {location.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] relative">
          {/* TODO: 地図やグラフの実装 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.id} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium">{locations.find((l) => l.id === stat.location_id)?.city || "不明"}</h3>
                <p className="text-2xl font-bold">{stat.user_count}</p>
                <p className="text-sm text-gray-500">ユーザー</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

