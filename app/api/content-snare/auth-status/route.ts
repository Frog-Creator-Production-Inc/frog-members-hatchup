import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("Content Snare 認証ステータス確認開始");
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ authenticated: false, error: "認証が必要です" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("認証済みユーザー:", userId);
    
    // ユーザーのトークンを取得
    const { data: tokenData, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('service_name', 'content_snare')
      .single();
    
    if (tokenError) {
      console.error('トークン取得エラー:', tokenError);
      return NextResponse.json(
        { isAuthenticated: false, error: '認証情報の取得に失敗しました' },
        { status: 500 }
      );
    }
    
    // トークンがあればユーザーは認証済み
    const isAuthenticated = !!tokenData;
    
    if (!isAuthenticated) {
      console.log("トークンが見つかりません");
      return NextResponse.json({ 
        authenticated: false, 
        hasToken: false, 
        message: "Content Snareとの連携が設定されていません" 
      });
    }
    
    // リフレッシュトークンの有効性を確認
    try {
      const refreshResponse = await fetch(`https://api.contentsnare.com/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: process.env.CONTENT_SNARE_CLIENT_ID,
          client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token
        })
      });
      
      if (!refreshResponse.ok) {
        console.error("リフレッシュトークンが無効です");
        return NextResponse.json({ 
          authenticated: false, 
          hasToken: true,
          refreshFailed: true,
          message: "トークンの更新に失敗しました。再認証が必要です。" 
        });
      }
      
      const refreshData = await refreshResponse.json();
      
      // トークンを更新
      const { error: updateError } = await supabase
        .from('refresh_tokens')
        .update({
          refresh_token: refreshData.refresh_token,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);
      
      if (updateError) {
        console.error("トークン更新エラー:", updateError);
        return NextResponse.json({ 
          authenticated: false, 
          hasToken: true,
          refreshFailed: true,
          message: "トークンの更新に失敗しました。" 
        });
      }
      
      return NextResponse.json({ 
        authenticated: true, 
        hasToken: true,
        tokenRefreshed: true,
        message: "トークンを更新しました" 
      });
    } catch (refreshError) {
      console.error("リフレッシュエラー:", refreshError);
      return NextResponse.json({ 
        authenticated: false, 
        hasToken: true,
        refreshFailed: true,
        message: "トークンの更新処理に失敗しました。再認証が必要です。" 
      });
    }
    
  } catch (error) {
    console.error("認証ステータス確認エラー:", error);
    return NextResponse.json({ 
      authenticated: false, 
      error: "認証ステータスの確認に失敗しました" 
    }, { status: 500 });
  }
} 