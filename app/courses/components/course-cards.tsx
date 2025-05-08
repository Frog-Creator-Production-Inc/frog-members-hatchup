"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, DollarSign, GraduationCap, ImageOff } from "lucide-react"

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

interface CourseCardsProps {
  courses: Course[]
}

// ランダムな要素を配列から取得する関数
function getRandomItem<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

// 画像URLを正規化する関数 - 戻り値の型を文字列のみに変更
function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // URLが相対パスで始まる場合
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // URLがhttp/httpsで始まらない場合
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
}

export default function CourseCards({ courses }: CourseCardsProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (courseId: string) => {
    setImageErrors(prev => ({ ...prev, [courseId]: true }));
    console.error(`コース ${courseId} の画像読み込みに失敗しました`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        // 学校の写真をランダムに選択
        const schoolPhotos = course.schools?.school_photos || [];
        const hasPhotos = Array.isArray(schoolPhotos) && schoolPhotos.length > 0;
        
        const randomSchoolPhoto = hasPhotos
          ? getRandomItem(schoolPhotos)
          : undefined;
          
        // 正規化した画像URL
        const rawPhotoUrl = randomSchoolPhoto?.url;
        const schoolPhotoUrl = normalizeImageUrl(rawPhotoUrl);
        const hasValidImage = !!schoolPhotoUrl && !imageErrors[course.id];

        // 開始日の表示形式を整える
        let startDateDisplay = "要問合せ";
        
        // 入学日情報から表示を生成
        if (course.intake_dates && course.intake_dates.length > 0) {
          const monthNames = [
            "1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月"
          ];
          
          // 各開始月のみを抽出して重複を排除
          const uniqueMonths = [...new Set(course.intake_dates.map(date => date.month))];
          
          // 月を昇順にソート
          uniqueMonths.sort((a, b) => a - b);
          
          // 月名に変換
          const formattedMonths = uniqueMonths.map(month => monthNames[month - 1] || `${month}月`);
          
          startDateDisplay = formattedMonths.join("、");
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
                {!hasValidImage ? (
                  // 画像がない場合や読み込みエラー時のフォールバック
                  <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">{course.name}</span>
                  </div>
                ) : (
                  <Image
                    src={schoolPhotoUrl as string}
                    alt={`${course.name}の写真`}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => handleImageError(course.id)}
                  />
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
  )
} 