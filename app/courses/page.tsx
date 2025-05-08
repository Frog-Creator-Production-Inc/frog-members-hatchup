import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Layout from "../components/layout"
import EnhancedCourseSearch from "./components/enhanced-course-search"
import { Card } from "@/components/ui/card"
import { Search, Compass, Filter, SortDescIcon } from "lucide-react"

export const dynamic = "force-dynamic"

// 型定義を追加
interface GoalLocation {
  id: string
  city: string
  country: string
}

interface School {
  id: string
  name: string
  logo_url?: string
  school_photos?: SchoolPhoto[]
  goal_locations?: GoalLocation
}

interface SchoolPhoto {
  id: string
  url: string
  description: string
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

interface Course {
  id: string
  name: string
  category?: string
  total_weeks?: number
  tuition_and_others?: number
  is_favorite?: boolean
  schools?: School
  intake_dates?: IntakeDate[]
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log("Starting CoursesPage function")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("Redirecting to auth page")
      redirect("/auth")
    }

    console.log("Fetching courses...")

    // Get courses with schools and locations
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        category,
        total_weeks,
        tuition_and_others,
        schools:school_id (
          id,
          name,
          logo_url,
          school_photos (
            id,
            url,
            description
          ),
          goal_locations (
            id,
            city,
            country
          )
        )
      `)
      .order("name")

    console.log("Raw courses query result:", JSON.stringify({
      courses_count: coursesData?.length || 0,
      error: coursesError ? true : false,
      errorMessage: coursesError?.message
    }, null, 2))

    if (coursesError) {
      throw new Error(`コースデータの取得エラー: ${coursesError.message}`)
    }
    
    // コースの入学日情報を取得
    const { data: intakeDatesData, error: intakeDatesError } = await supabase
      .from("course_intake_dates")
      .select("*")
      .in("course_id", (coursesData || []).map(course => course.id))
      .order("year", { ascending: true, nullsFirst: true })
      .order("month", { ascending: true })
      .order("day", { ascending: true, nullsFirst: true })
      
    if (intakeDatesError) {
      console.error("Error fetching intake dates:", intakeDatesError)
      throw new Error(`入学日データの取得エラー: ${intakeDatesError.message}`)
    }
    
    // 入学日情報をコースIDでグループ化
    const intakeDatesByCourse = new Map()
    if (intakeDatesData) {
      intakeDatesData.forEach(date => {
        if (!intakeDatesByCourse.has(date.course_id)) {
          intakeDatesByCourse.set(date.course_id, [])
        }
        intakeDatesByCourse.get(date.course_id).push(date)
      })
    }

    // 各コースに対するコース専用の写真を取得
    console.log('Fetching course-specific photos...')
    const { data: coursePhotos, error: coursePhotosError } = await supabase
      .from("school_photos")
      .select("id, url, description, course_id")
      .not("course_id", "is", null)

    if (coursePhotosError) {
      console.error("Error fetching course photos:", coursePhotosError)
    }

    // 写真をコースのIDごとにマッピング
    const coursePhotoMap = new Map()
    if (coursePhotos) {
      coursePhotos.forEach(photo => {
        if (!coursePhotoMap.has(photo.course_id)) {
          coursePhotoMap.set(photo.course_id, [])
        }
        coursePhotoMap.get(photo.course_id).push(photo)
      })
    }

    console.log("Raw courses data from Supabase:", JSON.stringify(coursesData, null, 2))
    console.log("Number of courses fetched:", coursesData?.length)

    // Get favorite course IDs for the user
    const { data: favorites, error: favoritesError } = await supabase
      .from("favorite_courses")
      .select("course_id")
      .eq("user_id", user.id)

    if (favoritesError) {
      console.error("Error fetching favorites:", favoritesError)
      throw favoritesError
    }

    const favoriteCourseIds = favorites?.map(f => f.course_id) || []
    console.log("Favorite course IDs:", favoriteCourseIds)

    // コースにコース専用の写真があればそれを使用する
    const coursesWithFavorites: Course[] = (coursesData || []).map(course => {
      // schoolsが配列の場合は最初の要素を取得
      const schoolData = Array.isArray(course.schools) ? course.schools[0] : course.schools
      
      // デバッグ情報: 各コースの生データ
      console.log(`Course processing for ${course.name}:`, {
        id: course.id,
        name: course.name,
        category: course.category,
        school_info: schoolData?.id,
        tuition_raw: course.tuition_and_others,
        tuition_type: typeof course.tuition_and_others
      });
      
      // goal_locationsが配列の場合は最初の要素を取得
      let goalLocation = undefined
      if (schoolData && schoolData.goal_locations) {
        goalLocation = Array.isArray(schoolData.goal_locations) 
          ? schoolData.goal_locations[0] 
          : schoolData.goal_locations
      }
      
      // コース専用の写真があればそれを使用し、なければスクールの写真を使う
      let schoolPhotos = schoolData?.school_photos || []
      const courseSpecificPhotos = coursePhotoMap.get(course.id) || []
      
      if (courseSpecificPhotos.length > 0) {
        // コース専用の写真があればそれを使用
        schoolPhotos = courseSpecificPhotos
        console.log(`Using course-specific photos for course ${course.id}: ${courseSpecificPhotos.length} photos`)
      }
      
      // 入学日情報を取得
      const courseDates = intakeDatesByCourse.get(course.id) || []
      
      // 正規化されたスクールオブジェクト
      const normalizedSchool: School | undefined = schoolData ? {
        id: schoolData.id || '',
        name: schoolData.name || '',
        logo_url: schoolData.logo_url,
        school_photos: schoolPhotos,
        goal_locations: goalLocation
      } : undefined
      
      return {
        id: course.id || '',
        name: course.name || '',
        category: course.category,
        total_weeks: course.total_weeks,
        tuition_and_others: course.tuition_and_others,
        is_favorite: favoriteCourseIds.includes(course.id),
        schools: normalizedSchool,
        intake_dates: courseDates
      }
    })

    console.log("Final processed courses:", JSON.stringify(coursesWithFavorites, null, 2))
    console.log("Number of processed courses:", coursesWithFavorites.length)

    // コースからユニークなカテゴリーを抽出
    const categories: string[] = Array.from(
      new Set(
        coursesWithFavorites
          .map((course) => course.category)
          .filter((category): category is string => category !== undefined)
      )
    );

    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ヘッダーセクション */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">コースを探す</h1>
            </div>
            <p className="text-muted-foreground mb-4">
              あなたの目標に合ったコースを見つけましょう。カテゴリーや地域、期間や費用でフィルタリングして、最適なコースを探すことができます。
            </p>
          </div>

          {/* 拡張コース検索セクション */}
          <EnhancedCourseSearch
            userId={user.id}
            selectedCategory={searchParams.category}
            initialCourses={coursesWithFavorites}
            favoriteCourseIds={favoriteCourseIds}
            categories={categories}
          />
        </div>
      </Layout>
    )
  } catch (error) {
    console.error("Error in CoursesPage:", error)
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <Search className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">コースの読み込みエラー</h2>
            <p className="text-muted-foreground">コースの読み込み中にエラーが発生しました。後でもう一度お試しください。</p>
          </div>
        </div>
      </Layout>
    )
  }
}