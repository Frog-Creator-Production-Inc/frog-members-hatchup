import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { CourseEditorForm } from "./components/course-editor-form"
import { UnauthorizedView } from "./components/unauthorized-view"

export const dynamic = "force-dynamic"

interface SchoolEditorPageProps {
  params: { id: string }
  searchParams: { token?: string }
}

// 型定義
interface GoalLocation {
  id: string
  city: string
  country: string
}

interface School {
  id: string
  name: string
  logo_url?: string | null
  website?: string | null
  location_id?: string | null
  goal_locations?: GoalLocation | null
}

export default async function SchoolEditorPage({ 
  params, 
  searchParams 
}: SchoolEditorPageProps) {
  const { id: schoolId } = params
  const { token } = searchParams
  
  if (!token) {
    // トークンが無い場合はエラー表示（リダイレクトせず）
    return <UnauthorizedView reason="token-required" />
  }
  
  const supabase = createServerComponentClient({ cookies })
  
  try {
    // 1. トークンの有効性確認
    const now = new Date().toISOString()
    const { data: tokenData, error: tokenError } = await supabase
      .from('school_access_tokens')
      .select('*')
      .eq('token', token)
      .eq('school_id', schoolId)
      .gt('expires_at', now)
      .single()
    
    if (tokenError || !tokenData) {
      console.error('Invalid or expired token:', tokenError)
      // トークンが無効な場合はエラー表示（リダイレクトせず）
      return <UnauthorizedView reason="invalid-token" />
    }
    
    // 2. 学校情報を取得
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id,
        name,
        logo_url,
        website,
        location_id,
        goal_locations (
          id,
          city,
          country
        )
      `)
      .eq('id', schoolId)
      .single()
    
    if (schoolError || !schoolData) {
      console.error('School not found:', schoolError)
      // 学校が見つからない場合はエラー表示（リダイレクトせず）
      return <UnauthorizedView reason="school-not-found" />
    }
    
    // 学校データを正規化（型エラーを回避）
    const goalLocationData = Array.isArray(schoolData.goal_locations) && schoolData.goal_locations.length > 0
      ? schoolData.goal_locations[0]
      : (schoolData.goal_locations || null);
      
    const school: School = {
      id: schoolData.id,
      name: schoolData.name,
      logo_url: schoolData.logo_url,
      website: schoolData.website,
      location_id: schoolData.location_id,
      goal_locations: goalLocationData as GoalLocation | null
    }
    
    // 3. 学校に関連するコース一覧を取得
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        name,
        category,
        description,
        total_weeks,
        lecture_weeks,
        work_permit_weeks,
        tuition_and_others,
        url,
        migration_goals,
        admission_requirements,
        graduation_requirements,
        job_support,
        notes
      `)
      .eq('school_id', schoolId)
      .order('name')
    
    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
    }
    
    // 使用日時を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
    
    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
            {school.logo_url && (
              <img 
                src={school.logo_url} 
                alt={school.name} 
                className="h-10 w-auto mr-4"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{school.name}</h1>
              {school.goal_locations && (
                <p className="text-sm text-gray-500">
                  {school.goal_locations.city}, {school.goal_locations.country}
                </p>
              )}
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h2 className="text-lg font-medium text-blue-800 mb-2">Course Information Editor for School Administrators</h2>
            <p className="text-blue-600">
              On this page, you can edit course information for {school.name}.
              Changes will be reflected when you click the save button.
            </p>
          </div>
          
          <div className="mb-6">
            {courses && courses.length > 0 ? (
              <CourseEditorForm 
                school={school} 
                courses={courses} 
                token={token}
                email={tokenData.email}
              />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">
                  There are currently no courses registered for this school.
                </p>
              </div>
            )}
          </div>
        </main>
        
        <footer className="bg-white border-t mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              This page is accessed from an invitation link sent to {tokenData.email}.
              <br />
              Link expiration date: {new Date(tokenData.expires_at).toLocaleDateString()}
            </p>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error('Error in school editor page:', error)
    // 予期せぬエラーが発生した場合もエラー表示（リダイレクトせず）
    return <UnauthorizedView reason="server-error" />
  }
} 