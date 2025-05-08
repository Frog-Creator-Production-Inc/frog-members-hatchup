"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, DollarSign, MapPin, GraduationCap, Briefcase } from "lucide-react"
import Image from "next/image"

interface SchoolPhoto {
  id: string
  url: string
  description: string
}

interface GoalLocation {
  id: string
  city: string
  country: string
}

interface School {
  id: string
  name: string
  logo_url: string
  school_photos?: SchoolPhoto[]
  goal_locations?: GoalLocation
}

interface IntakeDate {
  id: string
  course_id: string
  month: number
  day?: number | null
  year?: number | null
  is_tentative: boolean
}

interface Course {
  id: string
  name: string
  category: string
  total_weeks: number
  intake_dates?: IntakeDate[]
  tuition_and_others: number
  migration_goals?: string[]
  schools: School
  photos?: SchoolPhoto[]
}

interface JobPosition {
  id: string
  title: string
  description: string | null
  industry: string | null
}

// CourseCardコンポーネント
function CourseCard({ course, userGoal, jobPosition }: { course: Course, userGoal: string | null, jobPosition: JobPosition | null }) {
  // 渡航目的の表示名マッピング
  const goalLabels: Record<string, string> = {
    overseas_job: "海外就職",
    improve_language: "語学力向上",
    career_change: "キャリアチェンジ",
    find_new_home: "移住先探し"
  };

  // コース専用の写真があればそれを使用し、なければスクールの写真を使用する
  const coursePhotoUrl = course.photos && course.photos.length > 0
    ? course.photos[0].url
    : course.schools?.school_photos && course.schools.school_photos.length > 0
      ? course.schools.school_photos[0].url
      : "/placeholder.svg";

  // 入学月の表示（月のみ）
  const formatStartMonths = () => {
    if (!course.intake_dates || course.intake_dates.length === 0) return '要問合せ';
    
    // すべての入学月を収集（月のみ）
    const months = new Set<number>();
    
    course.intake_dates.forEach(date => {
      months.add(date.month);
    });
    
    // 月を昇順（若い順）にソート
    const sortedMonths = Array.from(months).sort((a, b) => a - b);
    
    // 月表記に変換して結合
    return sortedMonths.map(month => `${month}月`).join('、 ');
  };

  return (
    <div className="plan">
      <div className="inner">
        <span className="pricing">
          <span>
            {course.tuition_and_others ? `CA$${course.tuition_and_others.toLocaleString()}` : "要問合せ"}
            <small>/ total</small>
          </span>
        </span>
        
        <div className="course-image">
          <Image
            src={coursePhotoUrl}
            alt={`${course.name}の写真`}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        
        <p className="title">{course.name}</p>
        <p className="info">{course.schools?.name || "スクール名"} - {course.schools?.goal_locations?.city || "不明"}, {course.schools?.goal_locations?.country || "不明"}</p>
        <ul className="features">
          <li>
            <span className="icon">
              <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
              </svg>
            </span>
            <span>開始月: <strong>{formatStartMonths()}</strong></span>
          </li>
          <li>
            <span className="icon">
              <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
              </svg>
            </span>
            <span>期間: <strong>{course.total_weeks ? `${course.total_weeks}週間` : "要問合せ"}</strong></span>
          </li>
          <li>
            <span className="icon">
              <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
              </svg>
            </span>
            <span>カテゴリー: <strong>{course.category || "一般"}</strong></span>
          </li>
        </ul>
        <div className="action">
          <Link href={`/courses/${course.id}`} className="button">
            詳細を見る
          </Link>
        </div>
      </div>
    </div>
  );
}

// 型変換ヘルパー関数を追加
function normalizeSchool(schoolData: any): School {
  if (!schoolData) return {} as School;
  
  return {
    id: schoolData.id || '',
    name: schoolData.name || '',
    logo_url: schoolData.logo_url || '',
    school_photos: schoolData.school_photos || [],
    goal_locations: schoolData.goal_locations || undefined
  };
}

function normalizeCourse(courseData: any): Course {
  return {
    id: courseData.id || '',
    name: courseData.name || '',
    category: courseData.category || '',
    total_weeks: courseData.total_weeks || 0,
    intake_dates: courseData.course_intake_dates || [],
    tuition_and_others: courseData.tuition_and_others || 0,
    migration_goals: courseData.migration_goals || [],
    schools: normalizeSchool(Array.isArray(courseData.schools) ? courseData.schools[0] : courseData.schools),
    photos: courseData.photos || []
  };
}

