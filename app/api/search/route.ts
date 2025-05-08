import { NextResponse } from 'next/server';
import { searchVisaInfo } from '@/app/aiagent/supabase-client';
import { searchInterviews } from '@/app/aiagent/microcms-client';

// このルートを動的に設定
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: '検索クエリが指定されていません' },
        { status: 400 }
      );
    }

    // Supabaseからビザ情報を検索
    const visaResults = await searchVisaInfo(query);

    // MicroCMSからインタビュー記事を検索
    const interviewResults = await searchInterviews(query);

    // 検索結果を統合
    const results = {
      visa: visaResults,
      interviews: interviewResults,
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: '検索中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 