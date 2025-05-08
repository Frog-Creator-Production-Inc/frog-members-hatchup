"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Clock, Calendar, DollarSign, GraduationCap, School, ImageOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getGoalLocations } from "@/lib/supabase/queries"
import type { GoalLocation } from "@/types/supabase"
import Link from "next/link"
import Image from "next/image"

interface SchoolPhoto {
  id: string
  url: string
  description: string
}

interface Course {
  id: string
  name: string
  category?: string
  schools?: {
    id: string
    name: string
    logo_url?: string
    school_photos?: SchoolPhoto[]
    goal_locations?: {
      id: string
      city: string
      country: string
    }
  }
  total_weeks?: number
  start_date?: string
  tuition_and_others?: number
}

interface CourseSearchProps {
  userId: string
  selectedCategory?: string
  initialCourses: Course[]
  favoriteCourseIds: string[]
}

// ランダムな要素を配列から取得する関数
function getRandomItem<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export default function CourseSearch({
  userId,
  selectedCategory,
  initialCourses,
  favoriteCourseIds = [],
}: CourseSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [locations, setLocations] = useState<GoalLocation[]>([])
  const [loading, setLoading] = useState(true)

  // デバッグ用ログ
  useEffect(() => {
    console.log("Initial courses:", initialCourses);
    initialCourses.forEach(course => {
      if (course.schools && course.schools.school_photos) {
        console.log(`Course ${course.name} has ${course.schools.school_photos.length} photos`);
      } else {
        console.log(`Course ${course.name} has no photos`);
      }
    });
  }, [initialCourses]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true)
        const locationsData = await getGoalLocations()
        setLocations(locationsData)
      } catch (error) {
        console.error("ロケーションデータの読み込みに失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [])

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId)
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.schools?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.schools?.goal_locations?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.schools?.goal_locations?.country.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !selectedCategory || course.category === selectedCategory

    const matchesLocation =
      !selectedLocation ||
      selectedLocation === "all" ||
      course.schools?.goal_locations?.id === selectedLocation

    return matchesSearch && matchesCategory && matchesLocation
  })

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 検索フィルター */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="コース名、学校名、または地域で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
          <Select value={selectedLocation} onValueChange={handleLocationChange}>
            <SelectTrigger className="bg-gray-50 border-gray-200">
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
      </div>

      {/* コース一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          // 学校の写真をランダムに選択
          console.log(`Rendering course: ${course.name}`);
          console.log(`School data:`, course.schools);
          
          const hasPhotos = course.schools?.school_photos && Array.isArray(course.schools.school_photos) && course.schools.school_photos.length > 0;
          console.log(`Has photos: ${hasPhotos}`);
          
          const randomSchoolPhoto = hasPhotos
            ? getRandomItem(course.schools.school_photos)
            : undefined;
            
          console.log(`Random photo:`, randomSchoolPhoto);
          
          return (
            <Card key={course.id} className="h-full transition-shadow hover:shadow-md overflow-hidden">
              {/* スクール写真 */}
              <div className="relative w-full h-48 bg-gray-100">
                {randomSchoolPhoto ? (
                  <>
                    <Image
                      src={randomSchoolPhoto.url}
                      alt={randomSchoolPhoto.description || `${course.schools?.name || "スクール"} の写真`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {/* 半透明オーバーレイ */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageOff className="h-8 w-8 mb-2" />
                    <p>画像はありません</p>
                  </div>
                )}
                
                {/* カテゴリーバッジ - 写真の上に表示 */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {course.category && <Badge variant="default" className="bg-primary/90">{course.category}</Badge>}
                </div>
                
                {/* コース名と場所 - 写真の下部に表示 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="text-lg font-medium truncate">{course.name}</h3>
                  <div className="flex items-center text-sm mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span className="truncate">
                      {course.schools?.goal_locations?.city || "不明"}, {course.schools?.goal_locations?.country || "不明"}
                    </span>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 relative flex-shrink-0">
                    {course.schools?.logo_url ? (
                      <Image
                        src={course.schools.logo_url}
                        alt={`${course.schools.name} logo`}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-sm flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/schools/${course.schools?.id}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block"
                  >
                    {course.schools?.name}
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-6">
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>{course.total_weeks ? `${course.total_weeks}週間` : "期間不明"}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>{course.start_date || "随時"}</span>
                  </div>
                  <div className="flex items-center text-gray-500 col-span-2">
                    <DollarSign className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>
                      {course.tuition_and_others ? `CA$${course.tuition_and_others.toLocaleString()}` : "要問合せ"}
                    </span>
                  </div>
                </div>
                
                <Button asChild className="w-full mt-auto">
                  <Link href={`/courses/${course.id}`}>詳細を見る</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* 検索結果がない場合 */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">検索条件に一致するコースが見つかりませんでした。</p>
        </div>
      )}
    </div>
  )
}