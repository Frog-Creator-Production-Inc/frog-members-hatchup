import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, GraduationCap, ArrowLeft, School, Calendar, Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { School as SchoolType } from "@/types/database.types"
import { FavoriteButton } from "./favorite-button"

interface IntakeDate {
  id: string
  course_id: string
  month: number
  day?: number | null
  year?: number | null
  is_tentative: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

interface CourseHeaderProps {
  name: string
  school: SchoolType
  category: string | null
  mode: string | null
  courseId: string
  initialIsFavorite: boolean
  totalWeeks: number | null
  intake_dates: IntakeDate[] | null
  tuitionAndOthers: number | null
}

export function CourseHeader({ 
  name, 
  school, 
  category, 
  mode, 
  courseId, 
  initialIsFavorite, 
  totalWeeks, 
  intake_dates, 
  tuitionAndOthers 
}: CourseHeaderProps) {
  // 入学日を適切にフォーマットする
  const formatIntakeDates = () => {
    if (!intake_dates || intake_dates.length === 0) return '要問合せ';
    
    // すべての入学月を収集（月のみ）
    const months = new Set<number>();
    
    intake_dates.forEach(date => {
      months.add(date.month);
    });
    
    // 月を昇順（若い順）にソート
    const sortedMonths = Array.from(months).sort((a, b) => a - b);
    
    // 月表記に変換して結合
    return sortedMonths.map(month => `${month}月`).join('、 ');
  };

  // 入学月を取得
  const startMonths = formatIntakeDates();

  return (
    <div className="space-y-4">
      {/* ナビゲーションリンク */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1 pl-0 hover:pl-1 transition-all">
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4" />
            コース一覧に戻る
          </Link>
        </Button>
        
        <div className="flex items-center gap-2">
          <FavoriteButton courseId={courseId} initialIsFavorite={initialIsFavorite} />
        </div>
      </div>
      
      {/* コースヘッダーカード - 写真に依存しないデザイン */}
      <Card className="overflow-hidden border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          {/* コース名とカテゴリ */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {category && <Badge variant="default" className="bg-primary/90">{category}</Badge>}
              {mode && <Badge variant="outline" className="bg-white">{mode}</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{name}</h1>
          </div>
          
          {/* 学校情報 */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center">
              {school.logo_url ? (
                <Image
                  src={school.logo_url}
                  alt={`${school.name} logo`}
                  fill
                  className="object-contain p-1"
                />
              ) : (
                <GraduationCap className="w-6 h-6 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <Link
                href={`/schools/${school.id}`}
                className="text-base font-medium hover:text-primary transition-colors inline-block"
              >
                {school.name}
              </Link>
              
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {school.goal_location ? 
                    `${school.goal_location.city}, ${school.goal_location.country}` : 
                    "場所不明"}
                </span>
              </div>
            </div>
            
            {school.website && (
              <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                <a href={school.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">学校サイト</span>
                </a>
              </Button>
            )}
          </div>
          
          {/* カラーブロックの背景に各種情報を小さめのカードとして配置 */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* サムネイル写真（小さめ） */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col md:col-span-1">
              <div className="relative w-full h-40 bg-gray-50">
                {school.school_photos && school.school_photos.length > 0 ? (
                  <Image
                    src={school.school_photos[0].url}
                    alt={school.school_photos[0].description || `${school.name}の写真`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <School className="h-10 w-10 text-gray-300" />
                    <span className="text-sm text-gray-400 mt-2">写真がありません</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 右側のハイライト情報 */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">コース期間</h3>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{totalWeeks ? `${totalWeeks}週間` : '要問合せ'}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">開始月</h3>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{startMonths}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">コース費用</h3>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {tuitionAndOthers 
                      ? `CA$${Number(tuitionAndOthers).toLocaleString()}` 
                      : '要問合せ'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

