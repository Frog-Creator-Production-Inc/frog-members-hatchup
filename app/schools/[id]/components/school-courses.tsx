import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, DollarSign, BookOpen, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Course } from "@/types/database.types"

interface SchoolCoursesProps {
  courses: Course[]
}

export function SchoolCourses({ courses }: SchoolCoursesProps) {
  if (courses.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">現在、提供しているコースはありません。</p>
      </div>
    )
  }

  // モバイル表示用のコンポーネント
  const MobileView = () => (
    <div className="space-y-4 lg:hidden">
      {courses.map((course, index) => (
        <div 
          key={course.id}
          className={`border border-gray-200 rounded-lg overflow-hidden ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
        >
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-medium text-gray-900">{course.name}</h3>
                {course.mode && <div className="text-xs text-gray-500 mt-1">{course.mode}</div>}
              </div>
              {course.category && (
                <Badge className="bg-primary/90 whitespace-nowrap">{course.category}</Badge>
              )}
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">期間</div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-primary/70" />
                <span>{course.total_weeks ? `${course.total_weeks}週間` : "期間未定"}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">開始日</div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-primary/70" />
                <span>{course.start_date || "随時"}</span>
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500 mb-1">費用</div>
              <div className="flex items-center font-medium text-primary">
                <DollarSign className="w-4 h-4 mr-1.5 text-primary/70" />
                {course.tuition_and_others ? `CA$${Number(course.tuition_and_others).toLocaleString()}` : "要問合せ"}
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-100">
            <Button variant="outline" size="sm" asChild className="w-full inline-flex items-center justify-center">
              <Link href={`/courses/${course.id}`}>
                詳細を見る
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  // PC表示用のテーブルコンポーネント
  const DesktopView = () => (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-3 px-4 text-left font-medium text-gray-700">コース名</th>
            <th className="py-3 px-4 text-left font-medium text-gray-700">カテゴリ</th>
            <th className="py-3 px-4 text-left font-medium text-gray-700">期間</th>
            <th className="py-3 px-4 text-left font-medium text-gray-700">費用</th>
            <th className="py-3 px-4 text-center font-medium text-gray-700">詳細</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, index) => (
            <tr 
              key={course.id} 
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
            >
              <td className="py-4 px-4">
                <div className="font-medium text-gray-900">{course.name}</div>
                {course.mode && <div className="text-xs text-gray-500 mt-1">{course.mode}</div>}
              </td>
              <td className="py-4 px-4">
                {course.category ? (
                  <Badge className="bg-primary/90">{course.category}</Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                <div className="text-sm">
                  {course.total_weeks ? (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-primary/70" />
                      <span>{course.total_weeks}週間</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">期間未定</span>
                  )}
                  {course.start_date && (
                    <div className="flex items-center text-xs text-gray-500 mt-1.5">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span>開始: {course.start_date}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center text-sm font-medium text-primary">
                  <DollarSign className="w-4 h-4 mr-1 text-primary/70" />
                  {course.tuition_and_others ? `CA$${Number(course.tuition_and_others).toLocaleString()}` : "要問合せ"}
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <Button variant="outline" size="sm" asChild className="inline-flex items-center">
                  <Link href={`/courses/${course.id}`}>
                    詳細
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <MobileView />
      <DesktopView />
    </div>
  )
}

