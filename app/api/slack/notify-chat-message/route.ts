import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notifyNewChatMessage } from '@/lib/slack/notifications'

/**
 * 新規チャットメッセージをSlackに通知するAPIエンドポイント
 * 非同期で処理し、チャット機能のパフォーマンスに影響を与えないようにする
 */
export async function POST(request: NextRequest) {
  try {
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'リクエストボディの解析に失敗しました' }, { status: 400 });
    }

    const { messageId, channelId, userId, text, userName } = requestBody;

    if (!messageId || !channelId || !userId || !text) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies })
    
    // 管理者権限チェック（エラーが発生しても処理は続行）
    let isAdmin = false;
    try {
      const { data: adminData, error: adminCheckError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (!adminCheckError && adminData) {
        isAdmin = adminData.is_admin || false;
      }
    } catch (adminCheckError) {
      // 処理は続行
    }
    
    // 認証チェック（エラーが発生しても処理は続行）
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        if (session.user.id !== userId) {
          // 警告だけ出して処理は続行
        }
      }
    } catch (authError) {
      // 処理は続行
    }

    let result;
    try {
      // 既存の関数を使用
      result = await notifyNewChatMessage(
        messageId,
        userId,
        userName || 'ユーザー',
        text,
        false // isTest=false
      );

      if (!result) {
        return NextResponse.json({ error: '通知送信に失敗しました' }, { status: 500 });
      }
    } catch (notifyError) {
      return NextResponse.json({ error: 'Slack通知送信中にエラーが発生しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ error: 'チャット通知中にエラーが発生しました' }, { status: 500 });
  }
} 