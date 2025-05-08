"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { APPLICATION_STATUS } from "@/types/application"
import { 
  FileText, Calendar, ExternalLink, Clock, Inbox, 
  CheckCircle2, AlertCircle, BarChart4, MessageCircle,
  UserCircle, Circle
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { toast } from "react-hot-toast"

interface ApplicationListProps {
  applications: any[]
}

// APIからのレスポンス型定義
interface ContentSnareResult {
  due: string
  folder_name: string
  id: string
  name: string
  share_link: string
  status: string
  progress?: {
    total_fields: number
    done_fields: number
    percent: number
    completed_sections: number
    total_sections: number
  }
  client_email?: string
  client_full_name?: string
  last_activity_at?: string
  created_at?: string
  comments_enabled?: boolean
  client_id?: string
  assignees?: any[]
  sections?: any[]
  updated_at?: string
  folder_id?: string
  folder_request_count?: number
  template_id?: string
  template_name?: string
  client_phone?: string
  client_portal_url?: string
  has_unread_comments?: boolean
  last_comment_at?: string
  last_comment_by?: string
  is_archived?: boolean
  custom_fields?: any
  pages?: any[]
  clients?: any[]
}

// コース型定義
interface Course {
  id: string
  name: string
  school_id: string
  category: string
  description: string
  content_snare_template_id?: string
  start_date: string
  tuition_and_others: string
}

// アプリケーション型定義
interface Application {
  id: string
  user_id: string
  course_id: string
  status: string
  created_at: string
  updated_at: string
  content_snare_id?: string
  content_snare_request_id?: string
  request_url?: string
  course: Course
  content_snare_result?: ContentSnareResult
}

export function ApplicationList({ applications }: ApplicationListProps) {
  const [validApplications, setValidApplications] = useState<Application[]>([])
  const [snareResults, setSnareResults] = useState<Record<string, ContentSnareResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [fallbackLoaded, setFallbackLoaded] = useState(false)
  const supabase = createClientComponentClient()

  // レンダリング中の状態更新を避けるためにuseEffectを使用
  useEffect(() => {
    console.log('ApplicationList: props.applications =', applications?.length || 0);
    
    // 無効なデータを含む可能性のある配列を安全に処理
    if (Array.isArray(applications) && applications.length > 0) {
      console.log('Using provided applications data');
      
      try {
        const formattedApplications = applications.map(app => {
          if (!app) return null;
          
          const courseData = app.course || {};
          
          const formattedApp: Application = {
            id: app.id || '',
            user_id: app.user_id || '',
            course_id: app.course_id || '',
            status: app.status || '',
            created_at: app.created_at || '',
            updated_at: app.updated_at || '',
            content_snare_id: app.content_snare_id,
            content_snare_request_id: app.content_snare_request_id,
            course: {
              id: courseData.id || '',
              name: courseData.name || '',
              school_id: courseData.school_id || '',
              category: courseData.category || '',
              description: courseData.description || '',
              content_snare_template_id: courseData.content_snare_template_id,
              start_date: courseData.start_date || '',
              tuition_and_others: courseData.tuition_and_others || ''
            }
          };
          
          return formattedApp;
        }).filter(Boolean) as Application[];
        
        setValidApplications(formattedApplications);
        
        // 各申請のContent Snare情報を取得
        formattedApplications.forEach(app => {
          if (app?.id) {
            fetchContentSnareData(app);
          }
        });
      } catch (error) {
        console.error('データ形式変換エラー:', error);
        fetchApplicationsFallback();
      }
    } else {
      console.log("Applications array is empty or invalid, trying fallback method");
      setValidApplications([]);
      if (!fallbackLoaded) {
        fetchApplicationsFallback();
      }
    }
  }, [applications]);

  // フォールバック：直接クライアントから申請情報を取得
  const fetchApplicationsFallback = async () => {
    try {
      setFallbackLoaded(true);
      console.log("Trying to fetch applications directly from Supabase");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("認証セッションがありません");
        return;
      }
      
      const userId = session.user.id;
      console.log("フォールバック: ユーザーID =", userId);
      
      // 申請一覧を取得（シンプルなクエリで）
      const { data, error } = await supabase
        .from('course_applications')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'draft');
      
      if (error) {
        console.error('フォールバック申請取得エラー:', error);
        return;
      }
      
      console.log('フォールバック申請取得成功:', data?.length || 0);
      
      if (data && data.length > 0) {
        // 各アプリケーションのコース情報を取得
        const courseIds = data.map(app => app.course_id).filter(Boolean);
        
        let courses: Record<string, any> = {};
        
        if (courseIds.length > 0) {
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);
          
          if (!coursesError && coursesData) {
            coursesData.forEach(course => {
              courses[course.id] = course;
            });
          }
        }
        
        // アプリケーションデータとコースデータを結合
        const appsWithCourses = data.map(app => {
          const courseData = courses[app.course_id] || {};
          
          return {
            id: app.id,
            user_id: app.user_id,
            course_id: app.course_id,
            status: app.status,
            created_at: app.created_at,
            updated_at: app.updated_at,
            content_snare_id: app.content_snare_id,
            content_snare_request_id: app.content_snare_request_id,
            course: {
              id: courseData.id || '',
              name: courseData.name || '',
              school_id: courseData.school_id || '',
              category: courseData.category || '',
              description: courseData.description || '',
              content_snare_template_id: courseData.content_snare_template_id,
              start_date: courseData.start_date || '',
              tuition_and_others: courseData.tuition_and_others || ''
            }
          } as Application;
        });
        
        setValidApplications(appsWithCourses);
        
        // Content Snare情報を取得
        appsWithCourses.forEach(app => {
          if (app?.id) {
            fetchContentSnareData(app);
          }
        });
      }
    } catch (error) {
      console.error('フォールバック処理エラー:', error);
    }
  };

  // Content Snareデータを取得する関数
  const fetchContentSnareData = async (application: Application) => {
    if (!application.id) return;
    
    const applicationId = application.id;
    setLoading(prev => ({ ...prev, [applicationId]: true }));
    
    try {
      // Content Snare IDがアプリケーションデータに含まれているか確認
      if (!application.content_snare_request_id) {
        console.log(`Content Snare Request IDが見つかりません: ID=${applicationId}`);
        return;
      }
      
      // Content Snare APIからデータを取得
      console.log(`Content Snareデータ取得開始: ID=${applicationId}, Request ID=${application.content_snare_request_id}`);
      const response = await fetch(`/api/content-snare/get-request-status?request_id=${application.content_snare_request_id || application.content_snare_id || applicationId}`);
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.id) {
        console.log(`Content Snareデータ取得成功: ID=${applicationId}`, data.status);
        console.log(`進捗情報:`, data.progress);
        setSnareResults(prev => ({ ...prev, [applicationId]: data }));
      } else {
        console.log(`Content Snareデータが不完全: ID=${applicationId}`, data);
      }
    } catch (error) {
      console.error(`Content Snareデータ取得エラー: ID=${applicationId}`, error);
    } finally {
      setLoading(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string, variant: string, icon: any }> = {
      draft: { label: '下書き', variant: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText },
      pending: { label: '未提出', variant: 'bg-slate-50 text-slate-700 border-slate-200', icon: Inbox },
      waiting: { label: '申請中', variant: 'bg-blue-50 text-blue-700 border-blue-200', icon: BarChart4 },
      in_progress: { label: '回答中', variant: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
      submitted: { label: '提出済み', variant: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
      reviewing: { label: '審査中', variant: 'bg-blue-50 text-blue-700 border-blue-200', icon: BarChart4 },
      approved: { label: '承認済み', variant: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
      rejected: { label: '却下', variant: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
      published: { label: 'コース申請中', variant: 'bg-purple-50 text-purple-700 border-purple-200', icon: BarChart4 }
    };

    const config = statusConfig[status] || { label: status || "不明", variant: 'bg-slate-50 text-slate-700 border-slate-200', icon: Circle };
    
    return (
      <div className="flex items-center gap-1.5">
        <config.icon className="h-4 w-4" />
        <Badge variant="outline" className={config.variant}>
          {config.label}
        </Badge>
      </div>
    );
  };

  // 期限表示のフォーマット
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return '期限なし';
    
    try {
      return format(parseISO(dueDate), 'yyyy年MM月dd日', { locale: ja });
    } catch (e) {
      return dueDate;
    }
  };

  // 最終活動日時のフォーマット
  const formatLastActivity = (lastActivity: string | null) => {
    if (!lastActivity) return '活動なし';
    
    try {
      return format(parseISO(lastActivity), 'yyyy年MM月dd日 HH:mm', { locale: ja });
    } catch (e) {
      return lastActivity;
    }
  };

  // 進捗率計算と表示
  const calculateProgress = (applicationId: string) => {
    const result = snareResults[applicationId];
    if (!result) return null;
    
    // 新しいAPIからprogressオブジェクトが返されている場合はそれを使用
    if (result.progress) {
      return {
        done: result.progress.done_fields,
        total: result.progress.total_fields,
        percent: result.progress.percent
      };
    }
    
    // 古いAPIレスポンス互換性のために残す
    if (!result.pages || result.pages.length === 0) return null;
    
    const pages = result.pages;
    let totalFields = 0;
    let totalDoneFields = 0;
    
    pages.forEach(page => {
      totalFields += page.fields_count || 0;
      totalDoneFields += page.done_fields_count || 0;
    });
    
    const percent = totalFields > 0 ? Math.round((totalDoneFields / totalFields) * 100) : 0;
    
    return {
      done: totalDoneFields,
      total: totalFields,
      percent: percent
    };
  };

  // 進捗バーの表示
  const renderProgressBar = (applicationId: string) => {
    const progress = calculateProgress(applicationId);
    if (!progress) return null;
    
    // プログレスバーの色を決定
    const getProgressColor = () => {
      if (progress.percent >= 100) return 'bg-green-500';
      if (progress.percent > 75) return 'bg-blue-500';
      if (progress.percent > 50) return 'bg-blue-400';
      if (progress.percent > 25) return 'bg-amber-500';
      return 'bg-red-500';
    };
    
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-slate-700">フォーム入力状況</span>
          <span className="text-xs font-medium text-slate-700">
            {progress.done}/{progress.total} ({progress.percent}%)
          </span>
        </div>
        
        <div className="relative flex items-center">
          <div className="w-full h-5 bg-slate-200 rounded-full shadow-inner overflow-hidden">
            <div 
              className={`h-full rounded-full ${getProgressColor()} relative transition-all duration-700 ease-out flex justify-center items-center`} 
              style={{ width: `${progress.percent}%` }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="white-bars-container flex items-center h-full">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="white-bar h-8 w-2 mx-1 bg-white/20 rotate-30 rounded-full"
                      style={{ transform: 'rotate(30deg)' }}
                    />
                  ))}
                </div>
              </div>
              
              {progress.percent > 15 && (
                <span className="text-xs font-semibold text-white relative z-10">
                  {progress.percent}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes move {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(50%); }
          }
          .white-bars-container {
            position: absolute;
            display: flex;
            align-items: center;
            width: 600%;
            animation: move 120s linear infinite;
            left: -100%;
          }
          .white-bar {
            background: linear-gradient(-45deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
            opacity: 0.7;
          }
        `}</style>
      </div>
    );
  };

  if (!validApplications || validApplications.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-6 text-base">申請はまだありません</p>
        <Link href="/courses" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-md text-sm hover:bg-primary/90 transition-colors">
          コースを探す
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {validApplications.map((application) => {
        const snareResult = snareResults[application?.id];
        const isLoading = loading[application?.id];
        
        return (
          <Card key={application?.id || Math.random().toString()} className="shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white">
            <CardHeader className="pb-6 pt-6 px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg mb-2">{application?.course?.name || "不明なコース"}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    申請日: {formatDate(application?.created_at)}
                    {snareResult?.id && (
                      <span className="text-xs text-muted-foreground ml-3">
                        ID: {application.content_snare_request_id || snareResult.id}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  {snareResult ? (
                    getStatusBadge(snareResult.status || application?.status)
                  ) : application?.status ? (
                    getStatusBadge(application.status)
                  ) : (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-md"></div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 pb-6">
    <div className="space-y-4">
                {/* 基本情報セクション */}
                <div className="flex flex-wrap gap-4">
                  {/* 提出期限 */}
                  <div className="bg-slate-50 px-5 py-4 rounded-lg border border-slate-200 flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                      <p className="text-xs font-medium mb-1">提出期限</p>
                      <p className="text-sm">
                        {isLoading ? (
                          <span className="animate-pulse">読み込み中...</span>
                        ) : snareResult?.due ? (
                          formatDueDate(snareResult.due)
                        ) : (
                          '期限なし'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* 最終更新 */}
                  {snareResult?.updated_at && (
                    <div className="bg-slate-50 px-5 py-4 rounded-lg border border-slate-200 flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium mb-1">最終更新</p>
                        <p className="text-sm">{formatLastActivity(snareResult.updated_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* コメント情報 */}
                  {snareResult?.has_unread_comments && (
                    <div className="bg-amber-50 px-5 py-4 rounded-lg border border-amber-200 flex items-center gap-3">
                      <MessageCircle className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="text-xs font-medium mb-1 text-amber-800">未読コメント</p>
                        <p className="text-sm text-amber-700">
                          {snareResult.last_comment_at && (
                            <>最終: {formatLastActivity(snareResult.last_comment_at)}</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* セクション情報がある場合 */}
                {snareResult?.sections && snareResult.sections.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-3">セクション進捗</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {snareResult.sections.slice(0, 3).map((section, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2">
                            {section.status === 'complete' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            ) : section.status === 'in_progress' ? (
                              <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-xs font-medium text-slate-700 line-clamp-1">{section.name}</span>
                          </div>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              section.status === 'complete' ? 'bg-green-100 text-green-700' : 
                              section.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {section.status === 'complete' ? '完了' : 
                               section.status === 'in_progress' ? '進行中' : '未開始'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {snareResult.sections.length > 3 && (
                        <div className="flex items-center justify-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-700">
                            +{snareResult.sections.length - 3}セクション
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 進捗バー */}
                {renderProgressBar(application?.id)}
                
                {/* リンクボタン */}
                <div className="mt-6 flex justify-end">
                  {snareResult?.share_link ? (
                    <div className="flex gap-3">
                      <Link href="/course-application" passHref>
                        <Button size="sm" variant="default" className="h-9 px-4">
                          申請状況を確認
                        </Button>
                      </Link>
                      <a 
                        href={snareResult.share_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-4 bg-primary/90 text-white rounded-md text-sm hover:bg-primary transition-colors"
                      >
                        <span>申請フォームへ</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
              </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link href="/course-application" passHref>
                        <Button size="sm" variant="default" className="h-9 px-4">
                          申請状況を確認
                    </Button>
                  </Link>
                  <Link href={`/courses/${application?.course_id}`} passHref>
                        <Button size="sm" variant="outline" className="h-9 px-4">
                      コース詳細
                    </Button>
                  </Link>
                </div>
                  )}
              </div>
            </div>
          </CardContent>
            
            {/* フッター情報 */}
            {snareResult && (
              <CardFooter className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <UserCircle className="h-3.5 w-3.5" />
                    {snareResult.client_full_name || snareResult.clients?.[0]?.full_name || '申請者情報なし'}
                  </div>
                  {snareResult.template_name && (
                    <div className="text-xs text-slate-600">
                      {snareResult.template_name}
                    </div>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  )
} 