export function RecommendedCourses() {
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userGoal, setUserGoal] = useState<string | null>(null)
  const [jobPosition, setJobPosition] = useState<JobPosition | null>(null)
  const [error, setError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const supabase = createClientComponentClient()

  // 渡航目的の表示名マッピング
  const goalLabels: Record<string, string> = {
    overseas_job: "海外就職",
    improve_language: "語学力向上",
    career_change: "キャリアチェンジ",
    find_new_home: "移住先探し"
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // ユーザーのプロファイル情報を取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('migration_goal, future_occupation')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("プロファイル取得エラー:", profileError);
          return;
        }

        // migration_goalが設定されている場合、コースを取得
        if (profileData?.migration_goal) {
          setUserGoal(profileData.migration_goal);
        }

        // future_occupationが設定されている場合、職業情報を取得
        if (profileData?.future_occupation) {
          const { data: jobPositionData, error: jobPositionError } = await supabase
            .from('job_positions')
            .select('*')
            .eq('id', profileData.future_occupation)
            .single();

          if (!jobPositionError && jobPositionData) {
            setJobPosition(jobPositionData);
          }
        }

        // コースを取得
        await fetchRecommendedCourses(user.id, profileData?.migration_goal, profileData?.future_occupation);
      } catch (error) {
        console.error("ユーザー情報取得エラー:", error);
        setError(true);
        setErrorMessage("ユーザー情報の取得に失敗しました");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  const fetchRecommendedCourses = async (userId: string, userGoal?: string, futureOccupation?: string) => {
    try {
      setLoading(true);
      
      // 職業ポジションに基づいたコース取得を試みる
      if (futureOccupation) {
        const { data: jobPositionCourses, error: jobPositionError } = await supabase
          .from("course_job_positions")
          .select(`
            course_id,
            courses:course_id (
              id,
              name,
              category,
              total_weeks,
              course_intake_dates (
                id,
                course_id,
                month,
                day,
                year,
                is_tentative
              ),
              tuition_and_others,
              migration_goals,
              schools (
                id,
                name,
                logo_url,
                school_photos (
                  id,
                  url,
                  description
                ),
                goal_locations (
                  id,
                  city,
                  country
                )
              )
            )
          `)
          .eq("job_position_id", futureOccupation)
          .limit(6);

        if (!jobPositionError && jobPositionCourses && jobPositionCourses.length > 0) {
          // コースデータを整形
          const formattedCourses = jobPositionCourses
            .filter(item => item.courses) // nullチェック
            .map(item => normalizeCourse(item.courses));
          
          // コース専用の写真を取得
          await fetchCoursePhotos(formattedCourses);
          
          setRecommendedCourses(formattedCourses);
          setLoading(false);
          return;
        }
      }
      
      // 職業ポジションに基づくコースが見つからない場合、移住目的に基づいてコースを取得
      if (userGoal) {
        const { data: goalCourses, error: goalError } = await supabase
          .from("courses")
          .select(`
            id,
            name,
            category,
            total_weeks,
            course_intake_dates (
              id,
              course_id,
              month,
              day,
              year,
              is_tentative
            ),
            tuition_and_others,
            migration_goals,
            schools (
              id,
              name,
              logo_url,
              school_photos (
                id,
                url,
                description
              ),
              goal_locations (
                id,
                city,
                country
              )
            )
          `)
          .or(`migration_goals.cs.{${userGoal}},migration_goals.cs.{"${userGoal}"}`)
          .limit(6);

        if (!goalError && goalCourses && goalCourses.length > 0) {
          const normalizedCourses = goalCourses.map(course => normalizeCourse(course));
          
          // コース専用の写真を取得
          await fetchCoursePhotos(normalizedCourses);
          
          setRecommendedCourses(normalizedCourses);
          setLoading(false);
          return;
        }
      }
      
      // どちらの方法でもコースが見つからない場合、ランダムにコースを取得
      const { data: randomCourses, error: randomError } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          category,
          total_weeks,
          course_intake_dates (
            id,
            course_id,
            month,
            day,
            year,
            is_tentative
          ),
          tuition_and_others,
          migration_goals,
          schools (
            id,
            name,
            logo_url,
            school_photos (
              id,
              url,
              description
            ),
            goal_locations (
              id,
              city,
              country
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (randomError) throw randomError;
      
      const normalizedCourses = randomCourses.map(course => normalizeCourse(course));
      
      // コース専用の写真を取得
      await fetchCoursePhotos(normalizedCourses);
      
      setRecommendedCourses(normalizedCourses);
    } catch (error: any) {
      console.error("おすすめコース取得エラー:", error);
      setError(true);
      setErrorMessage(error.message || "不明なエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };
  
  // コース専用の写真を別のクエリで取得する関数
  const fetchCoursePhotos = async (courses: Course[]) => {
    try {
      if (!courses || courses.length === 0) return;
      
      // コースIDのリストを作成
      const courseIds = courses.map(course => course.id);

      // 明示的なクエリを使用して写真を取得（リレーションシップに依存しない）
      const { data: coursePhotos, error: photosError } = await supabase
        .from("school_photos")
        .select("id, url, description, course_id")
        .filter('course_id', 'in', `(${courseIds.map(id => `"${id}"`).join(',')})`)
        .not('course_id', 'is', null);
      
      // エラーが発生した場合、別の方法を試す
      if (photosError) {
        console.error("コース写真取得エラー:", photosError);
        
        // 代替方法1: テキストクエリを使用
        try {
          const { data: alternativePhotos, error: alternativeError } = await supabase
            .rpc('get_photos_by_course_ids_alt', { 
              ids_param: courseIds.join(',') 
            });
            
          if (!alternativeError && alternativePhotos && alternativePhotos.length > 0) {
            courses.forEach(course => {
              const photos = alternativePhotos.filter((photo: any) => 
                photo.course_id === course.id);
              if (photos.length > 0) {
                course.photos = photos;
              }
            });
            return;
          } else if (alternativeError) {
            console.error("代替写真取得エラー:", alternativeError);
          }
        } catch (alternativeQueryError) {
          console.error("代替クエリエラー:", alternativeQueryError);
        }
        
        // 代替方法2: 単純なSQL文字列で直接クエリ
        try {
          const { data: rawPhotos, error: rawError } = await supabase
            .from('school_photos')
            .select('id, url, description, course_id')
          
          if (!rawError && rawPhotos) {
            const filteredPhotos = rawPhotos.filter(photo => 
              photo.course_id && courseIds.includes(photo.course_id));
              
            if (filteredPhotos.length > 0) {
              courses.forEach(course => {
                const photos = filteredPhotos.filter(photo => 
                  photo.course_id === course.id);
                if (photos.length > 0) {
                  course.photos = photos;
                }
              });
              return;
            }
          }
        } catch (rawQueryError) {
          console.error("生クエリエラー:", rawQueryError);
        }
        
        // どの方法も失敗した場合はサイレントに失敗（写真なしで続行）
        return;
      }
      
      if (coursePhotos && coursePhotos.length > 0) {
        // 各コースにそれぞれの写真を割り当てる
        courses.forEach(course => {
          const photos = coursePhotos.filter(photo => photo.course_id === course.id);
          if (photos.length > 0) {
            course.photos = photos;
          }
        });
      }
    } catch (error) {
      console.error("コース写真取得中のエラー:", error);
      // エラーが発生してもクラッシュしないように無視して続行
    }
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>あなたにおすすめのコース</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[180px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          おすすめコースの読み込み中にエラーが発生しました。後ほど再度お試しください。
        </h3>
        <p className="text-sm text-red-600">エラー詳細: {errorMessage}</p>
      </div>
    );
  }

  // タイトルテキストを生成
  const generateTitle = () => {
    const parts = [];
    
    if (userGoal) {
      parts.push(`「${goalLabels[userGoal] || userGoal}」`);
    }
    
    if (jobPosition) {
      parts.push(`「${jobPosition.title}」を目指す方`);
    }
    
    if (parts.length === 0) {
      return "あなたにおすすめのコース";
    }
    
    return `${parts.join('のため')}におすすめのコース`;
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center">
        {jobPosition && (
          <Briefcase className="w-5 h-5 mr-2 text-primary" />
        )}
        <CardTitle className="leading-2">{generateTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {recommendedCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">あなたの目的に合ったコースが見つかりませんでした。</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} userGoal={userGoal} jobPosition={jobPosition} />
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/courses">
              全てのコースを見る
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 