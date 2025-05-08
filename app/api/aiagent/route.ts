import { NextResponse } from 'next/server';
import { generateAnswer } from '@/app/aiagent/openai';
import { searchVisaInfo, searchCourseInfo, getRecommendedCourses, getAllCourses } from '@/app/aiagent/supabase-client';
import { searchInterviews, searchInterviewsByKeywords, extractInterviewInfo } from '@/app/aiagent/microcms-client';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import fs from 'fs';
import path from 'path';

// このルートを動的に設定
export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  try {
    // リクエストボディからデータを取得
    const { query, sessionId, userId, chatHistory } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: '質問が指定されていません' },
        { status: 400 }
      );
    }

    console.log(`AIエージェント: 質問「${query}」を処理中...`);
    console.log(`AIエージェント: セッションID: ${sessionId || 'なし'}, ユーザーID: ${userId || 'なし'}`);

    // Supabaseクライアントの初期化（認証済みユーザー用）
    const authClient = createRouteHandlerClient({ cookies });
    
    // 認証済みユーザーの取得
    const { data: { user } } = await authClient.auth.getUser();
    
    // セッションIDの生成（指定がない場合）
    const session_id = sessionId || `session_${Date.now()}`;

    // ユーザーのメッセージを保存
    if (user) {
      try {
        const { error: insertError } = await authClient
          .from('ai_messages')
          .insert({
            user_id: user.id,
            session_id,
            sender: 'user',
            content: query
          });
          
        if (insertError) {
          console.error('ユーザーメッセージの保存に失敗しました:', insertError);
        }
      } catch (saveError) {
        console.error('メッセージ保存エラー:', saveError);
      }
    }

    // 質問からキーワードを抽出
    const keywords = extractKeywords(query);
    console.log(`AIエージェント: 抽出されたキーワード: ${keywords.join(', ')}`);

    // Frogに関する質問の場合、強制的に「Frog」をキーワードに追加
    if (!keywords.includes('Frog') && query.toLowerCase().includes('frog')) {
      keywords.push('Frog');
      console.log(`AIエージェント: 「Frog」キーワードを追加しました`);
    }

    // ビザ関連のキーワードを追加
    if (query.toLowerCase().includes('ビザ') || query.toLowerCase().includes('visa')) {
      if (!keywords.includes('ビザ')) {
        keywords.push('ビザ');
        console.log(`AIエージェント: 「ビザ」キーワードを追加しました`);
      }
    }

    // コース関連のキーワードを追加
    if (query.toLowerCase().includes('コース') || query.toLowerCase().includes('course') || 
        query.toLowerCase().includes('プログラム') || query.toLowerCase().includes('カリキュラム')) {
      if (!keywords.includes('コース')) {
        keywords.push('コース');
        console.log(`AIエージェント: 「コース」キーワードを追加しました`);
      }
    }

    // 関連情報を検索
    console.log(`AIエージェント: ビザ情報の検索を開始します...`);
    const visaResults = await searchVisaInfo(query);
    console.log(`AIエージェント: ビザ情報の検索結果: ${visaResults.length}件`);
    
    // ビザ情報の詳細をログに出力（デバッグ用）
    if (visaResults.length > 0) {
      visaResults.forEach((visa, index) => {
        console.log(`AIエージェント: ビザ情報 ${index + 1}/${visaResults.length}:`);
        console.log(`  - 名前: ${visa.name}`);
        console.log(`  - スラッグ: ${visa.slug}`);
        console.log(`  - 説明: ${visa.description?.substring(0, 50)}...`);
        console.log(`  - 要件: ${visa.requirements ? 'あり' : 'なし'}`);
        console.log(`  - プロセス: ${visa.process ? 'あり' : 'なし'}`);
        console.log(`  - URL: ${visa.official_url || 'なし'}`);
      });
    } else {
      console.log(`AIエージェント: ビザ情報が見つかりませんでした。検索クエリを確認してください。`);
    }
    
    // コース情報を検索
    console.log(`AIエージェント: コース情報の検索を開始します...`);
    
    // まず全てのコース情報を取得
    const allCourses = await getAllCourses(true);
    console.log(`AIエージェント: 全てのコース情報（${allCourses.length}件）を取得しました`);
    
    // キーワードに基づいてコース情報を検索
    const courseResults = await searchCourseInfo(query);
    
    // ユーザープロファイルからmigration_goalを取得（認証済みユーザーの場合）
    let userMigrationGoal = '';
    let userFutureOccupation = '';
    
    if (user) {
      try {
        const { data: profile, error: profileError } = await authClient
          .from('profiles')
          .select('migration_goal, future_occupation')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('ユーザープロファイルの取得に失敗しました:', profileError);
        } else if (profile) {
          if (profile.migration_goal) {
            userMigrationGoal = profile.migration_goal;
            console.log(`AIエージェント: ユーザーの移住目標: ${userMigrationGoal}`);
          }
          
          if (profile.future_occupation) {
            userFutureOccupation = profile.future_occupation;
            console.log(`AIエージェント: ユーザーの希望職種ID: ${userFutureOccupation}`);
            
            // 希望職種の詳細情報を取得
            try {
              const { data: jobPosition, error: jobPositionError } = await authClient
                .from('job_positions')
                .select('id, title, description, industry')
                .eq('id', profile.future_occupation)
                .single();
                
              if (jobPositionError) {
                console.error('職種情報の取得に失敗しました:', jobPositionError);
              } else if (jobPosition) {
                console.log(`AIエージェント: ユーザーの希望職種: ${jobPosition.title} (${jobPosition.industry || '業界不明'})`);
              }
            } catch (jobPositionError) {
              console.error('職種情報取得エラー:', jobPositionError);
            }
          }
        }
      } catch (profileError) {
        console.error('ユーザープロファイル取得エラー:', profileError);
      }
    }
    
    // 推奨コースを取得
    const recommendedCourses = await getRecommendedCourses(userMigrationGoal, userFutureOccupation);
    console.log(`AIエージェント: 移住目標「${userMigrationGoal}」と希望職種に基づく推奨コース（${recommendedCourses.length}件）を取得しました`);
    
    // コース情報の詳細をログに出力（デバッグ用）
    if (courseResults.length > 0) {
      console.log(`AIエージェント: 検索結果に一致したコース情報（${courseResults.length}件）を表示します`);
      courseResults.forEach((course, index) => {
        console.log(`AIエージェント: コース情報 ${index + 1}/${courseResults.length}:`);
        console.log(`  - 名前: ${course.name}`);
        console.log(`  - カテゴリ: ${course.category || 'なし'}`);
        console.log(`  - 説明: ${course.description?.substring(0, 50)}...`);
        // schoolsとschoolの両方をチェックして学校情報を表示
        const schoolName = course.school?.name || course.schools?.name || '情報なし';
        console.log(`  - 学校: ${schoolName}`);
        // 場所情報も同様に両方をチェック
        const location = course.school?.goal_location || course.schools?.goal_location;
        console.log(`  - 場所: ${location ? `${location.city || 'なし'}, ${location.country || 'なし'}` : 'なし, なし'}`);
        console.log(`  - 科目数: ${course.course_subjects?.length || 0}件`);
      });
    } else {
      console.log(`AIエージェント: 検索クエリに一致するコース情報が見つかりませんでした。全てのコース情報を表示します。`);
      
      // 全てのコース情報を表示
      console.log(`AIエージェント: 全てのコース情報（${allCourses.length}件）を表示します`);
      allCourses.forEach((course, index) => {
        console.log(`AIエージェント: コース情報 ${index + 1}/${allCourses.length}:`);
        console.log(`  - 名前: ${course.name}`);
        console.log(`  - カテゴリ: ${course.category || 'なし'}`);
        console.log(`  - 説明: ${course.description?.substring(0, 50)}...`);
        // schoolsとschoolの両方をチェックして学校情報を表示
        const schoolName = course.school?.name || course.schools?.name || '情報なし';
        console.log(`  - 学校: ${schoolName}`);
        // 場所情報も同様に両方をチェック
        const location = course.school?.goal_location || course.schools?.goal_location;
        console.log(`  - 場所: ${location ? `${location.city || 'なし'}, ${location.country || 'なし'}` : 'なし, なし'}`);
        console.log(`  - 科目数: ${course.course_subjects?.length || 0}件`);
      });
    }
    
    console.log(`AIエージェント: インタビュー記事の検索を開始します...`);
    
    // 通常の検索とキーワード検索の両方を実行
    const [interviewResults, keywordInterviewResults] = await Promise.all([
      searchInterviews(query),
      searchInterviewsByKeywords(keywords)
    ]);
    
    console.log(`AIエージェント: 直接検索で${interviewResults.length}件、キーワード検索で${keywordInterviewResults.length}件のインタビュー記事が見つかりました`);
    
    // 結果を統合して重複を排除
    const allInterviews = [...interviewResults, ...keywordInterviewResults];
    const uniqueInterviews = Array.from(
      new Map(allInterviews.map(item => [item.id, item])).values()
    );
    
    // 最新の記事から順にソート
    const sortedInterviews = uniqueInterviews.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.revisedAt || a.createdAt || 0);
      const dateB = new Date(b.publishedAt || b.revisedAt || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime(); // 降順（最新が先頭）
    });
    
    // 最新の30件だけに制限
    const limitedInterviews = sortedInterviews.slice(0, 30);
    
    console.log(`AIエージェント: ${visaResults.length}件のビザ情報、${courseResults.length}件のコース情報、${sortedInterviews.length}件のインタビュー記事が見つかりました`);
    console.log(`AIエージェント: インタビュー記事を公開日の新しい順にソートし、最新の30件に制限しました`);

    // 検索結果をコンテキストとして整形
    const context: string[] = [];

    // Frogに関する情報をコンテキストに追加
    if (keywords.includes('Frog') || query.toLowerCase().includes('frog')) {
      try {
        // about_frog.jsonファイルを読み込む
        const aboutFrogPath = path.join(process.cwd(), 'app/api/aiagent/setup/about_frog.json');
        const aboutFrogData = JSON.parse(fs.readFileSync(aboutFrogPath, 'utf8'));
        
        console.log(`AIエージェント: Frogに関する情報をコンテキストに追加します`);
        
        // 会社概要をコンテキストに追加
        context.push(`
【Frog会社情報】
会社名: ${aboutFrogData.company_name}
概要: ${aboutFrogData.description}

【Frogの強み】
${aboutFrogData.strengths.map((strength: string) => `- ${strength}`).join('\n')}

【Frogのサービス】
1. 就職支援: ${aboutFrogData.services.job_support.description}
   ${aboutFrogData.services.job_support.details.map((detail: string) => `   - ${detail}`).join('\n')}

2. 留学支援: ${aboutFrogData.services.study_abroad.description}
   ${aboutFrogData.services.study_abroad.details.map((detail: string) => `   - ${detail}`).join('\n')}

3. ビザサポート: ${aboutFrogData.services.visa_support.description}
   ${aboutFrogData.services.visa_support.details.map((detail: string) => `   - ${detail}`).join('\n')}

4. PEO・フリーランス支援: ${aboutFrogData.services.peo_freelance.description}
   ${aboutFrogData.services.peo_freelance.details.map((detail: string) => `   - ${detail}`).join('\n')}

【Frogのコミュニティ】
概要: ${aboutFrogData.community.description}

1. 非公開コミュニティ: ${aboutFrogData.community.types.closed.description}
   活動内容: ${aboutFrogData.community.types.closed.activities.join('、')}

2. オープンコミュニティ: ${aboutFrogData.community.types.open.description}
   活動内容: ${aboutFrogData.community.types.open.activities.join('、')}
        `);
        
        console.log(`AIエージェント: Frogに関する情報をコンテキストに追加しました`);
      } catch (error) {
        console.error('Frog情報の読み込みエラー:', error);
      }
    }

    // ビザ情報をコンテキストに追加
    if (visaResults.length > 0) {
      visaResults.forEach((visa) => {
        console.log(`AIエージェント: ビザ情報をコンテキストに追加 - ${visa.name}`);
        context.push(`
【ビザ情報】
タイプ: ${visa.name}
説明: ${visa.description}
要件: ${visa.requirements || '情報なし'}
申請プロセス: ${visa.process || '情報なし'}
公式URL: ${visa.official_url || '情報なし'}
        `);
      });
    } else {
      console.log(`AIエージェント: ビザ情報が見つかりませんでした`);
    }

    // コース情報をコンテキストに追加
    if (courseResults.length > 0) {
      // コースに関する質問の場合は、常に全てのコース情報を追加
      if (keywords.includes('コース')) {
        console.log(`AIエージェント: コースに関する質問のため、全てのコース情報（${allCourses.length}件）をコンテキストに追加します`);
        
        // ユーザーの希望職種に関連するコースを優先的に表示
        let prioritizedCourses = [...allCourses];
        
        if (userFutureOccupation) {
          try {
            // 希望職種に関連するコースIDを取得
            const { data: jobPositionCourses, error: jobPositionError } = await authClient
              .from('course_job_positions')
              .select('course_id')
              .eq('job_position_id', userFutureOccupation);
            
            if (!jobPositionError && jobPositionCourses && jobPositionCourses.length > 0) {
              // 関連するコースIDを抽出
              const relatedCourseIds = jobPositionCourses.map(item => item.course_id);
              console.log(`AIエージェント: 希望職種に関連するコースID: ${relatedCourseIds.join(', ')}`);
              
              // 希望職種に関連するコースを先頭に配置
              prioritizedCourses.sort((a, b) => {
                const aIsRelated = relatedCourseIds.includes(a.id);
                const bIsRelated = relatedCourseIds.includes(b.id);
                
                if (aIsRelated && !bIsRelated) return -1;
                if (!aIsRelated && bIsRelated) return 1;
                return 0;
              });
              
              // 希望職種に関連するコースの数を表示
              const relatedCoursesCount = prioritizedCourses.filter(course => 
                relatedCourseIds.includes(course.id)
              ).length;
              
              console.log(`AIエージェント: 希望職種に関連するコース（${relatedCoursesCount}件）を優先表示します`);
            }
          } catch (error) {
            console.error('希望職種に関連するコース取得エラー:', error);
          }
        }
        
        prioritizedCourses.forEach((course) => {
          console.log(`AIエージェント: コース情報をコンテキストに追加 - ${course.name}`);
          
          // 科目情報を整形
          const subjectsText = course.course_subjects && course.course_subjects.length > 0
            ? course.course_subjects.map(subject => `- ${subject.title}: ${subject.description || 'No description'}`).join('\n')
            : '科目情報なし';
          
          // schoolsとschoolの両方をチェックして学校情報を表示
          const schoolName = course.school?.name || course.schools?.name || '情報なし';
          // 場所情報も同様に両方をチェック
          const location = course.school?.goal_location || course.schools?.goal_location;
          const locationText = location ? `${location.city || '情報なし'}, ${location.country || '情報なし'}` : '情報なし';
          
          context.push(`
【コース情報】
名前: **${course.name}**
カテゴリ: ${course.category || '情報なし'}
説明: ${course.description || '情報なし'}
期間: ${course.total_weeks || 0}週間（授業: ${course.lecture_weeks || 0}週間、就労: ${course.work_permit_weeks || 0}週間）
学費: ${course.tuition_and_others ? `$${course.tuition_and_others.toLocaleString()}` : '情報なし'}
開始日: ${course.start_date || '情報なし'}
学校: ${schoolName}
場所: ${locationText}

【科目情報】
${subjectsText}
          `);
        });
      } else {
        // コースに関する質問でない場合は、検索結果に一致したコース情報のみを追加
        courseResults.forEach((course) => {
          console.log(`AIエージェント: コース情報をコンテキストに追加 - ${course.name}`);
          
          // 科目情報を整形
          const subjectsText = course.course_subjects && course.course_subjects.length > 0
            ? course.course_subjects.map(subject => `- ${subject.title}: ${subject.description || 'No description'}`).join('\n')
            : '科目情報なし';
          
          // schoolsとschoolの両方をチェックして学校情報を表示
          const schoolName = course.school?.name || course.schools?.name || '情報なし';
          // 場所情報も同様に両方をチェック
          const location = course.school?.goal_location || course.schools?.goal_location;
          const locationText = location ? `${location.city || '情報なし'}, ${location.country || '情報なし'}` : '情報なし';
          
          context.push(`
【コース情報】
名前: **${course.name}**
カテゴリ: ${course.category || '情報なし'}
説明: ${course.description || '情報なし'}
期間: ${course.total_weeks || 0}週間（授業: ${course.lecture_weeks || 0}週間、就労: ${course.work_permit_weeks || 0}週間）
学費: ${course.tuition_and_others ? `$${course.tuition_and_others.toLocaleString()}` : '情報なし'}
開始日: ${course.start_date || '情報なし'}
学校: ${schoolName}
場所: ${locationText}

【科目情報】
${subjectsText}
          `);
        });
      }
    } else {
      console.log(`AIエージェント: 検索クエリに一致するコース情報が見つかりませんでした。全てのコース情報を追加します。`);
      
      // 全てのコース情報をコンテキストに追加
      allCourses.forEach((course) => {
        console.log(`AIエージェント: コース情報をコンテキストに追加 - ${course.name}`);
        
        // 科目情報を整形
        const subjectsText = course.course_subjects && course.course_subjects.length > 0
          ? course.course_subjects.map(subject => `- ${subject.title}: ${subject.description || 'No description'}`).join('\n')
          : '科目情報なし';
        
        // schoolsとschoolの両方をチェックして学校情報を表示
        const schoolName = course.school?.name || course.schools?.name || '情報なし';
        // 場所情報も同様に両方をチェック
        const location = course.school?.goal_location || course.schools?.goal_location;
        const locationText = location ? `${location.city || '情報なし'}, ${location.country || '情報なし'}` : '情報なし';
        
        context.push(`
【コース情報】
名前: **${course.name}**
カテゴリ: ${course.category || '情報なし'}
説明: ${course.description || '情報なし'}
期間: ${course.total_weeks || 0}週間（授業: ${course.lecture_weeks || 0}週間、就労: ${course.work_permit_weeks || 0}週間）
学費: ${course.tuition_and_others ? `$${course.tuition_and_others.toLocaleString()}` : '情報なし'}
開始日: ${course.start_date || '情報なし'}
学校: ${schoolName}
場所: ${locationText}

【科目情報】
${subjectsText}
        `);
      });
    }
    
    // 推奨コースをコンテキストに追加
    if (recommendedCourses.length > 0 && userMigrationGoal) {
      console.log(`AIエージェント: 移住目標「${userMigrationGoal}」に基づく推奨コースをコンテキストに追加`);
      
      const goalLabels: {[key: string]: string} = {
        "overseas_job": "海外就職",
        "improve_language": "語学力向上",
        "career_change": "キャリアチェンジ",
        "find_new_home": "移住先探し"
      };
      
      const goalLabel = goalLabels[userMigrationGoal] || userMigrationGoal;
      
      // 希望職種の情報を取得
      let jobPositionInfo = "";
      if (userFutureOccupation) {
        try {
          const { data: jobPosition, error: jobPositionError } = await authClient
            .from('job_positions')
            .select('title, industry')
            .eq('id', userFutureOccupation)
            .single();
            
          if (!jobPositionError && jobPosition) {
            jobPositionInfo = `希望職種「${jobPosition.title}」${jobPosition.industry ? `（${jobPosition.industry}業界）` : ""}`;
            console.log(`AIエージェント: ${jobPositionInfo}に基づく推奨コースをコンテキストに追加`);
          }
        } catch (jobPositionError) {
          console.error('職種情報取得エラー:', jobPositionError);
        }
      }
      
      context.push(`
【あなたの目標「${goalLabel}」${jobPositionInfo ? `と${jobPositionInfo}` : ""}に基づく推奨コース】
以下のコースはあなたの目標に合わせて推奨されています:
${recommendedCourses.map((course, index) => `
${index + 1}. **${course.name}**（${course.school?.name || '情報なし'}）
   場所: ${course.school?.goal_location?.city || '情報なし'}, ${course.school?.goal_location?.country || '情報なし'}
   期間: ${course.total_weeks || '情報なし'}週間
   学費: ${course.tuition_and_others ? `${course.tuition_and_others.toLocaleString()}カナダドル` : '情報なし'}
`).join('')}
      `);
    }

    // インタビュー記事の情報を抽出して分析
    const interviewAnalysis = {
      total: sortedInterviews.length,
      canadaJobs: 0,
      details: [] as any[]
    };

    console.log(`AIエージェント: インタビュー記事の分析を開始します...`);

    // インタビュー記事をコンテキストに追加
    if (limitedInterviews.length > 0) {
      limitedInterviews.forEach((interview, index) => {
        // インタビュー内容から情報を抽出
        const info = extractInterviewInfo(interview.contents);
        const publishDate = new Date(interview.publishedAt || interview.revisedAt || interview.createdAt || 0).toLocaleDateString('ja-JP');
        
        console.log(`AIエージェント: インタビュー記事 ${index + 1}/${limitedInterviews.length} - タイトル: ${interview.title} (公開日: ${publishDate})`);
        console.log(`  - カナダ就職: ${info.isCanadaJob ? 'はい' : 'いいえ'}`);
        
        // 統計情報を更新
        if (info.isCanadaJob) interviewAnalysis.canadaJobs++;
        
        // 詳細情報を追加
        interviewAnalysis.details.push({
          id: interview.id,
          title: interview.title,
          slug: interview.slug,
          isCanadaJob: info.isCanadaJob,
          publishedAt: interview.publishedAt || interview.revisedAt || interview.createdAt,
          revisedAt: interview.revisedAt,
          createdAt: interview.createdAt
        });
        
        // コンテキストに追加
        context.push(`
【インタビュー記事】
タイトル: ${interview.title}
URL: /interviews/${interview.slug}
公開日: ${publishDate}
カナダ就職: ${info.isCanadaJob ? 'はい' : 'いいえ'}
内容: ${info.plainText.substring(0, 500)}...
        `);
      });
    }

    // 分析結果をコンテキストに追加
    if (limitedInterviews.length > 0) {
      const analysisText = `
【インタビュー記事の分析結果】
総記事数: ${interviewAnalysis.total}件
カナダ就職の記事: ${interviewAnalysis.canadaJobs}件
※記事は公開日の新しい順に参照しています
※最新の30件のみを表示しています
※これらは検索結果に基づく数値であり、実際のインタビュー記事の総数とは異なる場合があります
      `;
      
      context.push(analysisText);
      console.log(`AIエージェント: 分析結果\n${analysisText}`);
    } else {
      context.push(`
【インタビュー記事の分析結果】
インタビュー記事は見つかりませんでした。
      `);
      console.log(`AIエージェント: インタビュー記事は見つかりませんでした`);
    }

    console.log(`AIエージェント: コンテキスト情報を${context.length}件作成しました`);

    // 回答を生成
    console.log(`AIエージェント: OpenAI APIを呼び出して回答を生成します...`);
    const answer = await generateAnswer(query, context, chatHistory);
    console.log(`AIエージェント: 回答が生成されました（${answer?.length || 0}文字）`);

    // AIの回答を保存（認証済みユーザーの場合）
    if (user && answer) {
      try {
        const { error: insertError } = await authClient
          .from('ai_messages')
          .insert({
            user_id: user.id,
            session_id: session_id,
            sender: 'assistant',
            content: answer,
            metadata: {
              relevantInfo: {
                visaSources: visaResults.length,
                courseSources: courseResults.length,
                interviewSources: limitedInterviews.length
              }
            }
          });
          
        if (insertError) {
          console.error('AIアシスタントの回答の保存に失敗しました:', insertError);
        } else {
          console.log(`AIエージェント: AIアシスタントの回答をai_messagesテーブルに保存しました`);
        }
      } catch (saveError) {
        console.error('AIアシスタントの回答の保存エラー:', saveError);
      }
    }

    // セッションIDが指定されている場合、会話履歴を保存（既存のmessagesテーブル用）
    if (sessionId && answer) {
      console.log(`AIエージェント: セッション ${sessionId} に会話履歴を保存します`);
      try {
        // サービスロールを使用してRLSをバイパス
        await supabaseAdmin.from('messages').insert({
          session_id: sessionId,
          sender_id: userId || 'anonymous',
          content: query,
        });

        await supabaseAdmin.from('messages').insert({
          session_id: sessionId,
          sender_id: 'assistant',
          content: answer,
        });
        console.log(`AIエージェント: 会話履歴の保存に成功しました`);
      } catch (error) {
        console.error('AIエージェント: 会話履歴の保存に失敗しました', error);
      }
    }

    // 関連するインタビュー記事のみを抽出（最新順を維持）
    const relevantInterviews = interviewAnalysis.details
      .filter(item => {
        // 質問に応じてフィルタリング
        if (query.includes('カナダ') && (query.includes('就職') || query.includes('仕事'))) {
          return item.isCanadaJob;
        }
        return true;
      })
      .map(item => ({
        title: item.title,
        slug: item.slug,
        publishedAt: item.publishedAt || item.revisedAt || item.createdAt
      }));

    // 関連するコース情報を整形
    const relevantCourses = courseResults.map(course => ({
      id: course.id,
      title: course.name,
      school: course.school?.name || '',
      location: course.school?.goal_location ? 
        `${course.school.goal_location.city}, ${course.school.goal_location.country}` : '',
      tuition: course.tuition_and_others
    }));

    // レスポンスを作成
    const response = {
      answer,
      sessionId: session_id,
      sources: {
        visa: visaResults.map(v => ({ title: v.name, url: v.official_url })),
        courses: relevantCourses,
        interviews: relevantInterviews,
      },
      analysis: {
        total: interviewAnalysis.total,
        canadaJobs: interviewAnalysis.canadaJobs
      },
      recommendations: recommendedCourses.length > 0 ? {
        migrationGoal: userMigrationGoal,
        futureOccupation: userFutureOccupation ? {
          id: userFutureOccupation,
          title: null,
          industry: null
        } : null,
        courses: recommendedCourses.map(course => ({
          id: course.id,
          title: course.name,
          school: course.school?.name || '',
          location: course.school?.goal_location ? 
            `${course.school.goal_location.city}, ${course.school.goal_location.country}` : '',
          tuition: course.tuition_and_others
        }))
      } : null
    };

    // 希望職種の詳細情報を取得
    if (userFutureOccupation && response.recommendations?.futureOccupation) {
      try {
        const { data: jobPosition, error: jobPositionError } = await authClient
          .from('job_positions')
          .select('title, industry')
          .eq('id', userFutureOccupation)
          .single();
          
        if (!jobPositionError && jobPosition) {
          response.recommendations.futureOccupation.title = jobPosition.title;
          response.recommendations.futureOccupation.industry = jobPosition.industry;
        }
      } catch (jobPositionError) {
        console.error('職種情報取得エラー:', jobPositionError);
      }
    }

    console.log(`AIエージェント: レスポンスを返します`, {
      sessionId: session_id,
      visaSources: response.sources.visa.length,
      courseSources: response.sources.courses.length,
      interviewSources: response.sources.interviews.length,
      hasRecommendations: !!response.recommendations
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Agent API error:', error);
    return NextResponse.json(
      { error: '回答の生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 質問からキーワードを抽出する関数
function extractKeywords(query: string): string[] {
  // 重要なキーワードのリスト
  const importantKeywords = [
    'エンジニア', 'プログラマー', 'デベロッパー', 'デザイナー', '開発者', 'IT', 'テック', 'テクノロジー',
    'カナダ', 'バンクーバー', 'トロント', 'カルガリー', 'モントリオール', 'オタワ',
    '就職', '仕事', 'ジョブ', '転職', 'キャリア', '働く', '勤務',
    'ビザ', 'ワーホリ', 'ワーキングホリデー', '永住権', 'PR', '学生ビザ',
    'Frog', 'フロッグ', 'インタビュー', '体験談',
    'コース', 'プログラム', 'カリキュラム', '学校', 'カレッジ', '大学', '留学'
  ];
  
  // クエリを小文字に変換して単語に分割
  const words = query.toLowerCase().split(/\s+/);
  
  // 重要なキーワードを抽出
  const extractedKeywords = importantKeywords.filter(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // 一般的な単語（3文字以上）も追加
  const generalKeywords = words
    .filter(word => word.length >= 3)
    .filter(word => !extractedKeywords.some(k => k.toLowerCase() === word));
  
  return [...extractedKeywords, ...generalKeywords.slice(0, 3)];
}

// 質問に科目情報が必要かどうかを判断する関数
function queryRequiresDetailedInfo(query: string): boolean {
  // 詳細情報を必要とするキーワードのリスト
  const detailKeywords = [
    '詳細', '詳しく', '科目', 'カリキュラム', '内容', 'subject', 'curriculum', 'detail',
    '何を学ぶ', '何を勉強', 'どんな内容', 'どんな科目', 'どんなカリキュラム',
    '授業内容', '授業科目', 'どのような授業', 'どのような科目'
  ];
  
  // クエリを小文字に変換
  const lowerQuery = query.toLowerCase();
  
  // 詳細情報を必要とするキーワードが含まれているかチェック
  return detailKeywords.some(keyword => 
    lowerQuery.includes(keyword.toLowerCase())
  );
} 