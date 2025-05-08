import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// サービスロールクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 科目一覧の取得
export async function GET(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params;
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      );
    }
    
    // トークンの有効性確認
    const now = new Date().toISOString();
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
    
    // カリキュラム情報を取得
    const { data: subjects, error: fetchError } = await supabase
      .from('course_subjects')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('Error fetching subjects:', fetchError);
      return NextResponse.json(
        { error: "カリキュラムの取得中にエラーが発生しました" },
        { status: 500 }
      );
    }
    
    // トークンの使用履歴を更新
    await supabase
      .from('school_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);
    
    return NextResponse.json(subjects || []);
  } catch (error) {
    console.error('Error in GET subjects:', error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// 新規科目の追加
export async function POST(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // リクエストボディの取得
    const { subject, token, email } = await request.json();
    
    if (!subject || !subject.title || !token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      );
    }
    
    // トークンの有効性確認
    const now = new Date().toISOString();
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
    
    // サービスロールを使用して科目を追加
    const { data, error: insertError } = await supabaseAdmin
      .from('course_subjects')
      .insert({
        course_id: courseId,
        title: subject.title,
        description: subject.description || null
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting subject:', insertError);
      return NextResponse.json(
        { error: "カリキュラムの追加中にエラーが発生しました" },
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
      data
    });
  } catch (error) {
    console.error('Error in POST subject:', error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// 科目の削除
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params;
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!subjectId || !token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      );
    }
    
    // トークンの有効性確認
    const now = new Date().toISOString();
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
    
    // サービスロールを使用して科目を削除
    const { error: deleteError } = await supabaseAdmin
      .from('course_subjects')
      .delete()
      .eq('id', subjectId)
      .eq('course_id', courseId);
    
    if (deleteError) {
      console.error('Error deleting subject:', deleteError);
      return NextResponse.json(
        { error: "カリキュラムの削除中にエラーが発生しました" },
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
      message: "カリキュラムが削除されました"
    });
  } catch (error) {
    console.error('Error in DELETE subject:', error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// 科目の更新
export async function PUT(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: schoolId, courseId } = params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // リクエストボディの取得
    const { subject, token, email } = await request.json();
    
    if (!subject || !subject.id || !subject.title || !token || !email) {
      return NextResponse.json(
        { error: "必要な情報が不足しています" },
        { status: 400 }
      );
    }
    
    // トークンの有効性確認
    const now = new Date().toISOString();
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
    
    // サービスロールを使用して科目を更新
    const { data, error: updateError } = await supabaseAdmin
      .from('course_subjects')
      .update({
        title: subject.title,
        description: subject.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subject.id)
      .eq('course_id', courseId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating subject:', updateError);
      return NextResponse.json(
        { error: "カリキュラムの更新中にエラーが発生しました" },
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
      data
    });
  } catch (error) {
    console.error('Error in PUT subject:', error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
} 