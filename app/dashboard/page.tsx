import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { calculateProgress } from "@/lib/calculateProgress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, GraduationCap, Rocket, Home, Search, 
  FileText, BarChart2, BookOpen, Calendar, CheckCircle, 
  Plane, MapPin, Target, User, Layers, Grid3X3, ArrowRight, FileCheck
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import Layout from "../components/layout"
import PriorityTasks from "./components/priority-tasks"
import DailyReminders from "./components/daily-reminders"
import RecommendedInfo from "./components/recommended-info"
import DailyQuests from "./components/daily-quests"
import TaskPath from "./components/task-path"
import UserProfile from "./components/user-profile"
import UserJourneyStatus from "./components/user-journey-status"
import { FileUpload } from "./components/file-upload"
import { FavoriteCourses } from "./components/favorite-courses"
import { ApplicationList } from "./components/application-list"
import InterviewArticles from "./components/interview-articles"
// @ts-ignore
import CollegeVisaOptions from "./components/college-visa-options"
import StudyPlanProgress from "./components/study-plan-progress"
// @ts-ignore
import PreDeparturePreparation from "./components/pre-departure-preparation"
import { RecommendedCourses } from "./components/recommended-courses"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getJobPositions } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-client'

export const dynamic = "force-dynamic"

// サーバーコンポーネント用のSupabaseクライアントを作成
const getServerSupabaseClient = () => {
  // 標準のクライアント（Cookieベース）
  const cookieClient = createServerComponentClient({ cookies });
  // サービスロールを使用した直接クライアント
  const directClient = createServerClient();
  
  return {
    cookieClient,
    directClient
  };
};

