import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('request_id');
    const verbose = request.nextUrl.searchParams.get('verbose') === 'true';
    
    if (!requestId) {
      console.error('リクエストIDが指定されていません');
      return NextResponse.json(
        { error: "request_idは必須です" },
        { status: 400 }
      );
    }
    
    console.log(`【管理者】Content Snareリクエスト情報取得 (レガシー) (ID: ${requestId}, verbose: ${verbose})`);
    
    // 新しいfetch-full-statusエンドポイントを内部的に呼び出す
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const internalUrl = `${baseUrl}/api/content-snare/admin/fetch-full-status?request_id=${requestId}&verbose=${verbose}`;
    
    console.log(`内部APIコール: ${internalUrl}`);
    
    // 認証情報を引き継いでAPIを呼び出し
    const response = await fetch(internalUrl, {
      headers: {
        'cookie': cookies().toString()
      }
    });
    
    if (!response.ok) {
      // エラーメッセージをそのまま返す
      const errorText = await response.text();
      console.error(`内部API呼び出しエラー: ${response.status}`);
      console.error(`エラー詳細: ${errorText}`);
      
      return NextResponse.json(
        { error: "Content Snare情報の取得に失敗しました" },
        { status: response.status }
      );
    }
    
    // 結果を取得
    const fullStatusData = await response.json();
    
    // 旧形式のレスポンスフォーマットに変換
    const legacyResponse = {
      ...fullStatusData,
      // 古いAPIがprogressオブジェクトを返さない場合のために互換性を維持
      fields_count: fullStatusData.progress?.total_fields,
      done_fields_count: fullStatusData.progress?.done_fields,
      completion_percentage: fullStatusData.progress?.percent
    };
    
    console.log(`レガシーAPIレスポンス変換完了`);
    
    return NextResponse.json(legacyResponse);
    
  } catch (error) {
    console.error("Content Snare情報取得エラー (レガシーAPI):", error);
    return NextResponse.json({ error: "Content Snare情報の取得に失敗しました" }, { status: 500 });
  }
} 