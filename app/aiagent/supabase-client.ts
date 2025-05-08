import { createClient } from '@supabase/supabase-js';

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

// ビザ情報の型定義
export interface VisaInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  requirements: string;
  process: string;
  official_url: string;
  created_at?: string;
  updated_at?: string;
}

// コース情報の型定義
export interface CourseInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  total_weeks: number;
  lecture_weeks: number;
  work_permit_weeks: number;
  tuition_and_others: number;
  start_date: string;
  migration_goals: string[];
  created_at?: string;
  updated_at?: string;
  school_id: string;
  school?: {
    id: string;
    name: string;
    goal_location?: {
      id: string;
      city: string;
      country: string;
    }
  };
  // Supabaseのネスト結果用に追加
  schools?: {
    id: string;
    name: string;
    goal_location?: {
      id: string;
      city: string;
      country: string;
    }
  };
  course_subjects?: CourseSubject[];
}

// コース科目の型定義
export interface CourseSubject {
  id: string;
  course_id: string;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

// キーワードでビザ情報を検索する関数
export async function searchVisaInfo(query: string): Promise<VisaInfo[]> {
  try {
    console.log(`Supabase: "${query}"でビザ情報を検索中...`);
    
    // ビザに関するキーワードを抽出
    const visaKeywords = extractVisaKeywords(query);
    console.log(`Supabase: ビザ関連キーワード: ${visaKeywords.join(', ')}`);
    
    // ビザ関連のキーワードがある場合は検索を実行
    if (visaKeywords.length > 0) {
      // 検索条件を構築
      let conditions = [];
      
      // 各キーワードで検索条件を追加
      for (const keyword of visaKeywords) {
        conditions.push(`name.ilike.%${keyword}%`);
        conditions.push(`description.ilike.%${keyword}%`);
        conditions.push(`requirements.ilike.%${keyword}%`);
        conditions.push(`process.ilike.%${keyword}%`);
      }
      
      // 検索条件をORで結合
      const filter = conditions.join(',');
      
      // 検索結果を取得（サービスロールを使用）
      const { data, error } = await supabaseAdmin
        .from('visa_types')
        .select('*')
        .or(filter)
        .limit(10); // 上限を増やす
      
      if (error) {
        console.error('Supabase search error:', error);
        return getAllVisaTypes();
      }
      
      console.log(`Supabase: ${data?.length || 0}件のビザ情報が見つかりました`);
      
      // 検索結果がある場合はそれを返す
      if (data && data.length > 0) {
        return data as VisaInfo[];
      }
    }
    
    // 検索結果がない場合や特定のキーワードがない場合は全てのビザタイプを返す
    console.log('Supabase: 検索結果がないため、全てのビザタイプを返します');
    return getAllVisaTypes();
  } catch (error) {
    console.error('Supabase search error:', error);
    return getAllVisaTypes();
  }
}

// キーワードでコース情報を検索する関数
export async function searchCourseInfo(query: string): Promise<CourseInfo[]> {
  try {
    console.log(`Supabase: "${query}"でコース情報を検索中...`);
    
    // コースに関するキーワードを抽出
    const courseKeywords = extractCourseKeywords(query);
    console.log(`Supabase: コース関連キーワード: ${courseKeywords.join(', ')}`);
    
    // 詳細情報が必要かどうかを判断
    const needsDetailedInfo = queryRequiresDetailedInfo(query);
    console.log(`Supabase: 詳細情報が必要: ${needsDetailedInfo ? 'はい' : 'いいえ'}`);
    
    // 検索条件を構築
    let conditions = [];
    
    // 各キーワードで検索条件を追加
    for (const keyword of courseKeywords) {
      conditions.push(`name.ilike.%${keyword}%`);
      conditions.push(`description.ilike.%${keyword}%`);
      conditions.push(`category.ilike.%${keyword}%`);
    }
    
    // 検索条件をORで結合
    const filter = conditions.join(',');
    
    try {
      // 検索結果を取得（サービスロールを使用）
      let selectQuery = `
        *,
        schools (
          id,
          name,
          goal_location:goal_locations (
            id,
            city,
            country
          )
        )
      `;
      
      // 詳細情報が必要な場合は科目情報も取得
      if (needsDetailedInfo) {
        selectQuery += `,
        course_subjects (*)
        `;
      }
      
      // 明示的にテーブル名を指定して検索
      // limit制限を削除し、すべてのコース情報を取得
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select(selectQuery)
        .or(filter);
      
      if (error) {
        console.error('Supabase course search error:', error);
        return getAllCourses(needsDetailedInfo);
      }
      
      console.log(`Supabase: ${data?.length || 0}件のコース情報が見つかりました`);
      
      // 検索結果がある場合はそれを返す
      if (data && data.length > 0) {
        return data as unknown as CourseInfo[];
      }
    } catch (selectError) {
      console.error('Supabase select error:', selectError);
    }
    
    // 検索結果がない場合は全てのコースを返す
    console.log('Supabase: 検索結果がないため、全てのコース情報を取得します');
    return getAllCourses(needsDetailedInfo);
  } catch (error) {
    console.error('Supabase course search error:', error);
    return getAllCourses(false);
  }
}

// 質問が詳細情報を必要とするかどうかを判断する関数
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

// コース情報に科目情報を追加する関数
async function enrichCoursesWithSubjects(courses: CourseInfo[]): Promise<CourseInfo[]> {
  if (!courses || courses.length === 0) return [];
  
  try {
    // コースIDのリストを作成
    const courseIds = courses.map(course => course.id);
    
    // 科目情報を取得
    const { data: subjectsData, error } = await supabaseAdmin
      .from('course_subjects')
      .select('*')
      .in('course_id', courseIds);
    
    if (error) {
      console.error('Supabase subject fetch error:', error);
      return courses;
    }
    
    console.log(`Supabase: ${subjectsData?.length || 0}件の科目情報を取得しました`);
    
    // 科目情報をコースに関連付ける
    const enrichedCourses = courses.map(course => {
      const courseSubjects = subjectsData?.filter(subject => 
        subject.course_id === course.id
      ) || [];
      
      return {
        ...course,
        course_subjects: courseSubjects
      };
    });
    
    return enrichedCourses;
  } catch (error) {
    console.error('Error enriching courses with subjects:', error);
    return courses;
  }
}

// 関連するコースを取得する関数
async function getRelevantCourses(limit: number = 5, includeSubjects: boolean = false): Promise<CourseInfo[]> {
  try {
    try {
      // 基本的なコース情報を取得
      let selectQuery = `
        *,
        schools (
          id,
          name,
          goal_location:goal_locations (
            id,
            city,
            country
          )
        )
      `;
      
      // 詳細情報が必要な場合は科目情報も取得
      if (includeSubjects) {
        selectQuery += `,
        course_subjects (*)
        `;
      }
      
      // サービスロールを使用
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select(selectQuery)
        .limit(limit);
        
      if (error) {
        console.error('Supabase error:', error);
        return [];
      }
      
      console.log(`Supabase: 関連コース（${data?.length || 0}件）を取得しました`);
      return data as unknown as CourseInfo[] || [];
    } catch (selectError) {
      console.error('Supabase select error:', selectError);
      return [];
    }
  } catch (error) {
    console.error('Error fetching relevant courses:', error);
    return [];
  }
}

// ビザ関連のキーワードを抽出する関数
function extractVisaKeywords(query: string): string[] {
  // ビザ関連の重要なキーワードのリスト
  const visaKeywords = [
    'ビザ', 'visa', '永住権', 'PR', '就労', '学生', 'ワーホリ', 'ワーキングホリデー',
    '留学', '就職', '移民', 'カナダ', 'バンクーバー', 'トロント', '申請', '許可'
  ];
  
  // クエリを小文字に変換
  const lowerQuery = query.toLowerCase();
  
  // ビザ関連のキーワードを抽出
  const extractedKeywords = visaKeywords.filter(keyword => 
    lowerQuery.includes(keyword.toLowerCase())
  );
  
  // 常に「ビザ」キーワードを追加（検索範囲を広げるため）
  if (!extractedKeywords.includes('ビザ') && !extractedKeywords.includes('visa')) {
    extractedKeywords.push('ビザ');
  }
  
  return extractedKeywords;
}

// コース関連のキーワードを抽出する関数
function extractCourseKeywords(query: string): string[] {
  // コース関連の重要なキーワードのリスト
  const courseKeywords = [
    'コース', 'course', 'プログラム', 'program', 'カリキュラム', 'curriculum',
    '学校', 'school', '大学', 'university', 'カレッジ', 'college',
    '留学', 'study', '勉強', 'learn', '学ぶ', '授業', 'class',
    'IT', 'Web', 'プログラミング', 'programming', 'デザイン', 'design',
    'ビジネス', 'business', '英語', 'English', '語学', 'language',
    'データサイエンス', 'data science', 'AI', '人工知能', 'artificial intelligence',
    'マーケティング', 'marketing', '会計', 'accounting', '金融', 'finance',
    'ホスピタリティ', 'hospitality', '観光', 'tourism', 'ホテル', 'hotel',
    '料理', 'cooking', 'culinary', '美容', 'beauty', 'ファッション', 'fashion',
    '医療', 'medical', '看護', 'nursing', '健康', 'health', 'ヘルスケア', 'healthcare',
    '建築', 'architecture', '工学', 'engineering', '科学', 'science',
    '芸術', 'art', '音楽', 'music', '映画', 'film', 'メディア', 'media',
    '教育', 'education', '心理学', 'psychology', '社会学', 'sociology',
    '法律', 'law', '政治', 'politics', '国際関係', 'international relations',
    '環境', 'environment', '持続可能性', 'sustainability'
  ];
  
  // クエリを小文字に変換
  const lowerQuery = query.toLowerCase();
  
  // コース関連のキーワードを抽出
  const extractedKeywords = courseKeywords.filter(keyword => 
    lowerQuery.includes(keyword.toLowerCase())
  );
  
  // 常に「コース」キーワードを追加（検索範囲を広げるため）
  if (!extractedKeywords.includes('コース') && !extractedKeywords.includes('course')) {
    extractedKeywords.push('コース');
  }
  
  return extractedKeywords;
}

// 全てのビザタイプを取得する関数
async function getAllVisaTypes(): Promise<VisaInfo[]> {
  try {
    // サービスロールを使用
    const { data, error } = await supabaseAdmin
      .from('visa_types')
      .select('*')
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    console.log(`Supabase: 全てのビザタイプ（${data?.length || 0}件）を取得しました`);
    return data as VisaInfo[] || [];
  } catch (error) {
    console.error('Error fetching all visa types:', error);
    return [];
  }
}

// 特定のビザタイプの詳細情報を取得する関数
export async function getVisaTypeBySlug(slug: string): Promise<VisaInfo | null> {
  try {
    // サービスロールを使用
    const { data, error } = await supabaseAdmin
      .from('visa_types')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

    return data as VisaInfo;
  } catch (error) {
    console.error('Error fetching visa type details:', error);
    return null;
  }
}

// 特定のコースの詳細情報を取得する関数
export async function getCourseById(id: string): Promise<CourseInfo | null> {
  try {
    // サービスロールを使用
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        schools (
          id,
          name,
          goal_location:goal_locations (
            id,
            city,
            country
          )
        ),
        course_subjects (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

    return data as CourseInfo;
  } catch (error) {
    console.error('Error fetching course details:', error);
    return null;
  }
}

// ユーザーの目標に基づいてコースを推奨する関数
export async function getRecommendedCourses(migrationGoal: string, futureOccupation?: string, limit: number = 3): Promise<CourseInfo[]> {
  try {
    // 希望職種が指定されている場合、その職種に関連するコースを優先的に取得
    if (futureOccupation) {
      console.log(`Supabase: 希望職種「${futureOccupation}」に基づくコースを検索します`);
      
      try {
        // まず職種に関連するコースIDを取得
        const { data: jobPositionCourses, error: jobPositionError } = await supabaseAdmin
          .from('course_job_positions')
          .select('course_id')
          .eq('job_position_id', futureOccupation)
          .limit(limit);
        
        if (!jobPositionError && jobPositionCourses && jobPositionCourses.length > 0) {
          // 関連するコースIDを抽出
          const courseIds = jobPositionCourses.map(item => item.course_id);
          console.log(`Supabase: 希望職種に関連するコースID: ${courseIds.join(', ')}`);
          
          // コースの詳細情報を取得
          const { data: courses, error: coursesError } = await supabaseAdmin
            .from('courses')
            .select(`
              *,
              schools (
                id,
                name,
                goal_location:goal_locations (
                  id,
                  city,
                  country
                )
              ),
              course_subjects (*)
            `)
            .in('id', courseIds);
          
          if (!coursesError && courses && courses.length > 0) {
            console.log(`Supabase: 希望職種「${futureOccupation}」に基づくコース（${courses.length}件）を取得しました`);
            return courses as CourseInfo[];
          }
        }
        
        console.log(`Supabase: 希望職種「${futureOccupation}」に基づくコースが見つかりませんでした`);
      } catch (jobPositionError) {
        console.error('Error fetching courses by job position:', jobPositionError);
      }
    }
    
    // 希望職種に基づくコースが見つからない場合、移住目標に基づいてコースを取得
    if (!migrationGoal) {
      return getRelevantCourses(limit);
    }
    
    // サービスロールを使用
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        schools (
          id,
          name,
          goal_location:goal_locations (
            id,
            city,
            country
          )
        ),
        course_subjects (*)
      `)
      .contains('migration_goals', [migrationGoal])
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      return getRelevantCourses(limit);
    }

    if (data && data.length > 0) {
      console.log(`Supabase: 目標「${migrationGoal}」に基づくコース（${data.length}件）を取得しました`);
      return data as CourseInfo[];
    } else {
      // 該当するコースがない場合は関連コースを返す
      console.log(`Supabase: 目標「${migrationGoal}」に基づくコースが見つからないため、関連コースを返します`);
      return getRelevantCourses(limit);
    }
  } catch (error) {
    console.error('Error fetching recommended courses:', error);
    return getRelevantCourses(limit);
  }
}

// 全てのコース情報を取得する関数
export async function getAllCourses(includeSubjects: boolean = false): Promise<CourseInfo[]> {
  try {
    // 基本的なコース情報を取得
    let selectQuery = `
      *,
      schools (
        id,
        name,
        goal_location:goal_locations (
          id,
          city,
          country
        )
      )
    `;
    
    // 詳細情報が必要な場合は科目情報も取得
    if (includeSubjects) {
      selectQuery += `,
      course_subjects (*)
      `;
    }
    
    // サービスロールを使用して明示的にテーブル名を指定
    // limit制限を削除し、すべてのコース情報を取得
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select(selectQuery);
      
    if (error) {
      console.error('Supabase error:', error);
      return [];
    }
    
    console.log(`Supabase: 全てのコース情報（${data?.length || 0}件）を取得しました`);
    
    // コース情報に学校情報が含まれていない場合は、学校情報を取得して追加
    const coursesWithSchools = await Promise.all((data || []).map(async (course: any) => {
      // 学校情報がすでに含まれている場合はそのまま返す
      if (course.schools && course.schools.name) {
        return {
          ...course,
          school: course.schools // schoolsをschoolにマッピング
        };
      }
      
      // 学校情報が含まれていない場合は、school_idを使用して学校情報を取得
      if (course.school_id) {
        try {
          const { data: schoolData, error: schoolError } = await supabaseAdmin
            .from('schools')
            .select(`
              id,
              name,
              goal_location:goal_locations (
                id,
                city,
                country
              )
            `)
            .eq('id', course.school_id)
            .single();
            
          if (schoolError) {
            console.error(`Supabase: コースID ${course.id} の学校情報取得エラー:`, schoolError);
            return {
              ...course,
              school: { id: course.school_id, name: '情報取得エラー' }
            };
          }
          
          if (schoolData) {
            console.log(`Supabase: コースID ${course.id} の学校情報を取得しました: ${schoolData.name}`);
            return {
              ...course,
              school: schoolData,
              schools: schoolData // 互換性のために両方設定
            };
          }
        } catch (schoolFetchError) {
          console.error(`Supabase: コースID ${course.id} の学校情報取得中にエラー:`, schoolFetchError);
        }
      }
      
      // 学校情報が取得できなかった場合
      return {
        ...course,
        school: { id: course.school_id || 'unknown', name: '学校情報なし' }
      };
    }));
    
    console.log(`Supabase: 学校情報を含む全てのコース情報（${coursesWithSchools.length}件）を返します`);
    return coursesWithSchools as CourseInfo[];
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
} 