"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { getFavoriteCourses, toggleFavoriteCourse } from "@/lib/api/courses"
import { toast } from "react-hot-toast"

interface FavoriteCoursesProps {
  userId: string
}

interface IntakeDate {
  id: string
  course_id: string
  month: number
  day?: number | null
  year?: number | null
  is_tentative: boolean
}

export function FavoriteCourses({ userId }: FavoriteCoursesProps) {
  const [favoriteCourses, setFavoriteCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadFavoriteCourses = async () => {
      try {
        setLoading(true)
        const courses = await getFavoriteCourses(userId)
        setFavoriteCourses(courses)
      } catch (error) {
        toast.error("お気に入りコースの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadFavoriteCourses()
  }, [userId])

  const handleFavoriteToggle = async (courseId: string) => {
    try {
      await toggleFavoriteCourse(userId, courseId)
      setFavoriteCourses(favoriteCourses.filter((course) => course.id !== courseId))
      toast.success("お気に入りから削除しました")
    } catch (error) {
      toast.error("お気に入りの削除に失敗しました")
    }
  }

  const handleImageError = (courseId: string) => {
    setImageErrors(prev => ({ ...prev, [courseId]: true }))
  }

  // 画像URLを正規化する関数
  const normalizeImageUrl = (url: string | undefined) => {
    if (!url) return null
    
    // URLが相対パスで始まる場合
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    
    // URLがhttp/httpsで始まらない場合
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    
    return url
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="w-full">
      {favoriteCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだお気に入りのコースがありません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteCourses.map((course) => {
            // 開始日の表示形式を整える
            let startDateDisplay = "要問合せ";
            
            // 入学日情報から表示を生成
            if (course.intake_dates && course.intake_dates.length > 0) {
              // すべての入学月を収集（月のみ）
              const months = new Set<number>();
              
              course.intake_dates.forEach((date: any) => {
                months.add(date.month);
              });
              
              // 月を昇順（若い順）にソート
              const sortedMonths = Array.from(months).sort((a, b) => a - b);
              
              // 月表記に変換して結合
              startDateDisplay = sortedMonths.map(month => `${month}月`).join('、 ');
            }
            
            return (
              <div key={course.id} className="plan">
                <div className="inner">
                  <span className="pricing">
                    <span>
                      {course.tuition_and_others ? `CA$${course.tuition_and_others.toLocaleString()}` : "要問合せ"}
                      <small>/ total</small>
                    </span>
                  </span>
                  
                  <div className="course-image">
                    {imageErrors[course.id] ? (
                      // エラー時のフォールバック表示（画像なし）
                      <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">{course.name}</span>
                      </div>
                    ) : (
                      (() => {
                        // スクールの写真またはフォールバックデザイン
                        const schoolPhotos = course.schools?.school_photos || [];
                        const rawPhotoUrl = schoolPhotos.length > 0 ? schoolPhotos[0].url : null;
                        const schoolPhotoUrl = normalizeImageUrl(rawPhotoUrl);
                        
                        if (schoolPhotoUrl) {
                          return (
                            <Image
                              src={schoolPhotoUrl}
                              alt={`${course.name}の写真`}
                              fill
                              unoptimized
                              className="object-cover"
                              onError={() => handleImageError(course.id)}
                            />
                          );
                        } else {
                          // 画像URLがない場合はフォールバックデザインを表示
                          return (
                            <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">{course.name}</span>
                            </div>
                          );
                        }
                      })()
                    )}
                  </div>
                  
                  <p className="title">{course.name}</p>
                  <p className="info">{course.schools?.name || "スクール名"} - {course.schools?.goal_locations?.city || "不明"}, {course.schools?.goal_locations?.country || "不明"}</p>
                  <ul className="features">
                    <li>
                      <span className="icon">
                        <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 0h24v24H0z" fill="none"></path>
                          <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                        </svg>
                      </span>
                      <span>開始月: <strong>{startDateDisplay}</strong></span>
                    </li>
                    <li>
                      <span className="icon">
                        <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 0h24v24H0z" fill="none"></path>
                          <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                        </svg>
                      </span>
                      <span>期間: <strong>{course.total_weeks ? `${course.total_weeks}週間` : "要問合せ"}</strong></span>
                    </li>
                    <li>
                      <span className="icon">
                        <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 0h24v24H0z" fill="none"></path>
                          <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                        </svg>
                      </span>
                      <span>カテゴリー: <strong>{course.category || "一般"}</strong></span>
                    </li>
                  </ul>
                  <div className="action">
                    <Link href={`/courses/${course.id}`} className="button">
                      詳細を見る
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}