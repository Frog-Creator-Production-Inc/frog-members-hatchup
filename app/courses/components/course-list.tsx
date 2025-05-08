"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, DollarSign, GraduationCap, ImageOff, ExternalLink } from "lucide-react"

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
  tuition_and_others?: number
  is_favorite?: boolean
  intake_dates?: IntakeDate[]
}

interface IntakeDate {
  id: string
  course_id: string
  month: number
  day?: number | null
  year?: number | null
  is_tentative: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

interface CourseListProps {
  courses: Course[]
}

export default function CourseList({ courses }: CourseListProps) {
  // 入学日表示用フォーマット関数
  const formatIntakeDates = (intakeDates?: IntakeDate[]) => {
    if (!intakeDates || intakeDates.length === 0) {
      return "要問合せ"
    }
    
    // 月のみのフォーマット
    const monthNames = [
      "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月"
    ]
    
    // 各月を抽出して重複を排除
    const uniqueMonths = [...new Set(intakeDates.map(date => date.month))];
    
    // 月を昇順にソート
    uniqueMonths.sort((a, b) => a - b);
    
    // 月名に変換
    const formattedMonths = uniqueMonths.map(month => monthNames[month - 1] || `${month}月`);
    
    return formattedMonths.join("、");
  }

  return (
    <div className="flex flex-col gap-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col md:flex-row">
            {/* スクール写真（モバイルでは上、デスクトップでは左） */}
            <div className="md:w-1/4 h-40 md:h-auto relative bg-gray-100">
              {course.schools?.school_photos && course.schools.school_photos.length > 0 ? (
                <Image
                  src={course.schools.school_photos[0].url}
                  alt={course.schools.school_photos[0].description || `${course.schools?.name || "スクール"} の写真`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ImageOff className="h-8 w-8 mb-2" />
                  <p>画像はありません</p>
                </div>
              )}
              
              {/* カテゴリーバッジ - 写真の上に表示 */}
              {course.category && (
                <div className="absolute top-3 left-3">
                  <Badge variant="default" className="bg-primary/90">{course.category}</Badge>
                </div>
              )}
            </div>

            {/* コース情報 */}
            <div className="flex-1 p-4 md:p-6 flex flex-col">
              <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-medium">{course.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center">
                      <div className="w-4 h-4 relative mr-1">
                        {course.schools?.logo_url ? (
                          <Image
                            src={course.schools.logo_url}
                            alt={`${course.schools.name} logo`}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        ) : (
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <Link
                        href={`/schools/${course.schools?.id}`}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {course.schools?.name}
                      </Link>
                    </div>
                    {course.schools?.goal_locations && (
                      <>
                        <span className="mx-1">•</span>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>
                            {course.schools.goal_locations.city}, {course.schools.goal_locations.country}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-end justify-end gap-2 md:gap-0">
                  {course.tuition_and_others ? (
                    <div className="text-xl font-semibold text-primary">CA${course.tuition_and_others.toLocaleString()}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">価格要問合せ</div>
                  )}
                  {course.total_weeks && (
                    <div className="text-sm text-muted-foreground">{course.total_weeks}週間</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>{course.total_weeks ? `${course.total_weeks}週間` : "期間不明"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>開始月: {formatIntakeDates(course.intake_dates)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>
                    {course.tuition_and_others ? `CA$${course.tuition_and_others.toLocaleString()}` : "要問合せ"}
                  </span>
                </div>
              </div>

              <div className="mt-auto">
                <Button asChild className="w-full md:w-auto">
                  <Link href={`/courses/${course.id}`} className="flex items-center">
                    詳細を見る
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

