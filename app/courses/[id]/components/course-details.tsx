import { Clock, Calendar, DollarSign, Info, Target, Briefcase, GraduationCap, Award, Handshake, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

interface CourseDetailsProps {
  description: string | null
  totalWeeks: number | null
  lectureWeeks: number | null
  workPermitWeeks: number | null
  intake_dates: IntakeDate[] | null
  tuitionAndOthers: string | null
  migrationGoals: string[] | null
  admission_requirements?: string | null
  graduation_requirements?: string | null
  job_support?: string | null
  notes?: string | null
}

export function CourseDetails({
  description,
  totalWeeks,
  lectureWeeks,
  workPermitWeeks,
  intake_dates,
  tuitionAndOthers,
  migrationGoals,
  admission_requirements,
  graduation_requirements,
  job_support,
  notes,
}: CourseDetailsProps) {
  // 渡航目的の表示名マッピング
  const goalLabels: Record<string, string> = {
    overseas_job: "海外就職",
    improve_language: "語学力向上",
    career_change: "キャリアチェンジ",
    find_new_home: "移住先探し"
  };

  // 入学日を適切にフォーマットする
  const formatIntakeDates = () => {
    if (!intake_dates || intake_dates.length === 0) return '要問合せ';
    
    // 日付をソート
    const sortedDates = [...intake_dates].sort((a, b) => {
      if (a.year !== b.year && a.year && b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      if (a.day && b.day) return a.day - b.day;
      return 0;
    });
    
    // すべての入学日を表示
    return sortedDates.map(date => {
      const yearStr = date.year ? `${date.year}年` : '';
      const monthStr = `${date.month}月`;
      const dayStr = date.day ? `${date.day}日` : '';
      return `${yearStr}${monthStr}${dayStr}`;
    }).join('、 ');
  };

  return (
    <div className="space-y-8">
      {/* コース概要 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">コース概要</h3>
        {description && (
          <div className="max-w-none bg-gray-50 p-4 rounded-md">
            {description.split("\n").map((paragraph, index) => (
              <p key={index} className="text-gray-700 mb-3 last:mb-0">{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      {/* コース詳細情報 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">コース情報</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左カラム */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">期間</p>
                  <p className="text-gray-600">
                    {totalWeeks ? `${totalWeeks}週間` : "期間未定"}
                    {lectureWeeks && ` (講義期間: ${lectureWeeks}週間)`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">開始日</p>
                  <p className="text-gray-600">{formatIntakeDates()}</p>
                </div>
              </div>
            </div>

            {/* 右カラム */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">学費</p>
                  <p className="text-gray-600">
                    {tuitionAndOthers ? `CA$${Number(tuitionAndOthers).toLocaleString()}` : "要問合せ"}
                  </p>
                </div>
              </div>

              {workPermitWeeks && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">就労許可期間</p>
                    <p className="text-gray-600">{workPermitWeeks}週間</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 渡航目的バッジを表示 */}
          {migrationGoals && migrationGoals.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">このコースの対象となる渡航目的</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {migrationGoals.map(goal => (
                      <Badge key={goal} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                        {goalLabels[goal] || goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 入学条件 */}
        {admission_requirements && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              入学条件
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-wrap">{admission_requirements}</p>
            </div>
          </div>
        )}

        {/* 卒業要件 */}
        {graduation_requirements && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              卒業要件
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-wrap">{graduation_requirements}</p>
            </div>
          </div>
        )}

        {/* 就職サポート */}
        {job_support && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
              <Handshake className="w-4 h-4 text-primary" />
              就職サポート
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-wrap">{job_support}</p>
            </div>
          </div>
        )}

        {/* 特記事項 */}
        {notes && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              特記事項
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

