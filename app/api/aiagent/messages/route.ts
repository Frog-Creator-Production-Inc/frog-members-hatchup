import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { session_id, sender, content, metadata } = await request.json();
    
    // バリデーション
    if (!session_id || !sender || !content) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }
    
    // Supabaseクライアントの初期化
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証済みユーザーの取得
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // メッセージをデータベースに保存
    const { data, error } = await supabase
      .from('ai_messages')
      .insert({
        user_id: user.id,
        session_id,
        sender,
        content,
        metadata: metadata || {}
      })
      .select('id');
    
    if (error) {
      console.error('メッセージ保存エラー:', error);
      return NextResponse.json(
        { error: 'メッセージの保存に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message_id: data[0].id });
  } catch (error) {
    console.error('予期しないエラー:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

// セッションのメッセージ履歴を取得するエンドポイント
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const session_id = url.searchParams.get('session_id');
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'session_idが必要です' },
        { status: 400 }
      );
    }
    
    // Supabaseクライアントの初期化
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証済みユーザーの取得
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // セッションのメッセージ履歴を取得
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('メッセージ取得エラー:', error);
      return NextResponse.json(
        { error: 'メッセージの取得に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ messages: data });
  } catch (error) {
    console.error('予期しないエラー:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
} 