export default async function DashboardPage() {
  // クライアントを取得
  const { cookieClient: supabase, directClient } = getServerSupabaseClient();

  try {
    // ユーザー認証情報の取得（Cookieベース）
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("User auth error:", userError)
      throw new Error("認証中にエラーが発生しました")
    }

    if (!user) {
      console.log("No session found, redirecting to auth")
      redirect("/auth")
    }

    console.log("ダッシュボード: ユーザーID", user.id)
    
    // 管理者かどうかをチェック
    const { data: adminRole } = await directClient
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .single()
      
    // 管理者の場合は管理画面にリダイレクト
    if (adminRole) {
      console.log("管理者ユーザーがダッシュボードにアクセス: /adminへリダイレクト")
      return redirect("/admin")
    }

    // プロファイル情報の取得（サービスロールを使用）
    const { data: profile, error: profileError } = await directClient
      .from("profiles")
      .select("*, goal_location:goal_location_id(*)")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      
      // プロファイルがないか、取得エラーの場合はonboardingへリダイレクト
      if (profileError.code === "PGRST116") {
        console.log("Profile not found, redirecting to onboarding")
        
        // onboardingへリダイレクトする前に、profilesテーブルに空のレコードを作成する
        try {
          const newProfileData = {
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarding_completed: false
          }
          
          console.log("作成するプロフィールデータ:", newProfileData)
          
          const { error: createError } = await directClient
            .from("profiles")
            .upsert(newProfileData, {
              onConflict: 'id'
            })
          
          if (createError) {
            console.error("プロフィール作成エラー:", createError)
          } else {
            console.log("プロフィールを事前作成しました")
          }
        } catch (createError) {
          console.error("プロフィール作成例外:", createError)
        }
        
        redirect("/onboarding")
      }
      
      throw new Error("プロフィールの取得中にエラーが発生しました")
    }

    if (!profile) {
      console.log("Profile is null, redirecting to onboarding")
      redirect("/onboarding")
    }

    if (!profile.onboarding_completed) {
      console.log("Onboarding not completed, redirecting to onboarding")
      redirect("/onboarding")
    }

    const progressPercentage = calculateProgress(profile)

    // 職業ポジションを取得（修正済みの関数を使用）
    let futureOccupationTitle = "未設定";
    
    try {
      const jobPositions = await getJobPositions()
      console.log("職業ポジション取得成功:", jobPositions?.length || 0);
      
      // future_occupationに対応するjob_positionを検索
      if (profile.future_occupation && jobPositions) {
        const jobPosition = jobPositions.find(pos => pos.id === profile.future_occupation)
        if (jobPosition) {
          futureOccupationTitle = jobPosition.title
        }
      }
      
      const goalMessages = {
        overseas_job: {
          title: "海外就職",
          message: "海外就職に向けて、着実に準備を進めていきましょう！",
          icon: Briefcase,
        },
        improve_language: {
          title: "語学力向上",
          message: "語学力向上のため、効果的な学習方法を見つけていきましょう！",
          icon: GraduationCap,
        },
        career_change: {
          title: "キャリアチェンジ",
          message: "新しいキャリアに向けて、必要なスキルを身につけていきましょう！",
          icon: Rocket,
        },
        find_new_home: {
          title: "移住先探し",
          message: "理想の移住先を見つけるため、様々な情報を集めていきましょう！",
          icon: Home,
        },
      }
  
      const goalInfo = goalMessages[profile.migration_goal as keyof typeof goalMessages] || goalMessages.overseas_job
    } catch (jobPositionError) {
      console.error("職業ポジション取得エラー:", jobPositionError);
      // エラーがあっても処理を続行
    }

    // ユーザーの申請一覧を取得（すべての状態を含む）
    const { data: allApplications, error: allApplicationsError } = await directClient
      .from("course_applications")
      .select(`
        id,
        status,
        course_id
      `)
      .eq("user_id", user.id)

    if (!allApplicationsError && allApplications) {
      // コースIDごとに申請をグループ化
      const applicationsByCourseid: Record<string, { id: string, status: string }[]> = {}
      
      allApplications.forEach(app => {
        if (!applicationsByCourseid[app.course_id]) {
          applicationsByCourseid[app.course_id] = []
        }
        applicationsByCourseid[app.course_id].push({
          id: app.id,
          status: app.status
        })
      })

      // 同じコースに対して複数の申請がある場合、draftを削除
      for (const courseId in applicationsByCourseid) {
        const apps = applicationsByCourseid[courseId]
        if (apps.length > 1) {
          const hasNonDraft = apps.some(app => app.status !== 'draft')
          
          if (hasNonDraft) {
            // draft状態の申請IDを収集
            const draftIds = apps
              .filter(app => app.status === 'draft')
              .map(app => app.id)
            
            if (draftIds.length > 0) {
              // draft状態の申請を削除
              const { error: deleteError } = await directClient
                .from("course_applications")
                .delete()
                .in("id", draftIds)
              
              if (deleteError) {
                console.error("Error cleaning up draft applications:", deleteError)
              } else {
                console.log(`Cleaned up ${draftIds.length} draft applications for course ${courseId}`)
              }
            }
          }
        }
      }
    }

    // 表示用の申請一覧を取得（draft状態を除外）
    console.log("=== Course Applications Query Debug ===")
    console.log("User ID for query:", user.id)
    console.log("User ID type for query:", typeof user.id)
    
    // ユーザーIDを確実に文字列として扱う
    const userIdStr = String(user.id);
    console.log("User ID as string:", userIdStr);
    
    // 複数の方法で申請データを取得（基本的なクエリ）
    let { data: applications, error: applicationsError } = await directClient
      .from("course_applications")
      .select(`
        id,
        status,
        created_at,
        updated_at,
        preferred_start_date,
        course_id,
        content_snare_id,
        content_snare_request_id,
        course:course_id (
          id,
          name,
          description,
          school_id,
          category,
          content_snare_template_id,
          start_date,
          tuition_and_others
        ),
        course_application_comments (
          id
        )
      `)
      .eq("user_id", userIdStr)
      .neq("status", "draft")
      .order("created_at", { ascending: false });
    
    console.log("Basic query result:", applicationsError ? "Error" : "Success");
    if (applicationsError) {
      console.error("Error fetching applications:", applicationsError);
    } else {
      console.log("Applications found:", applications?.length || 0);
    }
    
    // 別の方法でも試す（シンプルなクエリ）
    if (!applications || applications.length === 0) {
      const { data: simpleApps, error: simpleError } = await directClient
        .from("course_applications")
        .select("*")
        .eq("user_id", userIdStr);
      
      if (!simpleError && simpleApps && simpleApps.length > 0) {
        console.log("Simple query found applications:", simpleApps.length);
        
        // コース情報を取得
        const courseIds = simpleApps.map(app => app.course_id).filter(Boolean);
        
        if (courseIds.length > 0) {
          const { data: coursesData } = await directClient
            .from("courses")
            .select("*")
            .in("id", courseIds);
          
          const coursesMap: Record<string, any> = {};
          if (coursesData) {
            coursesData.forEach(course => {
              coursesMap[course.id] = course;
            });
          }
          
          // アプリケーションとコースを結合
          applications = simpleApps.map(app => ({
            ...app,
            course: coursesMap[app.course_id] || null
          }));
        } else {
          applications = simpleApps;
        }
      }
    }
    
    // デバッグ情報
    console.log("=== Applications Debug ===");
    console.log("Total applications:", applications?.length || 0);
    if (applications && applications.length > 0) {
      console.log("Application statuses:", applications.map(app => app.status));
    } else {
      console.log("No applications found");
    }

    // ユーザーIDのデバッグ情報
    console.log("=== User ID Debug ===")
    console.log("User ID value:", user.id)
    console.log("User ID type:", typeof user.id)
    console.log("User ID is string:", typeof user.id === 'string')
    console.log("User ID is valid:", user.id && typeof user.id === 'string' && user.id.length > 0)
    const userId = user.id.toString(); // 念のため文字列化
    console.log("String User ID:", userId)

    // ビザプランの取得 - シンプル化
    console.log("=== Starting visa plans fetch ===");
    
    // シンプルなクエリのみを使用
    const { data: simpleVisaPlans, error: simpleError } = await directClient
      .from("visa_plans")
      .select("id, name")
      .eq("user_id", userIdStr)
      .limit(1)
    
    if (simpleError) {
      console.error("Error fetching visa plans:", simpleError);
    } else {
      console.log("Visa plans fetched successfully");
      console.log("Count:", simpleVisaPlans?.length || 0);
      if (simpleVisaPlans && simpleVisaPlans.length > 0) {
        console.log("First plan:", simpleVisaPlans[0].name);
      }
    }

    // ユーザーのファイル一覧を取得
    const { data: userFiles, error: userFilesError } = await directClient
      .from("user_files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (userFilesError) {
      console.error("Error fetching user files:", userFilesError)
    }

    return (
      <Layout>
        <div className="space-y-6">
          {/* 重要な渡航情報の指標 - 常に最上部に固定表示 */}
          <div className="bg-background pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-1">渡航目的</p>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2 text-blue-500" />
                      <p className="text-base font-semibold">
                        {(() => {
                          const goalLabels = {
                            "overseas_job": "海外就職",
                            "improve_language": "語学力向上",
                            "career_change": "キャリアチェンジ",
                            "find_new_home": "移住先探し"
                          };
                          return profile.migration_goal ? 
                            goalLabels[profile.migration_goal as keyof typeof goalLabels] : 
                            "未設定";
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-1">渡航時期</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-500" />
                      <p className="text-base font-semibold">
                        {(() => {
                          const timingLabels = {
                            "asap": "できるだけ早く",
                            "within_6_months": "6ヶ月以内",
                            "within_1_year": "1年以内",
                            "1_year_plus": "1年以上先",
                          };
                          return profile.abroad_timing ? 
                            timingLabels[profile.abroad_timing as keyof typeof timingLabels] : 
                            "未設定";
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-1">目的の場所</p>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                      <p className="text-base font-semibold">
                        {profile.goal_location ? 
                          `${profile.goal_location.city}, ${profile.goal_location.country}` : 
                          (profile.destination_country || "未設定")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-1">将来希望する職業</p>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-purple-500" />
                      <p className="text-base font-semibold">
                        {futureOccupationTitle}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ユーザープロファイルとジャーニーステータス */}
          <div className="bg-white rounded-xl p-0 shadow-md">
            <UserJourneyStatus profile={profile} />
          </div>

          {/* メインコンテンツ - タブ形式で整理 */}
          <Tabs defaultValue="recommended" className="w-full" preventScrollOnActivation>
            <div className="bg-white shadow-md rounded-lg border border-gray-100 mb-6 md:inline-block">
              <TabsList className="flex justify-between items-center p-0 md:justify-start overflow-x-auto">
                <TabsTrigger
                  value="recommended"
                  className="flex items-center gap-1.5 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200"
                >
                  <Rocket className="h-4 w-4" />
                  <span>おすすめ</span>
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="flex items-center gap-1.5 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>お気に入り</span>
                </TabsTrigger>
                <TabsTrigger
                  value="learning"
                  className="flex items-center gap-1.5 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>学習・準備</span>
                </TabsTrigger>
                <TabsTrigger
                  value="applications"
                  className="flex items-center gap-1.5 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200"
                >
                  <FileText className="h-4 w-4" />
                  <span>申請状況</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* おすすめタブ */}
            <TabsContent value="recommended" className="space-y-6 mt-2">
              {/* おすすめコースと先輩ストーリー */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左カラム: 先輩たちのストーリー (1/3) */}
                <div className="lg:col-span-1">
                  <Suspense fallback={
                    <Card className="shadow-sm bg-white">
                      <CardHeader>
                        <CardTitle className="text-base">先輩たちのストーリー</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">読み込み中...</div>
                      </CardContent>
                    </Card>
                  }>
                    <InterviewArticles />
                  </Suspense>
                </div>

                {/* 右カラム: あなたの目的に合ったコース (2/3) */}
                <div className="lg:col-span-2">
                  <RecommendedCourses />
                </div>
              </div>
            </TabsContent>

            {/* お気に入りタブ */}
            <TabsContent value="favorites" className="space-y-6 mt-2">
              <Card className="shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    お気に入りコース
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FavoriteCourses userId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* 学習・準備タブ */}
            <TabsContent value="learning" className="space-y-6 mt-2">
              <PreDeparturePreparation profile={profile} />
            </TabsContent>

            {/* 申請状況タブ */}
            <TabsContent value="applications" className="space-y-8 mt-3">
              <Card className="shadow-sm bg-white">
                <CardHeader className="pb-4 pt-6 px-6">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    コース申請状況
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ApplicationList applications={applications || []} />
                </CardContent>
              </Card>
              
              {/* ビザプラン進行状況 */}
              <div className="pb-6">
                <Card className="overflow-hidden shadow-md">
                  <CardHeader className={cn(
                    "border-b flex flex-col gap-1",
                    "bg-gray-50"
                  )}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileCheck className="h-5 w-5" />
                        <span>ビザプラン進行状況</span>
                      </CardTitle>
                      {simpleVisaPlans && simpleVisaPlans.length > 0 && (
                        <Badge className="h-6 bg-blue-100 hover:bg-blue-100 text-blue-800 border-blue-200">
                          プラン作成済み
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* ビザプランが存在する場合のみプラン情報を表示 */}
                    {simpleVisaPlans && simpleVisaPlans.length > 0 ? (
                      <>
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">現在のビザプラン</h4>
                          <Link href="/visa" className="block">
                            <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between hover:bg-primary/10 transition-colors cursor-pointer">
                              <div className="flex items-center gap-2">
                                <div className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">{simpleVisaPlans[0].name || "マイビザプラン"}</p>
                                  <p className="text-sm text-gray-500">プラン作成済み</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-primary text-sm">
                                <span>詳細を見る</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <div className="mx-auto mb-4 bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          まだビザプランがありません
                        </h3>
                        <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
                          留学コースに申込むと、専門家とAIがあなたに最適なビザプランを作成します。
                        </p>
                        <Link 
                          href="/courses" 
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <span>コースを探す</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    )
  } catch (error) {
    console.error("Dashboard page error:", error)
    redirect("/auth?error=dashboard_error")
  }
}