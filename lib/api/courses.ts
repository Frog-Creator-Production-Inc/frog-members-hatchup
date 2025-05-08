import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function getCoursesWithFavorites() {
  const supabase = createClientComponentClient()

  try {
    // コース情報を取得
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        category,
        total_weeks,
        tuition_and_others,
        schools (
          id,
          name,
          logo_url,
          goal_locations (
            id,
            city,
            country
          )
        )
      `)
      .order("name")

    if (coursesError) throw coursesError
    
    // 入学日情報を取得
    const { data: intakeDatesData, error: intakeDatesError } = await supabase
      .from("course_intake_dates")
      .select("*")
      .in("course_id", (courses || []).map(course => course.id))
      .order("year", { ascending: true, nullsFirst: true })
      .order("month", { ascending: true })
      .order("day", { ascending: true, nullsFirst: true })
    
    if (intakeDatesError) throw intakeDatesError
    
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
    
    // 各コースに入学日情報を追加
    const coursesWithIntakeDates = courses?.map(course => ({
      ...course,
      intake_dates: intakeDatesByCourse.get(course.id) || []
    })) || []

    // 現在のユーザーのお気に入りを取得
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return coursesWithIntakeDates.map(course => ({ ...course, is_favorite: false }))
    }

    const { data: favorites, error: favoritesError } = await supabase
      .from("favorite_courses")
      .select("course_id")
      .eq("user_id", user.id)

    if (favoritesError) throw favoritesError

    const favoriteCourseIds = favorites?.map(f => f.course_id) || []

    return coursesWithIntakeDates.map(course => ({
      ...course,
      is_favorite: favoriteCourseIds.includes(course.id)
    }))
  } catch (error) {
    throw error
  }
}

export async function getFavoriteCourseIds(userId: string) {
  const supabase = createClientComponentClient()

  try {
    const { data, error } = await supabase
      .from("favorite_courses")
      .select("course_id")
      .eq("user_id", userId)

    if (error) throw error

    return data.map((item) => item.course_id)
  } catch (error) {
    throw error
  }
}

export async function toggleFavoriteCourse(userId: string, courseId: string) {
  const supabase = createClientComponentClient()

  try {
    const { data: existingFavorite, error: checkError } = await supabase
      .from("favorite_courses")
      .select()
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single()

    if (checkError && checkError.code !== "PGRST116") throw checkError

    if (existingFavorite) {
      const { error: deleteError } = await supabase
        .from("favorite_courses")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId)

      if (deleteError) throw deleteError

      return { is_favorite: false }
    } else {
      const { error: insertError } = await supabase
        .from("favorite_courses")
        .insert({ user_id: userId, course_id: courseId })

      if (insertError) throw insertError

      return { is_favorite: true }
    }
  } catch (error) {
    throw error
  }
}

export async function getFavoriteCourses(userId: string) {
  const supabase = createClientComponentClient()

  try {
    // まずお気に入りのコースIDを取得
    const { data: favorites, error: favoritesError } = await supabase
      .from("favorite_courses")
      .select("course_id")
      .eq("user_id", userId)
    
    if (favoritesError) throw favoritesError
    
    const favoriteIds = favorites?.map(f => f.course_id) || []
    
    // お気に入りがない場合は空配列を返す
    if (favoriteIds.length === 0) {
      return []
    }
    
    // コース情報を取得
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        category,
        total_weeks,
        tuition_and_others,
        schools (
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
      .in("id", favoriteIds)
    
    if (error) throw error
    
    // 入学日情報を取得
    const { data: intakeDatesData, error: intakeDatesError } = await supabase
      .from("course_intake_dates")
      .select("*")
      .in("course_id", favoriteIds)
      .order("year", { ascending: true, nullsFirst: true })
      .order("month", { ascending: true })
      .order("day", { ascending: true, nullsFirst: true })
    
    if (intakeDatesError) throw intakeDatesError
    
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
    
    // コース情報と入学日情報を結合
    return data.map(course => ({
      ...course,
      is_favorite: true,
      intake_dates: intakeDatesByCourse.get(course.id) || []
    }))
  } catch (error) {
    throw error
  }
}