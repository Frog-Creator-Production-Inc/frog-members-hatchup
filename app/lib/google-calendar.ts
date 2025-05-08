import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Google Calendar APIの設定
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const CALENDAR_ID = 'opdsgn.com_78ludapdcqqadm7srhp8p4dsqg@group.calendar.google.com';

// OAuth2クライアントの設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === 'production'
    ? 'https://members.frogagent.com/auth/callback'
    : 'http://localhost:3000/auth/callback'
);

// カレンダーAPIのインスタンスを作成
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Supabaseからリフレッシュトークンを取得する関数
async function getGoogleRefreshToken() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // refresh_tokensテーブルからGOOGLE_REFRESH_TOKENの値を取得
    const { data, error } = await supabase
      .from('refresh_tokens')
      .select('refresh_token')
      .eq('service_name', 'GOOGLE_REFRESH_TOKEN')
      .single();
    
    if (error) {
      console.error('Error fetching Google refresh token from Supabase:', error);
      return null;
    }
    
    return data?.refresh_token;
  } catch (error) {
    console.error('Failed to get Google refresh token:', error);
    return null;
  }
}

// イベントの取得関数
export async function getEvents(timeMin: Date, timeMax: Date) {
  try {
    console.log('Google Calendar - Environment:', process.env.NODE_ENV);
    console.log('Google Calendar - Redirect URI:', process.env.NODE_ENV === 'production'
      ? 'https://members.frogagent.com/auth/callback'
      : 'http://localhost:3000/auth/callback');
    console.log('Google Calendar - Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('Google Calendar - Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    // Supabaseからリフレッシュトークンを取得
    const refreshToken = await getGoogleRefreshToken();
    console.log('Google Calendar - Refresh Token fetched from Supabase:', !!refreshToken);
    
    if (!refreshToken) {
      throw new Error('Google Calendar refresh token not found in Supabase');
    }
    
    // サービスアカウントの認証情報を設定
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    console.log('Google Calendar - Fetching events for calendar:', CALENDAR_ID);
    console.log('Google Calendar - Time range:', timeMin.toISOString(), timeMax.toISOString());

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log('Google Calendar - API response status:', response.status);
    console.log('Google Calendar - Events count:', response.data.items?.length || 0);

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching events from Google Calendar:', error);
    return [];
  }
}

// イベントの型定義
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  htmlLink: string;
} 