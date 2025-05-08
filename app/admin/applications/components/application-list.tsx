"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter,
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatDate, formatFileSize } from "@/lib/utils"
import { 
  School, User, FileText, Calendar, ExternalLink, Clock, 
  CheckCircle2, AlertCircle, Inbox, BarChart4, 
  MessageCircle, UserCircle, Circle, File as FileIcon, 
  Briefcase, MapPin, Mail
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { updateApplicationStatus } from "@/lib/applications"
import { toast } from "react-hot-toast"
import { Progress } from "@/components/ui/progress"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  AlarmClock,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface CourseApplicationDocument {
  id: string
  document_type: string
  status: string
  created_at: string
  updated_at: string
  user_files: {
    id: string
    name: string
    size: number
    type: string
    downloaded: boolean
    path: string
  }[]
}

interface ApplicationComment {
  id: string
  comment: string
  created_at: string
  user_id: string
  profile?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

interface Application {
  id: string
  status: string
  preferred_start_date: string | null
  purpose: string | null
  payment_method: string | null
  created_at: string
  updated_at?: string
  content_snare_id?: string
  content_snare_request_id?: string
  content_snare_result?: {
    id: string
    name?: string
    status?: string
    share_link?: string
    due?: string
    created_at?: string
    updated_at?: string
    last_activity_at?: string
    client_name?: string
    client_email?: string
    sections_count?: number
    pages_count?: number
    pages?: any[]
    sections?: any[]
    has_unread_comments?: boolean
    last_comment_at?: string
    progress?: {
      percent: number
      completed_sections?: number
      in_progress_sections?: number
      total_sections?: number
    }
  }
  course: {
    id: string
    name: string
    content_snare_template_id?: string
    schools: {
      id: string
      name: string
    }
  }
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    profiles?: {
      id: string
      phone?: string
      country?: string
      city?: string
    }[]
  }
  course_application_documents: CourseApplicationDocument[]
  course_application_comments: ApplicationComment[]
}

interface ApplicationListProps {
  applications: Application[]
}

export function ApplicationList({ applications: initialApplications }: ApplicationListProps) {
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [applications, setApplications] = useState(initialApplications)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = searchTerm === "" || 
      (app.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.user?.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.user?.last_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.course?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // ステータスに応じたバッジの表示
  const getStatusBadge = (status: string) => {
    let variant = "default";
    let label = status;
    
    switch (status) {
      case "draft":
        variant = "outline";
        label = "下書き";
        break;
      case "submitted":
        variant = "secondary";
        label = "申請済み";
        break;
      case "approved":
        variant = "default";
        label = "承認済み";
        break;
      case "rejected":
        variant = "destructive";
        label = "却下";
        break;
      case "in_progress":
        variant = "default";
        label = "進行中";
        break;
      case "complete":
        variant = "success";
        label = "完了";
        break;
      case "waiting":
        variant = "warning";
        label = "待機中";
        break;
      default:
        variant = "outline";
        break;
    }
    
    return <Badge variant={variant as any}>{label}</Badge>;
  };

  // 日付フォーマット関数
  const formatISODate = (dateString: string | null | undefined) => {
    if (!dateString) return '未設定';
    
    try {
      return format(parseISO(dateString), 'yyyy年MM月dd日', { locale: ja });
    } catch (e) {
      return dateString;
    }
  }

  // 各申請の最新コメントを取得
  const getLatestComment = (application: Application) => {
    if (!application.course_application_comments || application.course_application_comments.length === 0) {
      return null;
    }
    
    return application.course_application_comments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }

  // 各申請カードの表示
  return (
    <div className="space-y-8">
      {applications.length === 0 ? (
        <div className="text-center p-10 bg-slate-50 rounded-lg">
          <p className="text-muted-foreground">申請情報がありません</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => {
            const latestComment = getLatestComment(application);
            
            return (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {application.course?.name || "コース名なし"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>申請日: {formatISODate(application.created_at)}</span>
                        <span className="mx-1">•</span>
                        <span>ID: {application.id.substring(0, 8)}</span>
                      </CardDescription>
                    </div>
                    
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid md:grid-cols-[3fr_2fr] gap-6">
                    {/* 左側：申請者情報と基本情報 */}
                    <div className="space-y-5">
                      {/* 申請者情報 */}
                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          申請者情報
                        </h3>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-md">
                          <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarImage src={application.user?.avatar_url || ""} />
                            <AvatarFallback>
                              {application.user?.first_name?.charAt(0) || 
                               application.user?.email?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {application.user?.first_name && application.user?.last_name ? (
                                <Link 
                                  href={`/admin/profiles/${application.user.id}`}
                                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                  {`${application.user.first_name} ${application.user.last_name}`}
                                </Link>
                              ) : (
                                application.user?.email || "名前なし"
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {application.user?.email || ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 志望動機 */}
                      {application.purpose && (
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                            志望動機
                          </h3>
                          <p className="text-sm bg-slate-50 p-3 rounded-md">
                            {application.purpose.length > 120 
                              ? `${application.purpose.substring(0, 120)}...` 
                              : application.purpose}
                          </p>
                        </div>
                      )}
                      
                      {/* ファイル一覧 */}
                      {application.course_application_documents && 
                       application.course_application_documents.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <FileIcon className="h-3.5 w-3.5 text-slate-500" />
                            提出書類
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {application.course_application_documents.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                <FileIcon className="h-4 w-4 text-slate-500" />
                                <div className="overflow-hidden">
                                  <div className="text-xs font-medium truncate">
                                    {doc.document_type}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {doc.status === "submitted" ? "提出済" : "未提出"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 右側：Content Snare情報 */}
                    <div className="space-y-5">
                      {application.content_snare_result ? (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                            申請フォーム情報
                          </h3>
                          
                          {/* Content Snare ステータス - 基本情報のみ表示 */}
                          <div className="bg-slate-50 p-3 rounded-md">
                            <p className="text-xs font-medium text-muted-foreground mb-1">フォーム状態</p>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const status = application.content_snare_result.status || 'waiting';
                                let statusText = 'フォーム待機中';
                                let statusColor = 'text-slate-600';
                                let StatusIcon = Circle;
                                
                                if (status === 'complete') {
                                  statusText = '入力完了';
                                  statusColor = 'text-green-600';
                                  StatusIcon = CheckCircle2;
                                } else if (status === 'in_progress') {
                                  statusText = '入力中';
                                  statusColor = 'text-blue-600';
                                  StatusIcon = Clock;
                                } else if (status === 'waiting') {
                                  statusText = '入力待ち';
                                  statusColor = 'text-amber-600';
                                  StatusIcon = Inbox;
                                }
                                
                                return (
                                  <>
                                    <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                                    <span className={`text-sm ${statusColor} font-medium`}>{statusText}</span>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                          
                          {/* 日付情報 */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* 最終更新 */}
                            <div className="bg-slate-50 p-3 rounded-md">
                              <p className="text-xs font-medium text-muted-foreground mb-1">最終更新</p>
                              <p className="text-sm">
                                {application.content_snare_result.last_activity_at ? 
                                  formatISODate(application.content_snare_result.last_activity_at) : 
                                  (application.content_snare_result.updated_at ? 
                                    formatISODate(application.content_snare_result.updated_at) : 
                                    '情報なし')}
                              </p>
                            </div>
                            
                            {/* 提出期限 */}
                            <div className="bg-slate-50 p-3 rounded-md">
                              <p className="text-xs font-medium text-muted-foreground mb-1">提出期限</p>
                              <p className="text-sm">
                                {application.content_snare_result.due ? 
                                  formatISODate(application.content_snare_result.due) : 
                                  '期限なし'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                            申請フォーム情報
                          </h3>
                          <div className="text-sm text-muted-foreground bg-slate-50 p-4 rounded-md flex items-center gap-2">
                            <Circle className="h-4 w-4 text-slate-400" />
                            <span>
                              {application.content_snare_request_id ? 
                                "Content Snare情報を読み込み中..." : 
                                "Content Snare情報がありません"}
                            </span>
                          </div>
                          {application.content_snare_request_id && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Content Snare Request ID: {application.content_snare_request_id}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* コメント情報 */}
                      {application.course_application_comments?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                            最新のコメント
                          </h3>
                          <div className="bg-slate-50 p-3 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <UserCircle className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium">
                                {latestComment?.profile?.first_name && latestComment?.profile?.last_name
                                  ? `${latestComment.profile.first_name} ${latestComment.profile.last_name}`
                                  : latestComment?.profile?.email || "ユーザー"}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatISODate(latestComment?.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{latestComment?.comment}</p>
                          </div>
                          {application.course_application_comments.length > 1 && (
                            <p className="text-xs text-right mt-1 text-muted-foreground">
                              他 {application.course_application_comments.length - 1} 件のコメント
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    最終更新: {formatISODate(application.updated_at || application.created_at)}
                  </p>
                  <Link href={`/admin/applications/${application.id}`} passHref>
                    <Button variant="outline" size="sm" className="gap-1">
                      <span>詳細を表示</span>
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}