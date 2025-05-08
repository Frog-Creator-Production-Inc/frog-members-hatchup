import { NextResponse } from 'next/server';
import { getEvents } from '@/app/lib/google-calendar';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// リフレッシュトークンの存在確認
async function checkGoogleRefreshToken() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase
      .from('refresh_tokens')
      .select('id')
      .eq('service_name', 'GOOGLE_REFRESH_TOKEN')
      .single();
    
    return !!data && !error;
  } catch (error) {
    console.error('Error checking Google refresh token:', error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    // デバッグログを追加
    console.log('API Route - Environment:', process.env.NODE_ENV);
    console.log('API Route - Request URL:', request.url);
    console.log('API Route - Month/Year Params:', monthParam, yearParam);
    console.log('API Route - Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('API Route - Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    // Supabaseのrefresh_tokensテーブルにトークンが存在するか確認
    const hasRefreshToken = await checkGoogleRefreshToken();
    console.log('API Route - Google Refresh Token exists in Supabase:', hasRefreshToken);

    // 現在の日付を取得
    const now = new Date();
    const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
    const currentMonth = monthParam ? parseInt(monthParam) - 1 : now.getMonth();

    // 指定された月の最初の日と最後の日を計算
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 2, 0); // 翌月の最後の日

    console.log('API Route - Date Range:', firstDay.toISOString(), lastDay.toISOString());

    // Google Calendar APIからイベントを取得
    const events = await getEvents(firstDay, lastDay);
    
    console.log('API Route - Events fetched:', events.length);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'イベントの取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 