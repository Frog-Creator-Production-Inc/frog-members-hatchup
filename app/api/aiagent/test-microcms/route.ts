import { NextResponse } from 'next/server';
import { searchInterviews, searchInterviewsByKeywords, extractInterviewInfo } from '@/app/aiagent/microcms-client';

export async function GET() {
  try {
    console.log('MicroCMSテスト: 検索を開始します...');
    
    // 「Frog」というキーワードで検索
    const query = 'Frog';
    const keywords = ['Frog', 'エンジニア', '就職', 'デザイナー'];
    
    // 通常の検索とキーワード検索の両方を実行
    const [interviewResults, keywordInterviewResults] = await Promise.all([
      searchInterviews(query),
      searchInterviewsByKeywords(keywords)
    ]);
    
    // 結果を統合して重複を排除
    const allInterviews = [...interviewResults, ...keywordInterviewResults];
    const uniqueInterviews = Array.from(
      new Map(allInterviews.map(item => [item.id, item])).values()
    );
    
    console.log(`MicroCMSテスト: ${uniqueInterviews.length}件のインタビュー記事が見つかりました`);

    // インタビュー記事の情報を抽出して分析
    const interviewAnalysis = {
      total: uniqueInterviews.length,
      canadaJobs: 0,
      details: [] as any[]
    };

    // インタビュー記事の分析
    uniqueInterviews.forEach((interview) => {
      // インタビュー内容から情報を抽出
      const info = extractInterviewInfo(interview.contents);
      
      // 統計情報を更新
      if (info.isCanadaJob) interviewAnalysis.canadaJobs++;
      
      // 詳細情報を追加
      interviewAnalysis.details.push({
        id: interview.id,
        title: interview.title,
        slug: interview.slug,
        isCanadaJob: info.isCanadaJob,
        excerpt: info.plainText.substring(0, 200) + '...'
      });
    });

    return NextResponse.json({
      query,
      keywords,
      interviewResults: {
        directSearch: interviewResults.length,
        keywordSearch: keywordInterviewResults.length,
        uniqueResults: uniqueInterviews.length
      },
      analysis: {
        total: interviewAnalysis.total,
        canadaJobs: interviewAnalysis.canadaJobs
      },
      details: interviewAnalysis.details
    });
  } catch (error) {
    console.error('MicroCMSテストエラー:', error);
    return NextResponse.json(
      { error: 'MicroCMSからのデータ取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 