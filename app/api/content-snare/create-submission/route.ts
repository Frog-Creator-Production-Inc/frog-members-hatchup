import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    
    
    // Supabaseクライアントを作�E
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 認証されてぁE��ぁE��クエストを拒否
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      
      return NextResponse.json({ error: "認証されてぁE��せん" }, { status: 401 });
    }

    

    // リクエスト�EチE��を解极E    const body = await request.json();
    const { clientId, packageId } = body;

    if (!clientId || !packageId) {
      
      return NextResponse.json(
        { error: "clientId と packageId が忁E��でぁE }, 
        { status: 400 }
      );
    }

    

    // アクセスト�Eクン取得戦略
    let accessToken = '';
    
    // 1. まず環墁E��数CONTENT_SNARE_ACCESS_TOKENを確認（最も信頼性が高い�E�E    if (process.env.CONTENT_SNARE_ACCESS_TOKEN) {
      
      accessToken = process.env.CONTENT_SNARE_ACCESS_TOKEN;
    } 
    // 2. 次にメモリ冁E�E一時トークンを確誁E    else if (process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN) {
      
      accessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    } 
    // 3. 最後にチE�Eタベ�Eスを確誁E    else {
      try {
        // シスチE��共通�EContent SnareリフレチE��ュト�Eクンを取征E        
        const { data: tokens, error: tokensError } = await supabase
          .from('refresh_tokens')
          .select('*')
          .eq('service_name', 'content_snare')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (tokensError) {
          
          return NextResponse.json({ error: "ト�Eクン取得エラー" }, { status: 500 });
        }
        
        if (!tokens || tokens.length === 0) {
          
          return NextResponse.json({ error: "Content Snareの認証が忁E��でぁE }, { status: 403 });
        }
        
        const contentSnareToken = tokens[0];
        console.log("Content Snareト�Eクンが見つかりました:", {
          id: contentSnareToken.id,
          token_length: contentSnareToken.refresh_token ? contentSnareToken.refresh_token.length : 0
        });
        
        // リフレチE��ュト�Eクンでアクセスト�Eクンを取征E        const refreshResponse = await fetch(`https://api.contentsnare.com/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: process.env.CONTENT_SNARE_CLIENT_ID,
            client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
            refresh_token: contentSnareToken.refresh_token
          })
        });
        
        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          
          return NextResponse.json({ error: "ト�EクンのリフレチE��ュに失敗しました" }, { status: 403 });
        }
        
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        // 新しいリフレチE��ュト�EクンをシスチE��用に保孁E        await supabase
          .from('refresh_tokens')
          .update({
            refresh_token: refreshData.refresh_token,
            service_name: 'content_snare', // 小文字を確実に維持E            updated_at: new Date().toISOString()
          })
          .eq('id', contentSnareToken.id);
          
      } catch (error) {
        const dbError = error as Error;
        
        // チE�Eタベ�Eスエラーは無視して続衁E      }
    }
    
    // ト�Eクンが見つからなぁE��合�Eエラー
    if (!accessToken) {
      
      return NextResponse.json(
        { error: "Content Snareのアクセスト�Eクンが見つかりません、Eenv.localファイルまた�E環墁E��数にCONTENT_SNARE_ACCESS_TOKENを設定してください、E }, 
        { status: 403 }
      );
    }

    // サブミチE��ョン作�EAPIを呼び出ぁE    const apiResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Api-Key": process.env.CONTENT_SNARE_API_KEY || "",
        "X-Account-Id": process.env.CONTENT_SNARE_CLIENT_ID || ""
      },
      body: JSON.stringify({
        client_id: clientId,
        package_id: packageId
      })
    });

    // レスポンスをログに出劁E    const responseStatus = apiResponse.status;
    const responseText = await apiResponse.text();
    
    

    // APIからのレスポンスを解析して返す
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: "Content Snare APIエラー", details: responseText, status: responseStatus }, 
        { status: responseStatus }
      );
    }

    try {
      const responseData = JSON.parse(responseText);
      return NextResponse.json(responseData);
    } catch (jsonError) {
      
      return NextResponse.json(
        { error: "レスポンスの解析に失敗しました", raw: responseText }, 
        { status: 500 }
      );
    }
  } catch (error) {
    
    return NextResponse.json(
      { error: "サーバ�Eエラーが発生しました" }, 
      { status: 500 }
    );
  }
} 
