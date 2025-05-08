import { notFound } from "next/navigation"
import { CourseHeader } from "./course-header"
import { CourseDetails } from "./course-details"
import { CourseSubjects } from "./course-subjects"
import { CourseJobPositions } from "./course-job-positions"
import { FavoriteButton } from "./favorite-button"
import { CourseApplicationButton } from "./course-application-button"
import { RelatedBlogPosts } from "./related-blog-posts"
import { SchoolPhotos } from "./school-photos"
import { getCourseData } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, AlertCircle, BookOpen, MapPin, CalendarDays, Info, Briefcase } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import CourseApplyButton from "@/components/CourseApplyButton"

interface CourseContentProps {
  courseId: string
}

export async function CourseContent({ courseId }: CourseContentProps) {
  try {
    const data = await getCourseData(courseId)
    
    if (!data) {
      notFound()
    }

    const { course, subjects, jobPositions, isFavorite, user } = data

    // courseとschools情報を安全に取得
    let school: any = {};
    if (course.schools && Array.isArray(course.schools) && course.schools.length > 0) {
      // schoolsが存在する場合
      const schoolData = course.schools[0];
      school = {
        id: schoolData.id,
        name: schoolData.name,
        logo_url: schoolData.logo_url,
        website: schoolData.website,
        location_id: schoolData.location_id,
        description: '', // 型エラー対策
        created_at: '', // 型エラー対策
        updated_at: '', // 型エラー対策
        categories: [], // 型エラー対策
        school_photos: schoolData.school_photos || [],
      };

      // goal_locationを適切に処理
      if (schoolData.goal_location) {
        if (Array.isArray(schoolData.goal_location)) {
          school.goal_location = schoolData.goal_location[0] || null;
        } else {
          school.goal_location = schoolData.goal_location;
        }
      }
    } else {
      console.warn('School data is missing or invalid');
      // 最低限必要なプロパティを設定
      school = {
        id: '',
        name: 'School information unavailable',
        logo_url: null,
        website: null,
        location_id: null,
        description: '',
        created_at: '',
        updated_at: '',
        categories: [],
        school_photos: [],
        goal_location: null
      };
    }

    return (
      <div className="space-y-8 pb-16">
        <div className="bg-gradient-to-b from-white to-gray-50 pt-6 pb-8 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <CourseHeader
              name={course.name}
              school={school}
              category={course.category}
              courseId={course.id}
              initialIsFavorite={isFavorite}
              totalWeeks={course.total_weeks}
              intake_dates={course.intake_dates}
              tuitionAndOthers={course.tuition_and_others}
              mode={null}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* コース詳細 */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                      <Info className="w-6 h-6 text-primary" />
                    </div>
                    コース詳細
                  </h2>
                  <CourseDetails
                    description={course.description}
                    totalWeeks={course.total_weeks}
                    lectureWeeks={course.lecture_weeks}
                    workPermitWeeks={course.work_permit_weeks}
                    intake_dates={course.intake_dates}
                    tuitionAndOthers={course.tuition_and_others}
                    migrationGoals={course.migration_goals}
                    admission_requirements={course.admission_requirements}
                    graduation_requirements={course.graduation_requirements}
                    job_support={course.job_support}
                    notes={course.notes}
                  />
                </div>
              </div>

              {/* コースの科目 */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    科目リスト
                  </h2>
                  <CourseSubjects subjects={subjects} />
                </div>
              </div>
              
              {/* 関連する職業ポジション */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    対象職種
                  </h2>
                  <CourseJobPositions jobPositions={jobPositions} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* アクションカード */}
              <div className="sticky top-6 z-[70]">
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-base font-medium text-gray-800 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-primary" />
                      コース申請情報
                    </h3>
                  </div>
                  <div className="p-0">
                    <CourseApplyButton 
                      courseId={course.id} 
                      courseName={course.name} 
                    />
                    
                    <div className="p-4 border-t border-gray-100">
                      <Button 
                        asChild 
                        variant="outline" 
                        className="w-full flex items-center justify-center border-gray-200 text-gray-700"
                      >
                        <Link href="/contact">
                          <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                          コースについて問い合わせ
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 学校情報 */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-base font-medium text-gray-800 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    学校情報
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    {school.logo_url && (
                      <img 
                        src={school.logo_url} 
                        alt={school.name} 
                        className="h-12 w-12 object-contain mr-3"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{school.name}</h4>
                      {school.location_id && (
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {school.goal_location && 
                            `${school.goal_location.city}, ${school.goal_location.country}`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {school.website && (
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full mt-2 text-sm h-9 border-gray-200"
                    >
                      <Link href={school.website} target="_blank" rel="noopener noreferrer">
                        ウェブサイトを訪問
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* 関連記事 */}
              <RelatedBlogPosts schoolName={school.name} />

              {/* 学校の写真セクション */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-base font-medium text-gray-800 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    学校の写真
                  </h3>
                </div>
                <SchoolPhotos 
                  schoolName={school.name} 
                  photos={school.school_photos} 
                  className="relative z-[40]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in CourseContent:", error)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-100">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">コース情報の読み込みエラー</h2>
            <p className="text-muted-foreground">コース情報の読み込み中にエラーが発生しました。後でもう一度お試しください。</p>
            <Button asChild className="mt-6">
              <Link href="/courses">コース一覧に戻る</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}