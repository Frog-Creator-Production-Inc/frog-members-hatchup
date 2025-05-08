"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Map, Clock, Calendar, DollarSign, Calendar as CalendarIcon, CalendarClock } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"

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

interface Course {
  id: string
  name: string
  category?: string
  total_weeks?: number
  tuition_and_others?: number | null
  is_favorite?: boolean
  schools?: {
    id: string
    name: string
    logo_url?: string
    school_photos?: {
      id: string
      url: string
      description: string
    }[]
    goal_locations?: {
      id: string
      city: string
      country: string
    }
  }
  intake_dates?: IntakeDate[]
}

interface CourseCardProps {
  course: Course
  userId: string
  onFavoriteChange?: (courseId: string, isFavorite: boolean) => void
}

export function CourseCard({ course, userId, onFavoriteChange }: CourseCardProps) {
  const [isFavorite, setIsFavorite] = useState(course.is_favorite || false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  // お気に入り状態の切り替え
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      if (isFavorite) {
        // お気に入りから削除
        const { error } = await supabase
          .from('favorite_courses')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', course.id)
        
        if (error) throw error
        
        setIsFavorite(false)
        toast.success('お気に入りから削除しました')
      } else {
        // お気に入りに追加
        const { error } = await supabase
          .from('favorite_courses')
          .insert([
            { user_id: userId, course_id: course.id }
          ])
        
        if (error) throw error
        
        setIsFavorite(true)
        toast.success('お気に入りに追加しました')
      }
      
      // 親コンポーネントに変更を通知
      if (onFavoriteChange) {
        onFavoriteChange(course.id, !isFavorite)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  // コース画像のURLを取得
  const getImageUrl = () => {
    // コース専用の写真があればそれを使用
    if (course.schools?.school_photos && course.schools.school_photos.length > 0) {
      return course.schools.school_photos[0].url
    }
    
    // デフォルト画像を使用
    return "/placeholder-course.jpg"
  }

  // 学校の場所を取得
  const getLocation = () => {
    if (course.schools?.goal_locations) {
      return `${course.schools.goal_locations.city}, ${course.schools.goal_locations.country}`
    }
    return null
  }

  // 入学日表示用フォーマット
  const formatIntakeDates = () => {
    if (!course.intake_dates || course.intake_dates.length === 0) {
      return "要問合せ"
    }
    
    // 月のみのフォーマット
    const monthNames = [
      "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月"
    ]
    
    // すべての入学日を表示する
    const formattedDates = course.intake_dates.map(date => {
      const monthStr = monthNames[date.month - 1] || `${date.month}月`
      
      if (date.year) {
        if (date.day) {
          return `${date.year}年${monthStr}${date.day}日`
        }
        return `${date.year}年${monthStr}`
      }
      
      return monthStr
    })
    
    return formattedDates.join("、")
  }

  return (
    <div className="group">
      <Link href={`/courses/${course.id}`}>
        <Card className="overflow-hidden h-full border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="aspect-video relative overflow-hidden bg-muted">
            <Image
              src={getImageUrl()}
              alt={course.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            
            <button
              onClick={toggleFavorite}
              className={cn(
                "absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm",
                "bg-white/80 hover:bg-white transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
              disabled={isLoading}
            >
              <Heart 
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                )} 
              />
            </button>
          </div>
          
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {course.category && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {course.category}
                  </Badge>
                )}
                
                {course.schools && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-4 h-4 relative rounded-full overflow-hidden bg-muted">
                      {course.schools.logo_url && (
                        <Image
                          src={course.schools.logo_url}
                          alt={course.schools.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <span className="truncate max-w-[120px]">{course.schools.name}</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
                {course.name}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {getLocation() && (
                <div className="flex items-center text-muted-foreground">
                  <Map className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  <span className="truncate">{getLocation()}</span>
                </div>
              )}
              
              {course.total_weeks && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  <span>{course.total_weeks}週間</span>
                </div>
              )}
              
              <div className="flex items-center text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span className="truncate">{formatIntakeDates()}</span>
              </div>
              
              {course.tuition_and_others && (
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  <span>CA${course.tuition_and_others.toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            <Button size="sm" className="w-full" variant="default">
              詳細を見る
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  )
} 