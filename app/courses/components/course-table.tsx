"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { MapPin, Clock, Calendar, DollarSign, GraduationCap, ExternalLink } from "lucide-react"

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

interface CourseTableProps {
  courses: Course[]
}

export default function CourseTable({ courses }: CourseTableProps) {
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
    <div className="rounded-md border overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">コース</TableHead>
            <TableHead>学校</TableHead>
            <TableHead>地域</TableHead>
            <TableHead>期間</TableHead>
            <TableHead>開始月</TableHead>
            <TableHead>費用</TableHead>
            <TableHead className="text-right">詳細</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                <div className="flex items-start gap-2">
                  {course.category && (
                    <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 whitespace-nowrap">
                      {course.category}
                    </Badge>
                  )}
                  <span>{course.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 relative flex-shrink-0">
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
                        <GraduationCap className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/schools/${course.schools?.id}`}
                    className="text-sm hover:text-primary hover:underline transition-colors"
                  >
                    {course.schools?.name}
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                {course.schools?.goal_locations && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                    <span className="truncate max-w-[120px]">
                      {course.schools.goal_locations.city}, {course.schools.goal_locations.country}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm">
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{course.total_weeks ? `${course.total_weeks}週間` : "不明"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{formatIntakeDates(course.intake_dates)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm font-medium">
                  <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                  <span>
                    {course.tuition_and_others 
                      ? `CA$${course.tuition_and_others.toLocaleString()}` 
                      : "要問合せ"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/courses/${course.id}`} className="flex items-center">
                    詳細
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 