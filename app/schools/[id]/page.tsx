import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Layout from "@/app/components/layout"
import SchoolHeader from "./components/school-header"
import SchoolDescription from "./components/school-description"
import SchoolPhotos from "./components/school-photos"
import { SchoolCourses } from "./components/school-courses"
import { getSchool } from "@/lib/api/schools"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, GraduationCap, Clock, BookOpen, MapPin, Building, Info, Users, BarChart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCourseJobPositions } from "@/lib/supabase/queries"
import type { SchoolPhoto } from "@/types/database.types"

interface SchoolPageProps {
  params: {
    id: string
  }
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const school = await getSchool(params.id)

    if (!school) {
      notFound()
    }

    // 直接school_photosテーブルからデータを取得
    const { data: schoolPhotos, error: photosError } = await supabase
      .from("school_photos")
      .select("*")
      .eq("school_id", params.id)
      .order("created_at", { ascending: false })
    
    if (photosError) {
    } else {
    }

    // 直接コースからカテゴリー情報を取得してデバッグ
    const { data: courseCategories, error: categoriesError } = await supabase
      .from("courses")
      .select("category")
      .eq("school_id", params.id)
      .not("category", "is", null)
    
    if (categoriesError) {
    } else {
      const uniqueCategories = Array.from(new Set(courseCategories?.map((course) => course.category).filter(Boolean)))
    }

    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .eq("school_id", params.id)
      .order("name")

    if (coursesError) {
      throw coursesError
    }

    // ジョブポジションの取得
    const jobPositionsByIndustry = new Map<string, string[]>();
    
    if (courses && courses.length > 0) {
      // 各コースのジョブポジションを取得
      const jobPositionsPromises = courses.map(course => getCourseJobPositions(course.id));
      const jobPositionsResults = await Promise.all(jobPositionsPromises);
      
      // 全てのジョブポジションを業界ごとにグループ化
      jobPositionsResults.forEach(positions => {
        if (!positions) return;
        
        positions.forEach((position: any) => {
          // position.job_positionsの型を確認
          if (position && typeof position === 'object' && 'job_positions' in position) {
            const jobPosition = position.job_positions;
            
            if (jobPosition && typeof jobPosition === 'object' && 'industry' in jobPosition && 'title' in jobPosition) {
              const industry = (jobPosition.industry as string) || "その他";
              const title = jobPosition.title as string;
              
              if (!jobPositionsByIndustry.has(industry)) {
                jobPositionsByIndustry.set(industry, []);
              }
              
              const titles = jobPositionsByIndustry.get(industry);
              if (titles && !titles.includes(title)) {
                titles.push(title);
              }
            }
          }
        });
      });
    }

    // この学校のコースに対する申請数を取得
    let applicationsCount = 0
    try {
      const { data, error, count } = await supabase
        .from("course_applications")
        .select("id", { count: "exact" })
        .in("course_id", courses?.map(course => course.id) || [])
      
      if (error) {
      } else {
        applicationsCount = count || 0
      }
    } catch (error) {
    }

    // 直接取得したカテゴリー情報を使用
    const directCategories = Array.from(new Set(courses?.map(course => course.category).filter(Boolean)))

    return (
      <Layout>
        <div className="space-y-8">
          <SchoolHeader
            name={school.name}
            logo={school.logo_url}
            website={school.website}
            location={school.goal_location}
            categories={directCategories.length > 0 ? directCategories : school.categories}
            jobPositionsByIndustry={jobPositionsByIndustry}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    学校概要
                  </h2>
                  <SchoolDescription description={school.description} />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    提供コース
                  </h2>
                  <SchoolCourses courses={courses || []} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* 申請者数カード */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-base font-medium text-gray-800 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-primary" />
                    申請者数
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">現在<span className="text-primary text-lg font-bold px-1">{applicationsCount}</span>人の方がこのコースへ申し込みを行いました。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 学校の写真セクション */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-base font-medium text-gray-800 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    学校の写真
                  </h3>
                </div>
                <div className="p-0">
                  <SchoolPhotos photos={schoolPhotos || []} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  } catch (error) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">学校情報の読み込みエラー</h2>
            <p className="text-muted-foreground">学校情報の読み込み中にエラーが発生しました。後でもう一度お試しください。</p>
            <Button asChild className="mt-4">
              <Link href="/schools">学校一覧に戻る</Link>
            </Button>
          </div>
        </div>
      </Layout>
    )
  }
}

