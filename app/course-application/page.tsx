'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, Calendar, ExternalLink, Clock, FileText, 
  Inbox, CheckCircle2, AlertCircle, BarChart4, 
  UserCircle, Building, BookOpen, ClipboardList,
  AlertTriangle, MessageCircle, Folder, Circle, Mail, ArrowUpRight, CalendarClock, Globe
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { UserSchedules } from './components/user-schedules'

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
  instruction_text?: string
}

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

interface Application {
  id: string
  user_id: string
  course_id: string
  status: string
  created_at: string
  updated_at: string
  content_snare_id?: string
  request_url?: string
  course: Course
  content_snare_result?: ContentSnareResult // APIから取得したステータス情報
  content_snare_request_id?: string
  intake_date_id?: string
  intake_date?: any
  preferred_start_date?: string
  purpose?: string
}

export default function CourseApplicationPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      setIsAuthenticated(true)
      setLoading(true)
      
      // ユーザー情報を取得
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      if (profileData) {
        console.log('ユーザープロフィール取得成功:', profileData.id)
        setUserData(profileData)
      } else {
        console.log('プロフィールなし、Supabaseユーザー情報を使用:', session.user.id)
        // プロフィールがない場合はAuth情報を使用
        setUserData({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          first_name: session.user.user_metadata?.first_name,
          last_name: session.user.user_metadata?.last_name
        })
      }
      
      fetchApplications()
    }
    
    checkAuth()
  }, [router, supabase])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/content-snare/get-applications')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '申請一覧の取得に失敗しました')
      }
      
      const data = await response.json()
      console.log('コース申請一覧取得成功:', data.applications?.length || 0)

      // Supabaseからコース情報を取得
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('id', (data.applications || []).map((app: Application) => app.course_id))

      if (coursesError) {
        console.error('コース情報取得エラー:', coursesError)
        throw new Error('コース情報の取得に失敗しました')
      }
      
      // 入学日情報を取得
      const { data: intakeDatesData, error: intakeDatesError } = await supabase
        .from('course_intake_dates')
        .select('*')
        .in('id', (data.applications || [])
          .filter((app: Application) => app.intake_date_id)
          .map((app: Application) => app.intake_date_id))
      
      if (intakeDatesError) {
        console.error('入学日情報取得エラー:', intakeDatesError)
        throw new Error('入学日情報の取得に失敗しました')
      }
      
      // 入学日情報をIDでマッピング
      const intakeDateMap = new Map()
      if (intakeDatesData) {
        intakeDatesData.forEach(date => {
          intakeDateMap.set(date.id, date)
        })
      }

      // コース情報をアプリケーションデータにマージ
      const applicationsWithCourses = (data.applications || []).map((app: Application) => ({
        ...app,
        course: coursesData.find((course) => course.id === app.course_id),
        intake_date: app.intake_date_id ? intakeDateMap.get(app.intake_date_id) : null
      }))

      // Content Snare APIからの結果を取得
      const applicationsWithStatus = await Promise.all((applicationsWithCourses || []).map(async (app: Application) => {
        let errors: Record<string, string> = { ...apiErrors }
        
        if (app.content_snare_id || app.content_snare_request_id) {
          try {
            // どちらかのIDを優先して使用
            const requestId = app.content_snare_request_id || app.content_snare_id
            console.log(`リクエストステータス取得開始: ID=${requestId}, コース=${app.course?.name || 'N/A'}`)
            
            // リクエストパラメータにContent Snare IDを直接指定
            const statusResponse = await fetch(`/api/content-snare/get-request-status?request_id=${requestId}`)
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              console.log(`リクエストステータス取得成功: ID=${app.id}`, {
                hasData: !!statusData,
                status: statusData?.status,
                due: statusData?.due,
                progress: statusData?.progress
              })
              
              // エラーオブジェクトがある場合はエラーとして扱う
              if (statusData.error) {
                console.error('APIレスポンスにエラーがあります:', statusData.error)
                errors[app.id] = `API エラー: ${statusData.error}`
              } 
              // データが存在し、必要な項目があるかチェック
              else if (statusData && statusData.id && statusData.status) {
                // エラーがあれば削除
                if (errors[app.id]) {
                  delete errors[app.id]
                }
                
                return {
                  ...app,
                  content_snare_result: statusData
                }
              } else {
                console.error('APIレスポンスに必要なデータがありません:', statusData)
                errors[app.id] = 'APIからのデータが不完全です'
              }
            } else {
              const errorText = await statusResponse.text()
              console.error(`リクエストステータス取得エラー (${statusResponse.status}):`, errorText)
              
              // より具体的なエラーメッセージを表示
              try {
                const errorData = JSON.parse(errorText)
                errors[app.id] = `APIエラー: ${errorData.error || statusResponse.status}`
                console.error('エラー詳細:', errorData.details || 'なし')
              } catch (e) {
                errors[app.id] = `APIエラー: ${statusResponse.status}`
              }
            }
          } catch (error) {
            console.error('ステータス取得エラー:', error)
            errors[app.id] = `取得エラー: ${error instanceof Error ? error.message : String(error)}`
          }
        } else {
          console.log(`コース申請にContent Snare IDがありません: ID=${app.id}, コース=${app.course?.name || 'N/A'}`)
        }
        
        // 他の処理との競合を避けるため、ここでsetApiErrorsを呼び出す
        setApiErrors(prev => ({...prev, ...errors}))
        return app
      }))
      
      console.log('全申請の処理完了:', applicationsWithStatus.length)
      console.log('API情報あり:', applicationsWithStatus.filter(app => !!app.content_snare_result).length)
      
      setApplications(applicationsWithStatus || [])
    } catch (error) {
      console.error('申請一覧取得エラー:', error)
      toast.error('申請情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // Content Snare APIのステータスに基づいてバッジを表示
  const getStatusBadge = (application: Application) => {
    // Supabaseのステータスを優先
    const status = application.status || application.content_snare_result?.status || 'waiting'

    const statusConfig: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      draft: { label: '下書き', variant: 'outline', icon: FileText },
      pending: { label: '未提出', variant: 'outline', icon: Inbox },
      waiting: { label: '申請中', variant: 'secondary', icon: BarChart4 },
      in_progress: { label: '回答中', variant: 'secondary', icon: Clock },
      submitted: { label: '提出済み', variant: 'default', icon: CheckCircle2 },
      reviewing: { label: '審査中', variant: 'secondary', icon: BarChart4 },
      approved: { label: '承認済み', variant: 'default', icon: CheckCircle2 },
      rejected: { label: '却下', variant: 'destructive', icon: AlertCircle },
      published: { label: 'フォーム準備中', variant: 'outline', icon: BarChart4 }
    }

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: FileText }
    return (
      <div className="flex items-center gap-1.5">
        <config.icon className="h-4 w-4" />
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      </div>
    )
  }

  // 期限表示のフォーマット
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return '期限なし'
    
    try {
      return format(parseISO(dueDate), 'yyyy年MM月dd日', { locale: ja })
    } catch (e) {
      return dueDate
    }
  }

  // 最終活動日時のフォーマット
  const formatLastActivity = (lastActivity: string | null) => {
    if (!lastActivity) return '活動なし'
    
    try {
      return format(parseISO(lastActivity), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch (e) {
      return lastActivity
    }
  }

  // ページの進捗状態を表示
  const getPageStatus = (page: any) => {
    // ページが完了済みの場合
    if (page.is_done) return "完了";
    
    // フィールドの数に基づく評価
    const doneFields = page.done_fields_count || 0;
    const totalFields = page.fields_count || 0;
    
    if (totalFields > 0) {
      if (doneFields === totalFields) return "完了";
      if (doneFields > 0) return "進行中";
    }
    
    // フィールド情報がない場合は更新日を見る
    if (page.updated_at) return "未着手";
    
    return "未着手";
  }
  
  // ページ全体のフィールド完了率を計算
  const calculateTotalProgress = (pages: any[] | undefined) => {
    // 新しいAPIから直接progressオブジェクトを取得できる場合
    const application = applications.find(app => app.content_snare_result?.pages === pages);
    if (application?.content_snare_result?.progress) {
      const progress = application.content_snare_result.progress;
      return {
        done: progress.done_fields,
        total: progress.total_fields,
        percent: progress.percent
      };
    }
    
    // 従来の計算方法（互換性のため保持）
    if (!pages || pages.length === 0) return { done: 0, total: 0, percent: 0 };
    
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
  }
  
  // 進捗率表示
  const renderProgress = (pages: any[] | undefined) => {
    // プログレスがundefinedの場合はスケルトンローディングを表示
    if (!pages) {
      return (
        <div className="mt-6 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-3 w-48 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2"></div>
        </div>
      );
    }
    
    const progress = calculateTotalProgress(pages);
    
    // フィールドが0の場合
    if (progress.total === 0) {
      return null;
    }
    
    // プログレスバーの色を決定
    const getProgressColor = () => {
      if (progress.percent >= 100) return 'bg-green-500';
      if (progress.percent > 75) return 'bg-blue-500';
      if (progress.percent > 50) return 'bg-blue-400';
      if (progress.percent > 25) return 'bg-amber-500';
      return 'bg-red-500';
    };
    
    // 白いバーの数を計算
    const whiteBarCount = 30; // 固定数
    
    return (
      <div className="my-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">フォーム入力状況</span>
          <span className="text-sm font-medium text-slate-700">
            {progress.done}/{progress.total} ({progress.percent}%)
          </span>
        </div>
        
        <div className="relative flex items-center">
          <div className="w-full h-8 bg-slate-200 rounded-full shadow-inner overflow-hidden">
            <div 
              className={`h-full rounded-full ${getProgressColor()} relative transition-all duration-700 ease-out flex justify-center items-center`} 
              style={{ width: `${progress.percent}%` }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="white-bars-container flex items-center h-full">
                  {Array.from({ length: whiteBarCount }).map((_, i) => (
                    <div 
                      key={i} 
                      className="white-bar h-12 w-4 mx-2 bg-white/20 rotate-30 rounded-full"
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
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .white-bars-container {
            position: absolute;
            display: flex;
            align-items: center;
            width: 200%;
            animation: move 40s linear infinite;
          }
          .white-bar {
            background: linear-gradient(-45deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
            opacity: 0.7;
          }
        `}</style>
      </div>
    );
  };

  // セクション情報の表示（ローディング表示を含む）
  const renderSectionsWithLoading = (sections: any[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded-full mt-0.5 animate-pulse"></div>
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      );
    }
    
    if (!sections || sections.length === 0) return null;
    
    const completedSections = sections.filter(section => section.status === 'complete').length;
    const totalSections = sections.length;
    
    return (
      <div className="flex items-start gap-2">
        <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm font-medium">セクション進捗</p>
          <p className="text-sm">{completedSections}/{totalSections} 完了</p>
        </div>
      </div>
    );
  };

  // Content Snareの詳細セクションをレンダリング
  const renderDetailedContent = (application: Application) => {
    if (!application.content_snare_result) return null;
    
    const result = application.content_snare_result;
    
    return (
      <div className="mt-10 pt-8 border-t border-gray-100">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span>詳細情報</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* コース情報 */}
          {renderCourseInfo(application)}

          {/* 申請者情報 */}
          {renderApplicantInfo(application, result)}

          {/* リクエスト情報 - 改善されたUI */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>
              <span>リクエスト情報</span>
            </h4>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">申請名</span>
                <span className="text-sm font-semibold text-slate-800">{result.name}</span>
              </div>
              {result.template_name && (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">テンプレート</span>
                  <span className="text-sm font-semibold text-slate-800">{result.template_name}</span>
                </div>
              )}
              {result.created_at && (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">作成日</span>
                  <span className="text-sm font-semibold text-slate-800">{formatLastActivity(result.created_at)}</span>
                </div>
              )}
              {result.updated_at && (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">更新日</span>
                  <span className="text-sm font-semibold text-slate-800">{formatLastActivity(result.updated_at)}</span>
                </div>
              )}
              {result.due && (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">期限日</span>
                  <span className="text-sm font-semibold text-slate-800">{formatDueDate(result.due)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 担当者情報 - 改善されたUI */}
          {result.assignees && result.assignees.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm">
              <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <UserCircle className="h-5 w-5 text-slate-500" />
                </div>
                <span>担当者情報</span>
              </h4>
              <div className="space-y-3">
                {result.assignees.map((assignee: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg shadow-sm border border-slate-200">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium text-sm">
                      {assignee.name ? assignee.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{assignee.name || '名前なし'}</p>
                      {assignee.email && <p className="text-xs text-slate-600">{assignee.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ページ情報（JSONのpagesに含まれる情報） - 改善されたUI */}
          {result.pages && result.pages.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm lg:col-span-3">
              <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-full shadow-sm">
                  <Inbox className="h-5 w-5 text-slate-500" />
                </div>
                <span>申請情報</span>
              </h4>
              
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">名前</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">フィールド</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">完了</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">最終更新</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.pages.map((page: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="px-4 py-3.5 font-medium text-slate-700">{page.name}</td>
                        <td className="px-4 py-3.5 text-center">
                          {page.fields_count !== undefined && page.done_fields_count !== undefined ? (
                            <div className="inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-full">
                              <span className="text-xs font-medium text-slate-700">{page.done_fields_count}</span>
                              <span className="text-xs text-slate-500 mx-0.5">/</span>
                              <span className="text-xs text-slate-600">{page.fields_count}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {page.is_done !== undefined ? (
                            page.is_done ? (
                              <div className="flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                                  <span>完了</span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                                  <Circle className="h-3.5 w-3.5" />
                                  <span>未完了</span>
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-md ${
                            getPageStatus(page) === "完了" ? "bg-slate-100 text-slate-700" :
                            getPageStatus(page) === "進行中" ? "bg-slate-100 text-slate-700" :
                            "bg-slate-100 text-slate-600"
                          } font-medium`}>
                            {getPageStatus(page)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 進捗情報 - 改善されたUI */}
          {result.sections && result.sections.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm lg:col-span-3">
              <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <BarChart4 className="h-5 w-5 text-slate-500" />
                </div>
                <span>セクション進捗状況</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {result.sections.map((section: any, index: number) => (
                  <div key={index} className="flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"> 
                    <div className="p-3.5 flex items-center justify-between gap-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        {section.status === 'complete' ? (
                          <CheckCircle2 className="h-4 w-4 text-slate-600 flex-shrink-0" />
                        ) : section.status === 'in_progress' ? (
                          <Clock className="h-4 w-4 text-slate-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-slate-700 line-clamp-1">{section.name}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {section.required !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${section.required ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                            {section.required ? '必須' : '任意'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 flex justify-center bg-white">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        section.status === 'complete' ? 'bg-slate-100 text-slate-700' : 
                        section.status === 'in_progress' ? 'bg-slate-100 text-slate-700' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {section.status === 'complete' ? '完了' : 
                         section.status === 'in_progress' ? '進行中' : '未開始'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* カスタムフィールド - 改善されたUI */}
          {result.custom_fields && 
           Object.keys(result.custom_fields).length > 0 && (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm lg:col-span-3">
              <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <ClipboardList className="h-5 w-5 text-slate-500" />
                </div>
                <span>カスタムフィールド</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(result.custom_fields).map(([key, value]) => (
                  <div key={key} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                    <span className="text-xs text-slate-500 uppercase tracking-wide block mb-2">{key}</span>
                    <span className="text-sm font-semibold text-slate-700">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* シェアリンクがある場合はボタンを表示 - コンテンツの下部へ移動 */}
        {result.share_link && (
          <div className="mt-8 flex justify-end">
            <a 
              href={result.share_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-primary text-white rounded-md font-medium text-sm flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span>申請フォームへ</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    );
  };

  // ステータスアイコンを取得する関数
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      draft: FileText,
      pending: Inbox,
      waiting: BarChart4,
      in_progress: Clock,
      submitted: CheckCircle2,
      reviewing: BarChart4,
      approved: CheckCircle2,
      rejected: AlertCircle,
      published: BarChart4
    };
    
    const Icon = iconMap[status] || FileText;
    return <Icon className="h-5 w-5 text-muted-foreground" />;
  };

  // ステータステキストを取得する関数
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '下書き',
      pending: '未提出',
      waiting: '申請中',
      in_progress: '回答中',
      submitted: '提出済み',
      reviewing: '審査中',
      approved: '承認済み',
      rejected: '却下',
      published: 'フォーム準備中'
    };
    
    return statusMap[status] || status;
  };

  // スタート日のフォーマット関数を追加
  const formatIntakeDate = (intakeDate: any) => {
    if (!intakeDate) return "未定";
    
    const monthNames = [
      "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月"
    ]
    const monthStr = monthNames[intakeDate.month - 1] || `${intakeDate.month}月`
    
    if (intakeDate.day && intakeDate.year) {
      return `${intakeDate.year}年${monthStr}${intakeDate.day}日`
    } else if (intakeDate.year) {
      return `${intakeDate.year}年${monthStr}`
    } else if (intakeDate.day) {
      return `${monthStr}${intakeDate.day}日`
    } else {
      return monthStr
    }
  }

  // 渡航目的のフォーマット関数を追加
  const formatPurpose = (purpose: string | undefined) => {
    if (!purpose) return "未定";
    
    const purposeMap: Record<string, string> = {
      "study": "留学",
      "work": "就職",
      "tourism": "観光",
      "business": "ビジネス",
      "visa": "ビザ取得",
      "other": "その他"
    };
    
    return purposeMap[purpose] || purpose;
  }

  // コース情報を表示する関数
  const renderCourseInfo = (application: Application) => {
    // 開始日の表示を決定
    let startDateDisplay = '未設定'
    
    if (application.intake_date) {
      // 入学日情報がある場合はそれを優先
      startDateDisplay = formatIntakeDate(application.intake_date)
    } else if (application.preferred_start_date) {
      // 希望開始日がある場合
      try {
        startDateDisplay = format(parseISO(application.preferred_start_date), 'yyyy年MM月dd日', { locale: ja })
      } catch (e) {
        startDateDisplay = application.preferred_start_date
      }
    } else if (application.course?.start_date) {
      // コース自体の開始日がある場合
      startDateDisplay = application.course.start_date
    }
    
    return (
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <Building className="h-5 w-5 text-slate-500" />
          </div>
          <span>コース情報</span>
        </h4>
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">コース名</span>
            <span className="text-sm font-semibold text-slate-800">
              {application.course?.name || '未設定'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">開始日</span>
            <span className="text-sm font-semibold text-slate-800">
              {startDateDisplay}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">学費・その他</span>
            <span className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">
              {application.course?.tuition_and_others ? `CA$${Number(application.course.tuition_and_others).toLocaleString()}` : '未設定'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">カテゴリー</span>
            <span className="text-sm font-semibold text-slate-800">
              {application.course?.category || '未設定'}
            </span>
          </div>
          {application.purpose && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">留学目的</span>
              <span className="text-sm font-semibold text-slate-800">
                {formatPurpose(application.purpose)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 申請者情報セクション
  const renderApplicantInfo = (application: Application, result: ContentSnareResult) => {
    // ユーザー情報の表示名を構築
    const fullName = 
      userData?.full_name || 
      (userData?.first_name && userData?.last_name ? 
        `${userData.first_name} ${userData.last_name}` : 
        (result?.client_full_name || '未設定'))
        
    const email = userData?.email || result?.client_email || '未設定'
    
    return (
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <UserCircle className="h-5 w-5 text-slate-500" />
          </div>
          <span>申請者情報</span>
        </h4>
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">氏名</span>
            <span className="text-sm font-semibold text-slate-800">{fullName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">メール</span>
            <span className="text-sm font-semibold text-slate-800 break-all">{email}</span>
          </div>
          {result?.client_phone && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">電話番号</span>
              <span className="text-sm font-semibold text-slate-800">{result.client_phone}</span>
            </div>
          )}
          {result?.client_portal_url && (
            <div className="mt-4 pt-3 border-t border-slate-200/50">
              <a 
                href={result.client_portal_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 text-sm flex items-center hover:text-slate-800 transition-colors"
              >
                <span>クライアントポータル</span>
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* ヘッダーセクション */}
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/10 p-3 rounded-full">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">コース申請情報</h1>
          </div>
          <p className="text-muted-foreground text-base">
            あなたのコース申請の状況を確認できます。申請フォームから必要な情報を入力し、申請を完了させましょう。
          </p>
        </div>

        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-md overflow-hidden animate-pulse">
              <CardHeader className="pb-6 pt-6 px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="h-6 w-48 bg-gray-200 rounded-md mb-3"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded-md"></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-6">
                {/* 基本情報セクションのスケルトン */}
                <div className="flex flex-wrap gap-6 mb-8">
                  {/* 提出期限のスケルトン */}
                  <div className="bg-slate-50 px-6 py-5 rounded-lg border border-slate-200 flex items-center gap-4">
                    <div className="h-5 w-5 rounded-full bg-slate-200"></div>
                    <div>
                      <div className="h-3 w-20 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  
                  {/* 申請ステータスのスケルトン */}
                  <div className="bg-slate-50 px-6 py-5 rounded-lg border border-slate-200 flex items-center gap-4">
                    <div className="h-5 w-5 rounded-full bg-slate-200"></div>
                    <div>
                      <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 w-28 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  
                  {/* セクション進捗のスケルトン */}
                  <div className="bg-slate-50 px-6 py-5 rounded-lg border border-slate-200 flex items-center gap-4">
                    <div className="h-5 w-5 rounded-full bg-slate-200"></div>
                    <div>
                      <div className="h-3 w-28 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 w-16 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
                
                {/* 進捗バーのスケルトン */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 w-36 bg-gray-200 rounded"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                </div>
                
                {/* アクションボタンのスケルトン */}
                <div className="mt-8 flex justify-end">
                  <div className="h-9 w-36 bg-gray-200 rounded-md"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ヘッダーセクション */}
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary/10 p-3 rounded-full">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">コース申請情報</h1>
        </div>
        <p className="text-muted-foreground text-base">
          あなたのコース申請の状況を確認できます。申請フォームから必要な情報を入力し、申請を完了させましょう。
        </p>
      </div>
      
      {applications.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="p-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6 text-base">申請はまだありません</p>
              <Link href="/courses">
                <Button size="lg">コースを探す</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {applications.map((application) => (
            <Card key={application.id} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white">
              <CardHeader className="pb-6 pt-6 px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl mb-2">{application.course.name}</CardTitle>
                    <CardDescription className="text-sm">
                      申請日: {format(parseISO(application.created_at), 'yyyy年MM月dd日', { locale: ja })}
                      {application.content_snare_request_id && (
                        <span className="text-xs text-muted-foreground ml-3">
                          ID: {application.content_snare_request_id}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  
                  {application.content_snare_result ? (
                    getStatusBadge(application)
                  ) : (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-md"></div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {/* Content Snare結果がある場合 */}
                {application.content_snare_result ? (
                  <>
                    {/* 基本情報セクション */}
                    <div className="flex flex-wrap gap-6 mb-8">
                      {/* 提出期限 */}
                      <div className="bg-slate-50 px-6 py-5 rounded-lg border border-slate-200 flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium mb-1">提出期限</p>
                          <p className="text-sm">{formatDueDate(application.content_snare_result.due)}</p>
                        </div>
                      </div>
                      
                      {/* 申請ステータス */}
                      <div className="bg-slate-50 px-6 py-5 rounded-lg border border-slate-200 flex items-center gap-4">
                        {getStatusIcon(application.status || application.content_snare_result.status)}
                        <div>
                          <p className="text-sm font-medium mb-1">申請ステータス</p>
                          <p className="text-sm">{getStatusText(application.status || application.content_snare_result.status)}</p>
                        </div>
                      </div>
                      
                      {/* セクション進捗 */}
                      {renderSectionsWithLoading(application.content_snare_result.sections, false)}
                    </div>
                    
                    {/* 進捗バー */}
                    {renderProgress(application.content_snare_result.pages)}
                    
                    {/* 申請フォーム開始ボタン */}
                    {application.content_snare_result?.share_link && (
                      <div className="mt-8 flex flex-col items-center justify-center bg-slate-50 p-8 rounded-xl border-2 border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">申請フォームの入力</h3>
                        <p className="text-sm text-slate-600 mb-6 text-center">
                          必要な情報を入力して、コース申請を完了させましょう。<br />
                          すべての必須項目を入力する必要があります。
                        </p>
                        <a
                          href={application.content_snare_result.share_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl group gap-2"
                        >
                          <span>申請フォームの入力を開始する</span>
                          <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </a>
                        {application.content_snare_result.instruction_text && (
                          <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200 w-full">
                            <div 
                              className="text-sm text-slate-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: application.content_snare_result.instruction_text }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 詳細情報セクション */}
                    {renderDetailedContent(application)}
                    
                    {/* スケジュール情報 */}
                    <div className="mt-8">
                      <UserSchedules applicationId={application.id} />
                    </div>
                  </>
                ) : (
                  // Content Snare結果がない場合のローディング表示
                  <div className="space-y-8">
                    <div className="flex flex-wrap gap-6 mb-6">
                      {/* ローディングスケルトン */}
                      <div className="bg-slate-50 px-6 py-5 rounded-lg border border-slate-200 flex items-center gap-4 animate-pulse">
                        <div className="h-5 w-5 rounded-full bg-slate-200"></div>
                        <div>
                          <div className="h-3 w-20 bg-slate-200 rounded mb-2"></div>
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 px-6 py-5 rounded-lg border border-slate-200 flex items-center gap-4 animate-pulse">
                        <div className="h-5 w-5 rounded-full bg-slate-200"></div>
                        <div>
                          <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                          <div className="h-4 w-28 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                )}
                
                {/* API エラーがある場合はエラー表示 */}
                {apiErrors[application.id] && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex gap-3 text-red-700">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">データ取得エラー</p>
                        <p className="text-sm">{apiErrors[application.id]}</p>
                        <p className="text-sm mt-2">
                          しばらく経ってから再度お試しください。問題が続く場合はサポートにお問い合わせください。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>最終更新: {format(parseISO(application.updated_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span>
                  </div>
                  <div>
                    {application.content_snare_result?.has_unread_comments && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mr-3">
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        未読コメントあり
                      </Badge>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 