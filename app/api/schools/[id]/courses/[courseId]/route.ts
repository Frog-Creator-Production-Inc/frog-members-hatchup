import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// 学校担当者がコース情報を更新するためのエンドポイント
export async function PUT(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params
    const supabase = createRouteHandlerClient({ cookies })
    
    // リクエストボディの取得
    const { course, token, email } = await request.json()
    
    if (!course || !token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      )
    }
    
    // 1. トークンの有効性確認
    const now = new Date().toISOString()
    const { data: tokenData, error: tokenError } = await supabase
      .from('school_access_tokens')
      .select('*')
      .eq('token', token)
      .eq('school_id', schoolId)
      .eq('email', email)
      .gt('expires_at', now)
      .single()
    
    if (tokenError || !tokenData) {
      console.error('Invalid or expired token:', tokenError)
      return NextResponse.json(
        { error: "無効または期限切れのトークンです" },
        { status: 401 }
      )
    }
    
    // 2. コースが指定された学校に属していることを確認
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, school_id')
      .eq('id', courseId)
      .eq('school_id', schoolId)
      .single()
    
    if (courseError || !courseData) {
      console.error('Course not found or not associated with the school:', courseError)
      return NextResponse.json(
        { error: "指定されたコースが見つからないか、この学校に属していません" },
        { status: 404 }
      )
    }
    
    // 3. コース情報を更新
    // 更新対象のフィールドを指定（セキュリティのため、更新可能なフィールドを制限）
    const updateData = {
      name: course.name,
      category: course.category,
      description: course.description,
      total_weeks: course.total_weeks,
      lecture_weeks: course.lecture_weeks,
      work_permit_weeks: course.work_permit_weeks,
      tuition_and_others: course.tuition_and_others,
      url: course.url,
      admission_requirements: course.admission_requirements,
      graduation_requirements: course.graduation_requirements,
      job_support: course.job_support,
      notes: course.notes
    }
    
    const { error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .eq('school_id', schoolId)
    
    if (updateError) {
      console.error('Error updating course:', updateError)
      return NextResponse.json(
        { error: "コース情報の更新中にエラーが発生しました" },
        { status: 500 }
      )
    }
    
    // 4. トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
    
    return NextResponse.json({
      success: true,
      message: "コース情報が更新されました"
    })
  } catch (error) {
    console.error('Error in course update API:', error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}

// コース削除のエンドポイント
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params;
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log(`Attempting to delete course: ${courseId} for school: ${schoolId}`);
    
    // リクエストボディの取得
    const { token, email } = await request.json();
    
    if (!token || !email) {
      console.log('Missing token or email');
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      );
    }
    
    // トークンの有効性確認
    const now = new Date().toISOString();
    console.log(`Validating token for email: ${email}`);
    const { data: tokenData, error: tokenError } = await supabase
      .from('school_access_tokens')
      .select('*')
      .eq('token', token)
      .eq('school_id', schoolId)
      .eq('email', email)
      .gt('expires_at', now)
      .single();
    
    if (tokenError || !tokenData) {
      console.error('Invalid or expired token:', tokenError);
      return NextResponse.json(
        { error: "無効または期限切れのトークンです" },
        { status: 401 }
      );
    }
    
    // コースが指定された学校に属していることを確認
    console.log(`Checking if course ${courseId} belongs to school ${schoolId}`);
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, school_id')
      .eq('id', courseId)
      .eq('school_id', schoolId)
      .single();
    
    if (courseError || !courseData) {
      console.error('Course not found or not associated with the school:', courseError);
      return NextResponse.json(
        { error: "指定されたコースが見つからないか、この学校に属していません" },
        { status: 404 }
      );
    }
    
    // 関連データの削除を開始
    console.log('Starting to delete related data...');
    
    try {
      // 1. favorite_courses の削除
      console.log('Deleting favorite_courses records...');
      const { error: favoritesError } = await supabase
        .from('favorite_courses')
        .delete()
        .eq('course_id', courseId);
      
      if (favoritesError) {
        console.error('Error deleting favorite_courses:', favoritesError);
      }
      
      // 2. school_photos の削除
      console.log('Deleting school_photos records...');
      const { error: photosError } = await supabase
        .from('school_photos')
        .delete()
        .eq('course_id', courseId);
      
      if (photosError) {
        console.error('Error deleting school_photos:', photosError);
      }
      
      // 3. course_subjects の削除
      console.log('Deleting course_subjects records...');
      const { error: subjectsError } = await supabase
        .from('course_subjects')
        .delete()
        .eq('course_id', courseId);
      
      if (subjectsError) {
        console.error('Error deleting course_subjects:', subjectsError);
      }
      
      // 4. course_intake_dates の削除
      console.log('Deleting course_intake_dates records...');
      const { error: intakeDatesError } = await supabase
        .from('course_intake_dates')
        .delete()
        .eq('course_id', courseId);
      
      if (intakeDatesError) {
        console.error('Error deleting course_intake_dates:', intakeDatesError);
      }
      
      // 5. course_entry_requirements の削除 (存在する場合)
      console.log('Deleting course_entry_requirements records...');
      const { error: requirementsError } = await supabase
        .from('course_entry_requirements')
        .delete()
        .eq('course_id', courseId);
      
      if (requirementsError && requirementsError.code !== 'PGRST116') { // データが存在しない場合のエラーを無視
        console.error('Error deleting course_entry_requirements:', requirementsError);
      }
      
      // 6. user_selections の削除 (存在する場合)
      console.log('Deleting user_selections records...');
      const { error: selectionsError } = await supabase
        .from('user_selections')
        .delete()
        .eq('course_id', courseId);
      
      if (selectionsError && selectionsError.code !== 'PGRST116') { // データが存在しない場合のエラーを無視
        console.error('Error deleting user_selections:', selectionsError);
      }
      
      // 最後にコース自体を削除
      console.log(`Finally deleting course ${courseId}...`);
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('school_id', schoolId); // 学校IDの確認も追加
      
      if (deleteError) {
        console.error('Error deleting course:', deleteError);
        return NextResponse.json(
          { error: `コースの削除中にエラーが発生しました: ${deleteError.message}` },
          { status: 500 }
        );
      }
      
      console.log(`Course ${courseId} successfully deleted`);
      
    } catch (specificError) {
      console.error('Specific error during deletion process:', specificError);
      return NextResponse.json(
        { error: "データ削除処理中にエラーが発生しました" },
        { status: 500 }
      );
    }
    
    // トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);
    
    return NextResponse.json({
      success: true,
      message: "コースが削除されました"
    });
  } catch (error) {
    console.error('General error in DELETE course:', error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
} 