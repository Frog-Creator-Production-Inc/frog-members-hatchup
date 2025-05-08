"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import { formatDate } from "@/lib/utils"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, Circle, Clock, ExternalLink, ArrowUpRight,
  Calendar, Inbox, AlarmClock, BarChart4, FileText,
  MessageCircle, LinkIcon, CalendarRange, PlusCircle, Edit, Trash2, 
  ToggleLeft, ToggleRight, LockKeyhole, Loader2, ChevronDown
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { APPLICATION_STATUS } from "@/types/application"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { CourseApplication, ContentSnareData, ContentSnarePage, UserSchedule } from '@/types/application'
import { scheduleFormSchema, ScheduleFormData } from '@/lib/validations/application'

interface ApplicationDetailProps {
  application: CourseApplication
  adminUserIds: string[]
  currentUserId: string | null
  contentSnareData?: ContentSnareData
  contentSnarePages?: ContentSnarePage[]
  schedules?: UserSchedule[]
}

export function ApplicationDetail({ 
  application, 
  adminUserIds, 
  currentUserId,
  contentSnareData,
  contentSnarePages,
  schedules = []
}: ApplicationDetailProps) {
  const [status, setStatus] = useState(application.status)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || "")
  const router = useRouter()
  const supabase = createClientComponentClient()

  // スケジュール管理のための状態
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<UserSchedule | null>(null)
  const [isScheduleSubmitting, setIsScheduleSubmitting] = useState(false)
  const [schedulesList, setSchedulesList] = useState<UserSchedule[]>(() => {
    // 初期表示時にソート順を適用（sort_orderで先にソート）
    return [...schedules].sort((a, b) => a.sort_order - b.sort_order);
  })

  // 新規スケジュール入力用の状態
  const [quickSchedule, setQuickSchedule] = useState<Partial<UserSchedule>>({
    title: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: null,
    is_admin_locked: false,
    is_completed: false
  });

  // インライン編集用の状態
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // フォーム初期化
  const scheduleForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      description: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: null,
      is_completed: false,
      is_admin_locked: false,
      sort_order: 0
    }
  })

  const openStatusDialog = () => {
    setNewStatus(status)
    setAdminNotes(application.admin_notes || "")
    setStatusDialogOpen(true)
  }

  const handleStatusDialogSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      const { error } = await supabase
        .from("course_applications")
        .update({ 
          status: newStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq("id", application.id)

      if (error) throw error

      setStatus(newStatus)
      toast.success(`申請ステータスを${getStatusText(newStatus)}に更新しました`)
      setStatusDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("ステータスの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsSubmitting(true)
      
      const { error } = await supabase
        .from("course_applications")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", application.id)

      if (error) throw error

      setStatus(newStatus)
      toast.success(`申請ステータスを${getStatusText(newStatus)}に更新しました`)
      router.refresh()
    } catch (error) {
      toast.error("ステータスの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case APPLICATION_STATUS.DRAFT: return "下書き"
      case APPLICATION_STATUS.SUBMITTED: return "申請済み"
      case APPLICATION_STATUS.REVIEWING: return "レビュー中"
      case APPLICATION_STATUS.APPROVED: return "承認済み"
      case APPLICATION_STATUS.REJECTED: return "却下"
      default: return status
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPLICATION_STATUS.DRAFT:
        return <Badge variant="outline">下書き</Badge>
      case APPLICATION_STATUS.SUBMITTED:
        return <Badge variant="secondary">申請済み</Badge>
      case APPLICATION_STATUS.REVIEWING:
        return <Badge>レビュー中</Badge>
      case APPLICATION_STATUS.APPROVED:
        return <Badge className="bg-green-500">承認済み</Badge>
      case APPLICATION_STATUS.REJECTED:
        return <Badge variant="destructive">却下</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Content Snare関連のヘルパー関数
  const formatISODate = (dateString: string | null | undefined) => {
    if (!dateString) return '未設定';
    
    try {
      return format(parseISO(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja });
    } catch (e) {
      return String(dateString);
    }
  }

  // プログレスバーの色を決定する関数
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent > 75) return 'bg-blue-500';
    if (percent > 50) return 'bg-blue-400';
    if (percent > 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // 進捗率表示
  const renderEnhancedProgress = (percent: number) => {
    // 白いバーの数を計算
    const whiteBarCount = 30;
    
    return (
      <div className="my-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">フォーム入力状況</span>
          <span className="text-sm font-medium text-slate-700">
            {percent}%
          </span>
        </div>
        
        <div className="relative flex items-center">
          <div className="w-full h-8 bg-slate-200 rounded-full shadow-inner overflow-hidden">
            <div 
              className={`h-full rounded-full ${getProgressColor(percent)} relative transition-all duration-700 ease-out flex justify-center items-center`} 
              style={{ width: `${percent}%` }}
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
              
              {percent > 15 && (
                <span className="text-xs font-semibold text-white relative z-10">
                  {percent}%
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
  }

  // Content Snareのステータスバッジを取得
  const getContentSnareStatusBadge = () => {
    if (!contentSnareData) return null;
    
    const status = contentSnareData.status || 'waiting';
    let statusText = 'フォーム待機中';
    let statusColor = 'bg-slate-200 text-slate-600';
    let StatusIcon = Circle;
    
    if (status === 'complete') {
      statusText = '入力完了';
      statusColor = 'bg-green-100 text-green-600';
      StatusIcon = CheckCircle2;
    } else if (status === 'in_progress') {
      statusText = '入力中';
      statusColor = 'bg-blue-100 text-blue-600';
      StatusIcon = Clock;
    } else if (status === 'waiting') {
      statusText = '入力待ち';
      statusColor = 'bg-amber-100 text-amber-600';
      StatusIcon = Inbox;
    }
    
    return (
      <Badge className={`${statusColor} gap-1 font-normal`}>
        <StatusIcon className="h-3.5 w-3.5" />
        <span>{statusText}</span>
      </Badge>
    );
  }

  // スケジュール管理関数
  const openAddScheduleDialog = () => {
    setIsEditing(false)
    setCurrentSchedule(null)
    scheduleForm.reset({
      title: "",
      description: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: null,
      is_completed: false,
      is_admin_locked: false,
      sort_order: 0
    })
    setScheduleDialogOpen(true)
  }

  const openEditScheduleDialog = (schedule: UserSchedule) => {
    setIsEditing(true)
    setCurrentSchedule(schedule)
    scheduleForm.reset({
      title: schedule.title,
      description: schedule.description || "",
      year: schedule.year,
      month: schedule.month,
      day: schedule.day || null,
      is_completed: schedule.is_completed,
      is_admin_locked: schedule.is_admin_locked,
      sort_order: schedule.sort_order
    })
    setScheduleDialogOpen(true)
  }

  const handleScheduleSubmit = async (values: ScheduleFormData) => {
    try {
      setIsScheduleSubmitting(true)
      
      // 送信データ準備
      const scheduleData = {
        ...values,
        course_application_id: application.id,
        updated_at: new Date().toISOString()
      }
      
      if (isEditing && currentSchedule) {
        // 更新
        const { data, error } = await supabase
          .from("user_schedules")
          .update(scheduleData)
          .eq("id", currentSchedule.id)
          .select()
        
        if (error) throw error
        
        // 成功時の処理
        setSchedulesList(prevSchedules => 
          prevSchedules.map(s => s.id === currentSchedule.id ? data[0] : s)
        )
        toast.success("スケジュールを更新しました")
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from("user_schedules")
          .insert({
            ...scheduleData,
            created_at: new Date().toISOString()
          })
          .select()
        
        if (error) throw error
        
        // 成功時の処理
        setSchedulesList(prevSchedules => [...prevSchedules, data[0]])
        toast.success("スケジュールを作成しました")
      }
      
      // ダイアログを閉じる
      setScheduleDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("スケジュールの保存に失敗しました")
    } finally {
      setIsScheduleSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("このスケジュールを削除してもよろしいですか？")) return
    
    try {
      setIsScheduleSubmitting(true)
      
      // 削除処理
      const { error } = await supabase
        .from("user_schedules")
        .delete()
        .eq("id", scheduleId)
      
      if (error) throw error
      
      // 成功時の処理
      setSchedulesList(prevSchedules => 
        prevSchedules.filter(s => s.id !== scheduleId)
      )
      toast.success("スケジュールを削除しました")
      router.refresh()
    } catch (error) {
      toast.error("スケジュールの削除に失敗しました")
    } finally {
      setIsScheduleSubmitting(false)
    }
  }

  // 日付のフォーマット関数
  const formatScheduleDate = (schedule: UserSchedule) => {
    const year = schedule.year
    const month = schedule.month
    const day = schedule.day
    
    if (day) {
      return `${year}年${month}月${day}日`
    } else {
      return `${year}年${month}月`
    }
  }

  // 並び替えハンドラー
  const handleDragEnd = async (result: any) => {
    // ドロップ先がない場合は何もしない
    if (!result.destination) return;
    
    // 移動元と移動先が同じ場合は何もしない
    if (result.destination.index === result.source.index) return;
    
    // スケジュールの並び替え
    const reorderedSchedules = Array.from(schedulesList);
    const [removed] = reorderedSchedules.splice(result.source.index, 1);
    reorderedSchedules.splice(result.destination.index, 0, removed);
    
    // 表示用のステートを更新（先に更新して即座にUIに反映）
    setSchedulesList(reorderedSchedules);
    
    // 並び順を更新（sort_orderを0から順番に振り直し）
    try {
      setIsScheduleSubmitting(true);
      
      // 更新が必要なスケジュールだけを更新する
      for (let i = 0; i < reorderedSchedules.length; i++) {
        const schedule = reorderedSchedules[i];
        // すでに正しい順序である場合はスキップ
        if (schedule.sort_order === i) continue;
        
        const { data, error } = await supabase
          .from("user_schedules")
          .update({ sort_order: i })
          .eq("id", schedule.id)
          .select();
        
        if (error) {
          throw error;
        }
        
        // 成功したらスケジュールオブジェクトも更新
        schedule.sort_order = i;
      }
      
      // 再度表示用のステートを更新して確実に反映
      setSchedulesList([...reorderedSchedules]);
      
      toast.success("スケジュールの並び順を更新しました");
    } catch (error: any) {
      toast.error("並び順の更新に失敗しました");
      
      // エラー時には最新の状態を取得し直す
      const { data } = await supabase
        .from("user_schedules")
        .select("*")
        .eq("course_application_id", application.id)
        .order("sort_order");
      
      if (data) {
        setSchedulesList(data);
      } else {
        // データ取得に失敗した場合はページをリロード
        router.refresh();
      }
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  // クイック追加処理
  const handleQuickAddSchedule = async () => {
    if (!quickSchedule.title) {
      toast.error("タイトルを入力してください");
      return;
    }

    try {
      setIsScheduleSubmitting(true);
      
      // 既存のスケジュールから最大のsort_orderを取得
      const maxSortOrder = schedulesList.length > 0 
        ? Math.max(...schedulesList.map(s => s.sort_order)) 
        : -1;
      
      // 新規スケジュールデータ
      const newSchedule = {
        title: quickSchedule.title,
        description: "",
        year: quickSchedule.year,
        month: quickSchedule.month,
        day: quickSchedule.day,
        is_admin_locked: quickSchedule.is_admin_locked,
        is_completed: quickSchedule.is_completed,
        sort_order: maxSortOrder + 1,
        course_application_id: application.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // データ保存
      const { data, error } = await supabase
        .from("user_schedules")
        .insert(newSchedule)
        .select();
      
      if (error) throw error;
      
      // 成功時の処理
      setSchedulesList(prevSchedules => [...prevSchedules, data[0]]);
      toast.success("スケジュールを追加しました");
      
      // 入力フォームをリセット（年月はそのまま）
      setQuickSchedule(prev => ({
        ...prev,
        title: "",
        day: null,
        is_admin_locked: false,
        is_completed: false
      }));
    } catch (error) {
      toast.error("スケジュールの保存に失敗しました");
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  // インライン編集の開始
  const startEditing = (schedule: UserSchedule) => {
    setEditingScheduleId(schedule.id);
    setCurrentSchedule(schedule);
    scheduleForm.reset({
      title: schedule.title,
      description: schedule.description || "",
      year: schedule.year,
      month: schedule.month,
      day: schedule.day || null,
      is_completed: schedule.is_completed,
      is_admin_locked: schedule.is_admin_locked,
      sort_order: schedule.sort_order
    });
    
    // 編集モードに入ったらそのスケジュールを展開表示
    setExpandedScheduleId(schedule.id);
    
    // タイトル入力にフォーカス（少し遅延させる）
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 100);
  };

  // インライン編集の保存
  const saveInlineEdit = async () => {
    if (!currentSchedule) return;
    
    try {
      setIsScheduleSubmitting(true);
      const values = scheduleForm.getValues();
      
      // 送信データ準備
      const scheduleData = {
        ...values,
        updated_at: new Date().toISOString()
      };
      
      // 更新
      const { data, error } = await supabase
        .from("user_schedules")
        .update(scheduleData)
        .eq("id", currentSchedule.id)
        .select();
      
      if (error) throw error;
      
      // 成功時の処理
      setSchedulesList(prevSchedules => 
        prevSchedules.map(s => s.id === currentSchedule.id ? data[0] : s)
      );
      toast.success("スケジュールを更新しました");
      
      // 編集モードを終了
      setEditingScheduleId(null);
    } catch (error) {
      toast.error("スケジュールの更新に失敗しました");
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  // 編集のキャンセル
  const cancelEditing = () => {
    setEditingScheduleId(null);
  };

  // 詳細の展開・折りたたみ
  const toggleExpandSchedule = (scheduleId: string) => {
    setExpandedScheduleId(prev => prev === scheduleId ? null : scheduleId);
  };

  // スケジュール完了状態の切り替え
  const toggleScheduleCompletion = async (schedule: UserSchedule) => {
    try {
      setIsScheduleSubmitting(true);
      
      // 更新データ
      const updatedData = {
        is_completed: !schedule.is_completed,
        updated_at: new Date().toISOString()
      };
      
      // 更新処理
      const { data, error } = await supabase
        .from("user_schedules")
        .update(updatedData)
        .eq("id", schedule.id)
        .select();
      
      if (error) throw error;
      
      // 成功時の処理
      setSchedulesList(prevSchedules => 
        prevSchedules.map(s => s.id === schedule.id ? data[0] : s)
      );
      toast.success(`スケジュールを${data[0].is_completed ? '完了' : '未完了'}に変更しました`);
    } catch (error) {
      toast.error("スケジュールの更新に失敗しました");
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  // スケジュールロック状態の切り替え
  const toggleScheduleLock = async (schedule: UserSchedule) => {
    try {
      setIsScheduleSubmitting(true);
      
      // 更新データ
      const updatedData = {
        is_admin_locked: !schedule.is_admin_locked,
        updated_at: new Date().toISOString()
      };
      
      // 更新処理
      const { data, error } = await supabase
        .from("user_schedules")
        .update(updatedData)
        .eq("id", schedule.id)
        .select();
      
      if (error) throw error;
      
      // 成功時の処理
      setSchedulesList(prevSchedules => 
        prevSchedules.map(s => s.id === schedule.id ? data[0] : s)
      );
      toast.success(`スケジュールを${data[0].is_admin_locked ? 'ロック' : 'ロック解除'}しました`);
    } catch (error) {
      toast.error("スケジュールの更新に失敗しました");
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {application.course ? (
              <>
                {application.course.name} 
                {application.course.schools && application.course.schools.name && (
                  <> - {application.course.schools.name}</>
                )}
              </>
            ) : (
              <>コース情報が利用できません</>
            )}
          </h2>
          {getStatusBadge(status)}
        </div>
        <div className="flex gap-2">
          {status === APPLICATION_STATUS.SUBMITTED && (
            <Button 
              onClick={() => handleStatusChange(APPLICATION_STATUS.REVIEWING)}
              disabled={isSubmitting}
            >
              申請を受諾
            </Button>
          )}
          {status === APPLICATION_STATUS.REVIEWING && (
            <Button 
              onClick={() => handleStatusChange(APPLICATION_STATUS.APPROVED)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              申請を完了
            </Button>
          )}
          {status !== APPLICATION_STATUS.REJECTED && (
            <Button 
              variant="destructive"
              onClick={() => handleStatusChange(APPLICATION_STATUS.REJECTED)}
              disabled={isSubmitting}
            >
              申請を却下
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-8 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">申請基本情報</CardTitle>
            <Button onClick={openStatusDialog} variant="outline">
              ステータス変更
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">ステータス:</span>
                {getStatusBadge(status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">申請日:</span>
                <span>{formatDate(application.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">最終更新:</span>
                <span>{formatDate(application.updated_at)}</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>申請者情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">氏名</p>
                    <p>
                      {application.user && application.user.first_name && application.user.last_name ? (
                        <a 
                          href={`/admin/profiles/${application.user.id}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {`${application.user.first_name} ${application.user.last_name}`}
                        </a>
                      ) : (
                        "未設定"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">メールアドレス</p>
                    <p>{application.user ? application.user.email : "未設定"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ステータス更新ダイアログ */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>申請ステータスの変更</DialogTitle>
            <DialogDescription>
              このコース申請のステータスを更新します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">ステータス</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={APPLICATION_STATUS.DRAFT}>下書き</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.SUBMITTED}>申請済み</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.REVIEWING}>レビュー中</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.APPROVED}>承認済み</SelectItem>
                  <SelectItem value={APPLICATION_STATUS.REJECTED}>却下</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="adminNotes" className="text-sm font-medium">管理者メモ</label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="管理者用のメモを入力してください"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleStatusDialogSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contentSnareData && (
        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Content Snareフォーム情報
                    {getContentSnareStatusBadge()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contentSnareData.name || "無題のフォーム"}
                  </p>
                </div>
                {contentSnareData.url && (
                  <a 
                    href={contentSnareData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <span>Content Snareで開く</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 進行状況 - 新しいプログレスバーを使用 */}
              {contentSnareData && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium flex items-center gap-1.5">
                      <BarChart4 className="h-4 w-4 text-slate-500" />
                      進行状況
                    </h3>
                    <p className="text-sm font-medium">
                      {/* プログレスデータがある場合はそれを表示、ない場合は0/0と表示 */}
                      {contentSnareData.progress ? (
                        <>{contentSnareData.progress.done_fields || 0}/{contentSnareData.progress.total_fields || 0} フィールド完了</>
                      ) : contentSnareData.done_fields_count !== undefined && contentSnareData.fields_count !== undefined ? (
                        <>{contentSnareData.done_fields_count}/{contentSnareData.fields_count} フィールド完了</>
                      ) : (
                        <>0/0 フィールド完了</>
                      )}
                    </p>
                  </div>
                  
                  {/* プログレスバーの表示 - progressデータがあればパーセントを使用、なければ0を表示 */}
                  {contentSnareData.progress && typeof contentSnareData.progress.percent === 'number'
                    ? renderEnhancedProgress(contentSnareData.progress.percent)
                    : contentSnareData.completion_percentage !== undefined
                      ? renderEnhancedProgress(Number(contentSnareData.completion_percentage))
                      : renderEnhancedProgress(0)
                  }
                </div>
              )}

              {/* 基本情報 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-xs font-medium text-muted-foreground mb-1">作成日</p>
                  <p className="text-sm">{formatISODate(contentSnareData.created_at)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-xs font-medium text-muted-foreground mb-1">最終更新日</p>
                  <p className="text-sm">{formatISODate(contentSnareData.last_activity_at || contentSnareData.updated_at)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-xs font-medium text-muted-foreground mb-1">提出期限</p>
                  <p className="text-sm">
                    {contentSnareData.due ? (
                      <span className="flex items-center gap-1">
                        <AlarmClock className="h-3.5 w-3.5 text-red-500" />
                        {formatISODate(contentSnareData.due)}
                      </span>
                    ) : (
                      '期限なし'
                    )}
                  </p>
                </div>
              </div>

              {/* クライアント情報 */}
              {(contentSnareData.client || contentSnareData.client_name || contentSnareData.client_email) && (
                <div className="bg-slate-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">クライアント情報</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">名前: </span>
                      {contentSnareData.client?.full_name || contentSnareData.client_name || '未設定'}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">メール: </span>
                      {contentSnareData.client?.email || contentSnareData.client_email || '未設定'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* コメント情報 */}
              {contentSnareData.has_unread_comments && (
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                  <h3 className="text-sm font-medium flex items-center gap-1.5 text-amber-700 mb-2">
                    <MessageCircle className="h-4 w-4" />
                    未読のコメントがあります
                  </h3>
                  <p className="text-sm text-amber-600">
                    最終コメント: {formatISODate(contentSnareData.last_comment_at)}
                  </p>
                </div>
              )}

              {/* 詳細情報とレスポンス */}
              {contentSnareData.responses && (
                <Card className="border-slate-200">
                  <CardHeader className="px-4 py-3">
                    <CardTitle className="text-base">フォームレスポンス</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-0 pb-4">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(contentSnareData.responses).map(([key, value]: [string, any]) => {
                        // instruction_text以外の情報を表示
                        if (key === 'instruction_text') return null;
                        
                        return (
                          <AccordionItem key={key} value={key} className="border-b border-slate-200">
                            <AccordionTrigger className="py-3 text-sm hover:no-underline">
                              <span className="font-medium">{key}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-2 bg-slate-50 rounded text-sm">
                                {typeof value === 'object' ? (
                                  <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : value === null || value === '' ? (
                                  <span className="text-slate-400">未入力</span>
                                ) : (
                                  <p className="whitespace-pre-wrap">{String(value)}</p>
                                )}
              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
            </CardContent>
          </Card>
              )}

              {/* セクション情報 */}
              {contentSnareData.sections && contentSnareData.sections.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="px-4 py-3">
                    <CardTitle className="text-base">セクション一覧</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-0 pb-4">
                    <Accordion type="multiple" className="w-full">
                      {contentSnareData.sections.map((section: any) => (
                        <AccordionItem key={section.id} value={section.id} className="border-b border-slate-200">
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex items-center gap-2 text-sm">
                              {section.status === 'complete' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : section.status === 'in_progress' ? (
                                <Clock className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-300" />
                              )}
                              <span className="font-medium">{section.name}</span>
                              <Badge 
                                variant={section.status === 'complete' ? 'default' : 'outline'}
                                className={`ml-2 ${section.status === 'complete' ? 'bg-green-100 text-green-600 hover:bg-green-100' : ''}`}
                              >
                                {section.status === 'complete' ? '完了' : section.status === 'in_progress' ? '進行中' : '未着手'}
                              </Badge>
                        </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pl-2">
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">説明: </span>
                                {section.description || 'なし'}
                              </p>
                              
                              {section.pages && section.pages.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-medium">ページ一覧:</h4>
                                  <div className="space-y-1">
                                    {section.pages.map((page: any) => (
                                      <div key={page.id} className="bg-white p-2 rounded border flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-sm">
                                          <FileText className="h-4 w-4 text-slate-400" />
                                          <span>{page.name}</span>
                      </div>
                                        <Badge 
                                          variant={page.status === 'complete' ? 'default' : 'outline'}
                                          className={page.status === 'complete' ? 'bg-green-100 text-green-600 hover:bg-green-100' : ''}
                                        >
                                          {page.status === 'complete' ? '完了' : page.status === 'in_progress' ? '進行中' : '未着手'}
                                        </Badge>
                                      </div>
                                    ))}
                        </div>
                      </div>
                              )}
                    </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* メタデータと追加情報の表示 */}
              <Card className="border-slate-200">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-base">その他の情報</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(contentSnareData).map(([key, value]: [string, any]) => {
                      // すでに表示済みの項目や複雑なオブジェクトをスキップ
                      if (['name', 'status', 'client', 'progress', 'sections', 'created_at', 'updated_at', 'due', 'instruction_text', 'responses', 'pages'].includes(key) || 
                          typeof value === 'object' || value === null) 
                        return null;
                      
                      return (
                        <div key={key} className="p-2 bg-slate-50 rounded">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{key}</p>
                          <p className="text-sm break-words">
                            {key.includes('link') || key.includes('url') ? (
                              <a 
                                href={String(value)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {String(value).substring(0, 30)}...
                                <ArrowUpRight className="h-3 w-3" />
                              </a>
                            ) : (
                              String(value)
                            )}
                          </p>
                        </div>
                      );
                    })}
              </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}

      {/* スケジュール管理セクション */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <CalendarRange className="h-5 w-5 mr-2" />
              渡航スケジュール管理
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* クイック追加フォーム */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium mb-3">スケジュールをクイック追加</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[150px]">
                <Input 
                  placeholder="タイトル（必須）" 
                  value={quickSchedule.title}
                  onChange={e => setQuickSchedule(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div className="flex items-center gap-1">
                <Input 
                  type="number" 
                  min="2000" 
                  max="2100"
                  value={quickSchedule.year}
                  onChange={e => setQuickSchedule(prev => ({ ...prev, year: Number(e.target.value) }))}
                  className="w-20 bg-white"
                />
                <span className="text-sm">年</span>
              </div>
              <div className="flex items-center gap-1">
                <Input 
                  type="number" 
                  min="1" 
                  max="12"
                  value={quickSchedule.month}
                  onChange={e => setQuickSchedule(prev => ({ ...prev, month: Number(e.target.value) }))}
                  className="w-16 bg-white"
                />
                <span className="text-sm">月</span>
              </div>
              <div className="flex items-center gap-1">
                <Input 
                  type="number" 
                  min="1" 
                  max="31"
                  value={quickSchedule.day === null ? "" : quickSchedule.day}
                  onChange={e => setQuickSchedule(prev => ({ 
                    ...prev, 
                    day: e.target.value === "" ? null : Number(e.target.value) 
                  }))}
                  placeholder="--"
                  className="w-16 bg-white"
                />
                <span className="text-sm">日</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="quick-lock"
                  checked={quickSchedule.is_admin_locked}
                  onCheckedChange={(checked) => 
                    setQuickSchedule(prev => ({ ...prev, is_admin_locked: checked === true }))
                  }
                />
                <label htmlFor="quick-lock" className="text-sm cursor-pointer">
                  管理者限定
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="quick-complete"
                  checked={quickSchedule.is_completed}
                  onCheckedChange={(checked) => 
                    setQuickSchedule(prev => ({ ...prev, is_completed: checked === true }))
                  }
                />
                <label htmlFor="quick-complete" className="text-sm cursor-pointer">
                  完了済
                </label>
              </div>
              <Button
                onClick={handleQuickAddSchedule}
                disabled={isScheduleSubmitting || !quickSchedule.title}
                size="sm"
                className="ml-auto"
              >
                {isScheduleSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-1" />
                )}
                追加
              </Button>
            </div>
          </div>

          {schedulesList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              スケジュールが設定されていません。上のフォームから新しいスケジュールを作成してください。
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="schedules">
                {(provided) => (
                  <div 
                    className="space-y-4"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {schedulesList.map((schedule, index) => (
                      <Draggable 
                        key={schedule.id} 
                        draggableId={schedule.id} 
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "border rounded-md transition-all relative",
                              schedule.is_completed 
                                ? "bg-slate-50 border-slate-200" 
                                : "bg-white border-slate-200"
                            )}
                          >
                            {/* 通常表示 (編集モードでない場合) */}
                            {editingScheduleId !== schedule.id ? (
                              <>
                                <div 
                                  className="p-4 flex justify-between items-start"
                                  {...provided.dragHandleProps}
                                >
                                  <div className="flex items-start gap-3">
                                    <button
                                      type="button"
                                      onClick={() => toggleScheduleCompletion(schedule)}
                                      className="mt-0.5 bg-transparent border-0 p-0 cursor-pointer hover:opacity-80"
                                    >
                                      {schedule.is_completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-slate-300" />
                                      )}
                                    </button>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{schedule.title}</span>
                                        <button
                                          type="button"
                                          onClick={() => toggleScheduleLock(schedule)}
                                          className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80"
                                          title={schedule.is_admin_locked ? "管理者限定にする" : "管理者限定を解除"}
                                        >
                                          {schedule.is_admin_locked ? (
                                            <LockKeyhole className="h-4 w-4 text-amber-500" />
                                          ) : (
                                            <LockKeyhole className="h-4 w-4 text-slate-200" />
                                          )}
                                        </button>
                                      </div>
                                      {schedule.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{schedule.description}</p>
                                      )}
                                      <div className="text-sm font-medium mt-2 text-blue-600">
                                        {formatScheduleDate(schedule)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => toggleExpandSchedule(schedule.id)}
                                      title="詳細を表示"
                                    >
                                      <div className="rotate-0 transition-transform duration-200" style={{
                                        transform: expandedScheduleId === schedule.id ? 'rotate(180deg)' : ''
                                      }}>
                                        <ChevronDown className="h-4 w-4" />
                                      </div>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => startEditing(schedule)}
                                      title="編集"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                      title="削除"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* 詳細表示（展開時） */}
                                {expandedScheduleId === schedule.id && (
                                  <div className="px-4 pb-4 pt-1 pl-12 border-t border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-xs font-medium text-slate-500 mb-1">作成日時</h4>
                                        <p className="text-sm">{formatDate(schedule.created_at)}</p>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-medium text-slate-500 mb-1">最終更新日時</h4>
                                        <p className="text-sm">{formatDate(schedule.updated_at)}</p>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-medium text-slate-500 mb-1">ID</h4>
                                        <p className="text-sm text-slate-600">{schedule.id}</p>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-medium text-slate-500 mb-1">表示順</h4>
                                        <p className="text-sm">{schedule.sort_order}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              // インライン編集モード
                              <div className="p-4 space-y-4">
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <Input
                                      ref={titleInputRef}
                                      placeholder="タイトル"
                                      {...scheduleForm.register("title")}
                                    />
                                    {scheduleForm.formState.errors.title && (
                                      <p className="text-xs text-red-500 mt-1">{scheduleForm.formState.errors.title.message}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`locked-${schedule.id}`}
                                      checked={scheduleForm.watch("is_admin_locked")}
                                      onCheckedChange={(checked) => scheduleForm.setValue("is_admin_locked", checked === true)}
                                    />
                                    <label htmlFor={`locked-${schedule.id}`} className="text-sm">管理者限定</label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`completed-${schedule.id}`}
                                      checked={scheduleForm.watch("is_completed")}
                                      onCheckedChange={(checked) => scheduleForm.setValue("is_completed", checked === true)}
                                    />
                                    <label htmlFor={`completed-${schedule.id}`} className="text-sm">完了済</label>
                                  </div>
                                </div>
                                
                                <div>
                                  <Textarea
                                    placeholder="説明（任意）"
                                    {...scheduleForm.register("description")}
                                    className="min-h-[80px]"
                                  />
                                </div>
                                
                                <div className="flex flex-wrap gap-3">
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="2000"
                                      max="2100"
                                      className="w-20"
                                      {...scheduleForm.register("year", { valueAsNumber: true })}
                                    />
                                    <span className="text-sm">年</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="12"
                                      className="w-16"
                                      {...scheduleForm.register("month", { valueAsNumber: true })}
                                    />
                                    <span className="text-sm">月</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="31"
                                      className="w-16"
                                      placeholder="--"
                                      value={scheduleForm.watch("day") === null ? "" : scheduleForm.watch("day")}
                                      onChange={(e) => {
                                        const value = e.target.value === "" ? null : Number(e.target.value);
                                        scheduleForm.setValue("day", value === null ? undefined : value);
                                      }}
                                    />
                                    <span className="text-sm">日</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      className="w-16"
                                      {...scheduleForm.register("sort_order", { valueAsNumber: true })}
                                    />
                                    <span className="text-sm">表示順</span>
                                  </div>
                                  <div className="flex items-center gap-2 ml-auto">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={cancelEditing}
                                    >
                                      キャンセル
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={saveInlineEdit}
                                      disabled={isScheduleSubmitting}
                                    >
                                      {isScheduleSubmitting ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : null}
                                      保存
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* スケジュールダイアログ */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "スケジュールを編集" : "新しいスケジュールを追加"}
            </DialogTitle>
            <DialogDescription>
              コース申請に関するスケジュールを作成します。月のみ指定の場合は「日」は空欄にしてください。
            </DialogDescription>
          </DialogHeader>
          
          <Form {...scheduleForm}>
            <form 
              onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)} 
              className="space-y-4 py-2"
            >
              <FormField
                control={scheduleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input placeholder="例: ビザ申請" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={scheduleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明 (任意)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="例: 必要書類を揃えて大使館に申請してください" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={scheduleForm.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年</FormLabel>
                      <FormControl>
                        <Input type="number" min="2000" max="2100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={scheduleForm.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>月</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={scheduleForm.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日 (任意)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="31" 
                          placeholder="空欄 = 月内" 
                          {...field} 
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            // 空欄の場合はnullに設定
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={scheduleForm.control}
                  name="is_admin_locked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">管理者のみ編集可</FormLabel>
                        <FormDescription>
                          チェックするとユーザーは閲覧のみで編集できません
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={scheduleForm.control}
                  name="is_completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">完了済み</FormLabel>
                        <FormDescription>
                          タスクが完了している場合はチェック
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={scheduleForm.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>表示順 (数値)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      同じ日付の中での表示順序（小さい数値が先に表示）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setScheduleDialogOpen(false)}
                  type="button"
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={isScheduleSubmitting}
                >
                  {isScheduleSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "更新する" : "追加する"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 