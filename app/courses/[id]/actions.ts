import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getCourseJobPositions } from "@/lib/supabase/queries"

export async function getCourseData(courseId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // ユーザー情報を取得
    const { data: { user } } = await supabase.auth.getUser()

    // コース情報を取得
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        category,
        description,
        total_weeks,
        lecture_weeks,
        tuition_and_others,
        work_permit_weeks,
        school_id,
        migration_goals,
        admission_requirements,
        graduation_requirements,
        job_support,
        notes,
        schools (
          id,
          name,
          logo_url,
          website,
          location_id,
          school_photos (
            id,
            url,
            description
          ),
          goal_location:location_id (
            id,
            city,
            country
          )
        )
      `)
      .eq("id", courseId)
      .single()

    if (courseError) throw courseError

    // schoolsが存在しない場合はschool_idを使って取得
    if (!course.schools || !Array.isArray(course.schools) || course.schools.length === 0) {
      if (course.school_id) {
        console.log(`Fetching school data for school_id ${course.school_id}`)
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select(`
            id,
            name,
            logo_url,
            website,
            location_id,
            school_photos (
              id,
              url,
              description
            ),
            goal_location:location_id (
              id,
              city,
              country
            )
          `)
          .eq('id', course.school_id)
          .single()

        if (!schoolError && schoolData) {
          // schoolsを配列として設定
          course.schools = [schoolData]
        } else {
          console.warn(`Failed to fetch school data for school_id ${course.school_id}:`, schoolError)
          // 最小限の学校情報を設定
          course.schools = [{
            id: course.school_id,
            name: "School information not available",
            logo_url: null,
            website: null,
            location_id: null,
            school_photos: [],
            goal_location: []
          }]
        }
      } else {
        // school_idもない場合
        console.warn(`Course ${courseId} has no school_id`)
        course.schools = [{
          id: "unknown",
          name: "School information not available",
          logo_url: null,
          website: null,
          location_id: null,
          school_photos: [],
          goal_location: []
        }]
      }
    }

    // コース専用の写真を取得
    try {
      // 写真取得のクエリをより堅牢に
      const { data: coursePhotos, error: coursePhotosError } = await supabase
        .from("school_photos")
        .select("id, url, description")
        .eq("course_id", courseId)
        .not("course_id", "is", null);

      if (coursePhotosError) {
        console.error("コース写真取得エラー: 標準クエリ:", coursePhotosError);
        
        // 代替方法を試す
        try {
          // 単純なSQL文字列で直接クエリ
          const { data: rawPhotos, error: rawError } = await supabase
            .from('school_photos')
            .select('id, url, description, course_id');
          
          if (!rawError && rawPhotos) {
            const filteredPhotos = rawPhotos.filter(photo => 
              photo.course_id === courseId);
              
            if (filteredPhotos.length > 0 && course.schools && Array.isArray(course.schools) && course.schools.length > 0) {
              course.schools[0].school_photos = filteredPhotos;
              console.log(`コース専用の写真を代替方法で取得: ${filteredPhotos.length}枚`);
            }
          } else if (rawError) {
            console.error("コース写真取得エラー: 代替クエリ:", rawError);
          }
        } catch (fallbackError) {
          console.error("コース写真取得中の例外:", fallbackError);
        }
      } else if (coursePhotos && coursePhotos.length > 0) {
        // コース専用の写真があれば、それを学校の写真の代わりに使用
        console.log(`コース専用の写真を取得: ${coursePhotos.length}枚`);
        
        // course.schoolsが配列であることと、要素が存在することを確認
        if (course.schools && Array.isArray(course.schools) && course.schools.length > 0) {
          course.schools[0].school_photos = coursePhotos;
        } else {
          console.warn(`写真設定不可: course.schoolsが配列でないか空 (コースID: ${courseId})`);
        }
      }
    } catch (photosError) {
      console.error("コース写真取得中の例外:", photosError);
      // 写真取得エラーはコース表示には致命的ではないので処理を続行
    }

    // コース入学日を取得
    const { data: intake_dates, error: intakeDatesError } = await supabase
      .from("course_intake_dates")
      .select("*")
      .eq("course_id", courseId)
      .order("year", { ascending: true, nullsFirst: true })
      .order("month", { ascending: true })
      .order("day", { ascending: true, nullsFirst: true })

    if (intakeDatesError) {
      console.error("Error fetching intake dates:", intakeDatesError)
    }

    // コースの科目を取得
    const { data: subjects, error: subjectsError } = await supabase
      .from("course_subjects")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at")

    if (subjectsError) throw subjectsError

    // コースに関連する職業ポジションを取得
    const jobPositions = await getCourseJobPositions(courseId)

    // お気に入り状態を確認
    let isFavorite = false
    if (user) {
      const { data: favorite, error: favoriteError } = await supabase
        .from("favorite_courses")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle()

      if (!favoriteError) {
        isFavorite = !!favorite
      }
    }

    return {
      course: { ...course, intake_dates: intake_dates || [] },
      subjects: subjects || [],
      jobPositions: jobPositions || [],
      isFavorite,
      user
    }
  } catch (error) {
    console.error("Error in getCourseData:", error)
    throw error
  }
}
