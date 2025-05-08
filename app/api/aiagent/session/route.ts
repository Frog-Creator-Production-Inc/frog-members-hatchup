import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 通常のクライアント（認証済みユーザー用）
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サービスロールクライアント（RLSをバイパスするため）
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;

// 新しいチャットセッションを作成
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが指定されていません' },
        { status: 400 }
      );
    }

    // サービスロールを使用してRLSをバイパス
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: userId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'セッションの作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: data.id });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'セッションの作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 特定のセッションの会話履歴を取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'セッションIDが指定されていません' },
        { status: 400 }
      );
    }

    // サービスロールを使用してRLSをバイパス
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '会話履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 会話履歴をLLM用に整形
    const chatHistory = data.map(message => ({
      role: message.sender_id === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));

    return NextResponse.json({ chatHistory });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: '会話履歴の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 