import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("Content Snare トークンリフレッシュ処理開始");
    
    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("認証セッションがありません");
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("認証済みユーザー:", userId);
    
    // ユーザーのリフレッシュトークンを取得
    const { data: tokenData, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('service_name', 'content_snare')
      .single();
    
    if (tokenError || !tokenData) {
      console.error("トークン取得エラー:", tokenError);
      return NextResponse.json({ error: "リフレッシュトークンが見つかりません" }, { status: 404 });
    }
    
    // リフレッシュトークンを使用して新しいアクセストークンを取得
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
      const errorText = await refreshResponse.text();
      console.error("トークンリフレッシュエラー:", errorText, "ステータス:", refreshResponse.status);
      
      // リフレッシュトークンが無効な場合はDBから削除
      if (refreshResponse.status === 400 || refreshResponse.status === 401) {
        await supabase
          .from('refresh_tokens')
          .delete()
          .eq('id', tokenData.id);
        
        return NextResponse.json({ 
          error: "リフレッシュトークンが無効です。再認証が必要です。", 
          requireReauth: true 
        }, { status: 401 });
      }
      
      return NextResponse.json({ error: "トークンのリフレッシュに失敗しました" }, { status: refreshResponse.status });
    }
    
    const newTokenData = await refreshResponse.json();
    console.log("トークンリフレッシュ成功", {
      accessTokenLength: newTokenData.access_token?.length || 0,
      refreshTokenLength: newTokenData.refresh_token?.length || 0,
      expiresIn: newTokenData.expires_in
    });
    
    // トークン有効期限を計算
    const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();
    
    // DBのトークンを更新
    const { error: updateError } = await supabase
      .from('refresh_tokens')
      .update({
        refresh_token: newTokenData.refresh_token,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);
    
    if (updateError) {
      console.error("トークン更新エラー:", updateError);
      return NextResponse.json({ error: "トークンの保存に失敗しました" }, { status: 500 });
    }
    
    // 即時利用のためにキャッシュ
    process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = newTokenData.access_token;
    process.env.CONTENT_SNARE_TEMP_EXPIRES_AT = expiresAt;
    
    return NextResponse.json({ 
      success: true, 
      expiresAt: expiresAt,
      access_token: newTokenData.access_token 
    });
    
  } catch (error) {
    console.error("リフレッシュ処理エラー:", error);
    return NextResponse.json({ error: "トークンリフレッシュ処理に失敗しました" }, { status: 500 });
  }
} 