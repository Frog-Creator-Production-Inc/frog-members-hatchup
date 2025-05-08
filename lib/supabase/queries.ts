import { createClient } from "@/lib/supabase-client"
import { createServerClient } from "@/lib/supabase-client"
import type { GoalLocation } from "@/types/supabase"

// 環境検出
const isServer = typeof window === 'undefined';

const getSupabaseClient = () => {
  // サーバーサイドの場合はサーバーコンポーネント用クライアントを使用
  if (isServer) {
    const client = createServerClient();
    return client;
  }
  
  // クライアントサイドの場合は通常のクライアントを使用
  const client = createClient();
  return client;
}

// 管理者権限のチェック
export async function isAdmin(userId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('admin_roles')
    .select(`
      user_id,
      profiles!inner (
        id,
        email
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

export async function getCourses() {
  const supabase = getSupabaseClient()

  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        *,
        schools:school_id (
          id,
          name,
          logo_url,
          goal_location:location_id (
            id,
            city,
            country
          )
        )
      `)
      .order("name")

    if (error) {
      throw error
    }

    return courses
  } catch (error) {
    throw error
  }
}

export async function getGoalLocations() {
  const supabase = getSupabaseClient()

  try {
    interface SchoolWithLocation {
      location_id: string;
      goal_locations: {
        id: string;
        city: string;
        country: string;
        region: string | null;
        created_at: string;
        updated_at: string;
      };
    }

    const { data: locations, error } = await supabase
      .from("schools")
      .select("location_id, goal_locations(id, city, country, region, created_at, updated_at)")
      .not("location_id", "is", null)
      .order("goal_locations(city)")

    if (error) {
      throw error
    }

    // 重複を除去し、必要なデータ構造に整形
    if (!locations) {
      return []
    }

    const typedLocations = locations as unknown as Array<{
      location_id: string;
      goal_locations: GoalLocation;
    }>
    const uniqueLocations = Array.from(
      new Set(typedLocations.map((l) => l.goal_locations.id))
    ).map((id) => {
      const schoolWithLocation = typedLocations.find((l) => l.goal_locations.id === id)
      const location = schoolWithLocation?.goal_locations
      if (!location) return null
      return {
        id: location.id,
        city: location.city,
        country: location.country,
        region: location.region,
        created_at: location.created_at,
        updated_at: location.updated_at
      }
    }).filter((location): location is GoalLocation => location !== null)

    return uniqueLocations
  } catch (error) {
    throw error
  }
}

export async function getSchools(locationId?: string) {
  const supabase = getSupabaseClient()

  try {
    // クエリ構築
    let query = supabase
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
      .order("name")

    // 場所IDの指定がある場合はフィルター
    if (locationId && locationId !== 'all') {
      query = query.eq('location_id', locationId)
    }

    const { data: schools, error } = await query

    if (error) {
      throw error
    }

    // 各学校のコースからカテゴリを取得
    const schoolsWithCategories = await Promise.all((schools || []).map(async (school) => {
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("category")
        .eq("school_id", school.id)

      if (coursesError) {
        return school
      }

      // コースからユニークなカテゴリを抽出
      const categories = Array.from(new Set(courses.map(course => course.category)))

      return {
        ...school,
        categories
      }
    }))

    return schoolsWithCategories
  } catch (error) {
    throw error
  }
}

export async function getCurrentLocations() {
  const supabase = getSupabaseClient()

  try {
    const { data: locations, error } = await supabase.from("current_locations").select("*").order("name")

    if (error) {
      throw error
    }

    return locations
  } catch (error) {
    throw error
  }
}

export async function updateUserSelection(userId: string, selection: Record<string, any>) {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("user_selections")
      .upsert({ user_id: userId, ...selection })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function getDistributionStats() {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("distribution_stats")
      .select("*")

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function getTasks() {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function getLocations() {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function updateProfile(profile: {
  id: string;
  [key: string]: any;
}) {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        updated_at: new Date().toISOString(),
        ...profile
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    // 一意性制約違反のエラーは成功として扱う
    if (error && error.code !== '23505') {
      return { error };
    }

    return { data: data || profile }; // データがnullの場合は元のプロフィールを返す
  } catch (error) {
    // エラーの種類を確認して、実際にエラーが必要な場合のみエラーを返す
    if (error instanceof Error && !error.message.includes('duplicate key value')) {
      return { error: { message: 'プロフィールの更新中に予期せぬエラーが発生しました' } };
    }
    return { data: profile }; // エラーが重要でない場合は成功として扱う
  }
}

// 職業ポジションの取得
export async function getJobPositions() {
  try {
    // サーバーコンポーネントからの呼び出し用に直接クライアントを作成
    const supabase = isServer ? createServerClient() : getSupabaseClient();

    const { data, error } = await supabase
      .from("job_positions")
      .select("*")
      .order("title")

    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error
  }
}

// コースに関連する職業ポジションの取得
export async function getCourseJobPositions(courseId: string) {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("course_job_positions")
      .select(`
        course_id,
        job_position_id,
        job_positions:job_position_id (
          id,
          title,
          description,
          industry
        )
      `)
      .eq("course_id", courseId)

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

// コースの職業ポジションを更新
export async function updateCourseJobPositions(courseId: string, jobPositionIds: string[]) {
  const supabase = getSupabaseClient()

  try {
    // 認証状態を確認
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      throw new Error("認証エラー: ログインが必要です");
    }

    // 既存のマッピングを削除
    const { error: deleteError } = await supabase
      .from("course_job_positions")
      .delete()
      .eq("course_id", courseId);

    if (deleteError) {
      throw deleteError;
    }

    // 新しいマッピングを挿入
    if (jobPositionIds.length === 0) {
      // 空のリストの場合は早期リターン
      return { success: true, inserted: 0 };
    }

    // マッピングを作成
    const insertData = jobPositionIds.map(jobPositionId => ({
      course_id: courseId,
      job_position_id: jobPositionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 一括挿入
    const { data, error: insertError } = await supabase
      .from("course_job_positions")
      .insert(insertData)
      .select();

    if (insertError) {
      throw insertError;
    }

    return {
      success: true,
      inserted: data?.length || 0,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ユーザープロファイルの希望職業を更新
export async function updateUserFutureOccupation(userId: string, jobPositionId: string | null) {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ future_occupation: jobPositionId })
      .eq("id", userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    throw error
  }
}