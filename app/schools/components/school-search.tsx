"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, GraduationCap, Clock } from "lucide-react"
import { getSchools, getCourses, getGoalLocations, updateUserSelection } from "@/lib/supabase/queries"
import type { School, Course, GoalLocation } from "@/types/supabase"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface SchoolSearchProps {
  userId: string
  selectedCategory?: string
}

export default function SchoolSearch({ userId, selectedCategory }: SchoolSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [schools, setSchools] = useState<School[]>([])
  const [locations, setLocations] = useState<GoalLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [schoolsData, locationsData] = await Promise.all([getSchools(), getGoalLocations()])
        setSchools(schoolsData)
        setLocations(locationsData)
      } catch (error) {
        console.error("データの読み込みに失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const handleLocationChange = async (locationId: string) => {
    setSelectedLocation(locationId)
    try {
      const filteredSchools = await getSchools(locationId)
      setSchools(filteredSchools)
    } catch (error) {
      console.error("学校データの取得に失敗しました:", error)
    }
  }

  const handleSaveSchool = async (schoolId: string) => {
    try {
      await updateUserSelection(userId, {
        school_id: schoolId,
        created_at: new Date().toISOString(),
      })
      // TODO: 保存成功のフィードバックを表示
    } catch (error) {
      console.error("学校の保存に失敗しました:", error)
    }
  }

  const filteredSchools = schools
    .filter((school) => school.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((school) => !selectedCategory || (school.categories && school.categories.includes(selectedCategory)))

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="学校名で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedLocation} onValueChange={handleLocationChange}>
          <SelectTrigger>
            <SelectValue placeholder="地域で絞り込む" />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => (
          <Card key={school.id} className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{school.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    {school.goal_location?.city || "不明"}, {school.goal_location?.country || "不明"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {school.categories?.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/schools/${school.id}`}>詳細を見る</Link>
                  </Button>
                  <Button onClick={() => handleSaveSchool(school.id)} className="w-full">
                    この学校を保存
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

