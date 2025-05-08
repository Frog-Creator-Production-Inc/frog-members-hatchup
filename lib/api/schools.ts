import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { School } from "@/types/database.types"

export async function getSchool(id: string): Promise<School | null> {
  const supabase = createClientComponentClient()

  try {
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select(`
        id,
        name,
        location_id,
        website,
        description,
        created_at,
        logo_url,
        updated_at,
        goal_location:location_id (
          id,
          city,
          country
        )
      `)
      .eq("id", id)
      .single()

    if (schoolError) {
      throw schoolError
    }

    if (!school) {
      return null
    }

    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("category")
      .eq("school_id", id)
      .not("category", "is", null)

    if (coursesError) {
      throw coursesError
    }

    const { data: photos, error: photosError } = await supabase
      .from("school_photos")
      .select("id, url, description, created_at, school_id")
      .eq("school_id", id)
      .order("created_at", { ascending: false })

    if (photosError) {
      throw photosError
    }

    const uniqueCategories = Array.from(new Set(courses?.map((course) => course.category).filter(Boolean)))

    // 写真データを準備
    const schoolPhotos = (photos || []).map(photo => ({
      ...photo,
      updated_at: photo.created_at // Add missing updated_at field
    }))

    return {
      ...school,
      categories: uniqueCategories,
      photos: schoolPhotos,
      school_photos: schoolPhotos, // school_photosプロパティにも同じデータを格納
      goal_location: school.goal_location[0] as { id: string; city: string; country: string; }
    }
  } catch (error) {
    throw error
  }
}

