"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSchools, getCourses } from "@/lib/supabase/queries"
import type { School, Course } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"

// 仮のデータ
const mockSchools: School[] = [
  { 
    id: "1", 
    name: "バンクーバー英語学校", 
    location_id: "1", 
    website: "https://example.com", 
    description: "バンクーバーで最高の英語学校", 
    created_at: "", 
    type: null,
  },
  { 
    id: "2", 
    name: "トロント語学センター", 
    location_id: "2", 
    website: "https://example.com", 
    description: "トロントで最高の語学センター", 
    created_at: "", 
    type: null,
  },
  { 
    id: "3", 
    name: "シドニー国際学校", 
    location_id: "3", 
    website: "https://example.com", 
    description: "シドニーで最高の国際学校", 
    created_at: "", 
    type: null,
  },
]

const mockCourses: Course[] = [
  { 
    id: "1", 
    name: "ビジネス英語コース", 
    school_id: "1", 
    description: "ビジネスシーンで使える英語を学ぶ", 
    category: "ビジネス", 
    mode: "オンライン", 
    duration: "12週間", 
    cost: 450000, 
    start_date: "2023-09-01", 
    created_at: "", 
  },
  { 
    id: "2", 
    name: "一般英語コース", 
    school_id: "1", 
    description: "日常会話で使える英語を学ぶ", 
    category: "一般", 
    mode: "対面", 
    duration: "24週間", 
    cost: 850000, 
    start_date: "2023-10-01", 
    created_at: "", 
  },
  { 
    id: "3", 
    name: "IELTS対策コース", 
    school_id: "2", 
    description: "IELTSで高得点を取るための対策", 
    category: "試験対策", 
    mode: "ハイブリッド", 
    duration: "8週間", 
    cost: 350000, 
    start_date: "2023-11-01", 
    created_at: "", 
  },
]

export default function SchoolStats() {
  const [schools, setSchools] = useState<School[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // 実際のデータ取得の代わりに仮データを使用
        // const [schoolsData, coursesData] = await Promise.all([getSchools(), getCourses()])
        setSchools(mockSchools)
        setCourses(mockCourses)
      } catch (error) {
        console.error("学校データの読み込みに失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>学校別の人気度</CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              サンプルデータ
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schools.map((school) => (
              <div key={school.id} className="space-y-2">
                <h3 className="font-medium">{school.name}</h3>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.random() * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500">人気度: {Math.floor(Math.random() * 100)}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>コース別の受講者数</CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              サンプルデータ
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="space-y-2">
                <h3 className="font-medium">{course.name}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    期間: {course.duration || "不明"}
                  </p>
                  <p className="text-sm text-gray-500">
                    費用: ¥{course.cost?.toLocaleString() || "不明"}
                  </p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.random() * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500">受講者数: {Math.floor(Math.random() * 100) + 10}人</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

