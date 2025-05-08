'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarRange, CheckCircle2, Circle, CalendarClock, Clock, AlertTriangle,
  Edit, Pencil, Calendar, Loader2, School
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { UserSchedule, IntakeDate } from '@/types/application'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { scheduleDateFormSchema, ScheduleDateFormData } from '@/lib/validations/application'

interface UserSchedulesProps {
  applicationId: string
}

export function UserSchedules({ applicationId }: UserSchedulesProps) {
  const [schedules, setSchedules] = useState<UserSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [intakeDate, setIntakeDate] = useState<IntakeDate | null>(null)
  const [courseInfo, setCourseInfo] = useState<{ name: string }>({ name: '' })
  // 編集中のスケジュールの状態を管理
  const [editingValues, setEditingValues] = useState<{[key: string]: {
    year: number,
    month: number,
    day: number | null,
    isSaving: boolean
  }}>({});
  const { toast } = useToast()

  // フォーム初期化
  const dateForm = useForm<ScheduleDateFormData>({
    resolver: zodResolver(scheduleDateFormSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: null
    }
  })

  // アプリケーション情報（入学日を含む）を取得
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!applicationId) return
      
      try {
        const response = await fetch(`/api/course-application/details?applicationId=${applicationId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'アプリケーション情報の取得に失敗しました')
        }
        
        const data = await response.json()
        if (data.success && data.data) {
          // 入学日情報があれば設定
          if (data.data.application.intake_date) {
            setIntakeDate(data.data.application.intake_date)
          }
          
          // コース情報を設定
          if (data.data.course) {
            setCourseInfo({ name: data.data.course.name })
          }
        }
      } catch (err) {
        console.error('アプリケーション情報取得エラー:', err)
      }
    }
    
    fetchApplicationDetails()
  }, [applicationId])

  // スケジュールデータを取得
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!applicationId) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/course-application/schedules?applicationId=${applicationId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'スケジュールの取得に失敗しました')
        }
        
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setSchedules(data.data)
        } else {
          throw new Error('スケジュールデータの形式が不正です')
        }
      } catch (err) {
        console.error('スケジュール取得エラー:', err)
        setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSchedules()
  }, [applicationId])
  
  // 各スケジュールの初期値を設定
  useEffect(() => {
    if (schedules.length > 0) {
      const newValues: {[key: string]: any} = {};
      schedules.forEach(schedule => {
        newValues[schedule.id] = {
          year: schedule.year,
          month: schedule.month,
          day: schedule.day,
          isSaving: false
        };
      });
      setEditingValues(newValues);
    }
  }, [schedules]);
  
  // スケジュールのローカル値を初期化・更新する関数
  const initScheduleEditValues = (schedule: UserSchedule) => {
    if (!editingValues[schedule.id]) {
      setEditingValues(prev => ({
        ...prev,
        [schedule.id]: {
          year: schedule.year,
          month: schedule.month,
          day: schedule.day,
          isSaving: false
        }
      }));
    }
  };
  
  // 完了状態を切り替える関数
  const toggleCompleted = async (scheduleId: string, currentCompleted: boolean) => {
    try {
      setUpdating(scheduleId)
      
      const response = await fetch('/api/course-application/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          scheduleId,
          completed: !currentCompleted,
          action: 'toggle_completed'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'スケジュールの更新に失敗しました')
      }
      
      const data = await response.json()
      if (data.success) {
        // 成功したらスケジュールを更新
        setSchedules(prevSchedules => 
          prevSchedules.map(schedule => 
            schedule.id === scheduleId 
              ? { ...schedule, is_completed: !currentCompleted } 
              : schedule
          )
        )
        
        toast({
          title: "スケジュールを更新しました",
          description: `「${schedules.find(s => s.id === scheduleId)?.title}」を${!currentCompleted ? '完了' : '未完了'}に設定しました`,
        })
      } else {
        throw new Error('スケジュールの更新に失敗しました')
      }
    } catch (err) {
      console.error('スケジュール更新エラー:', err)
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : 'スケジュールの更新に失敗しました',
        variant: "destructive"
      })
    } finally {
      setUpdating(null)
    }
  }
  
  // 日付の更新関数
  const handleUpdateDate = async (schedule: UserSchedule) => {
    const scheduleId = schedule.id;
    if (updating === scheduleId || schedule.is_admin_locked) return;
    
    try {
      // 編集中の値を更新
      setEditingValues(prev => ({
        ...prev,
        [scheduleId]: {
          ...prev[scheduleId],
          isSaving: true
        }
      }));
      
      const { year, month, day } = editingValues[scheduleId];
      
      const response = await fetch('/api/course-application/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          scheduleId: scheduleId,
          year,
          month,
          day,
          action: 'update_date'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'スケジュールの更新に失敗しました');
      }
      
      const data = await response.json();
      if (data.success) {
        // 成功したらスケジュールを更新
        setSchedules(prevSchedules => 
          prevSchedules.map(s => 
            s.id === scheduleId 
              ? { ...s, year, month, day } 
              : s
          )
        );
        
        toast({
          title: "日程を更新しました",
          description: `「${schedule.title}」の日程を更新しました`,
        });
      } else {
        throw new Error('スケジュールの更新に失敗しました');
      }
    } catch (err) {
      console.error('スケジュール日程更新エラー:', err);
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : 'スケジュールの更新に失敗しました',
        variant: "destructive"
      });
      
      // エラー時は元の値に戻す
      setEditingValues(prev => ({
        ...prev,
        [scheduleId]: {
          year: schedule.year,
          month: schedule.month,
          day: schedule.day,
          isSaving: false
        }
      }));
    } finally {
      setEditingValues(prev => ({
        ...prev,
        [scheduleId]: {
          ...prev[scheduleId],
          isSaving: false
        }
      }));
    }
  };
  
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
  
  // ISO日付を日本語形式にフォーマットする関数
  const formatJaDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'yyyy年MM月dd日', { locale: ja });
    } catch (e) {
      return dateString;
    }
  }

  // 日付が近いかどうかを判定する関数
  const isDateApproaching = (schedule: UserSchedule) => {
    if (!schedule || schedule.is_completed) return false
    
    const now = new Date()
    const scheduleDate = new Date(
      schedule.year, 
      schedule.month - 1, 
      schedule.day || 15 // 日付がない場合は月の中旬と仮定
    )
    
    // 1ヶ月以内（30日）なら近いと判定
    const diffTime = scheduleDate.getTime() - now.getTime()
    const diffDays = diffTime / (1000 * 3600 * 24)
    
    return diffDays >= 0 && diffDays <= 30
  }

  // 現在月、将来、過去のスケジュールを分類
  const groupSchedules = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const currentMonthSchedules = schedules.filter(s => 
      s.year === currentYear && s.month === currentMonth
    )
    
    const futureSchedules = schedules.filter(s => 
      (s.year > currentYear) || 
      (s.year === currentYear && s.month > currentMonth)
    )
    
    const pastSchedules = schedules.filter(s => 
      (s.year < currentYear) || 
      (s.year === currentYear && s.month < currentMonth)
    )
    
    return {
      currentMonthSchedules,
      futureSchedules,
      pastSchedules
    }
  }
  
  const renderScheduleItem = (schedule: UserSchedule) => {
    // 編集値がまだ初期化されていない場合は初期化
    if (!editingValues[schedule.id]) {
      initScheduleEditValues(schedule);
      return null; // 値が初期化されるまで何も表示しない
    }
    
    const editValues = editingValues[schedule.id];
    const isSaving = editValues.isSaving;
    
    // 入力値の変更ハンドラ
    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setEditingValues(prev => ({
        ...prev,
        [schedule.id]: {
          ...prev[schedule.id],
          year: value
        }
      }));
    };
    
    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setEditingValues(prev => ({
        ...prev,
        [schedule.id]: {
          ...prev[schedule.id],
          month: value
        }
      }));
    };
    
    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === "" ? null : Number(e.target.value);
      setEditingValues(prev => ({
        ...prev,
        [schedule.id]: {
          ...prev[schedule.id],
          day: value
        }
      }));
    };
    
    return (
      <div 
        key={schedule.id} 
        className={cn(
          "border rounded-md p-4 transition-all",
          schedule.is_completed 
            ? "bg-slate-50 border-slate-200" 
            : "bg-white border-slate-200",
          isDateApproaching(schedule) && !schedule.is_completed
            ? "border-amber-200 bg-amber-50/50"
            : ""
        )}
      >
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mt-0.5"
            onClick={() => !schedule.is_admin_locked && toggleCompleted(schedule.id, schedule.is_completed)}
            disabled={updating === schedule.id || schedule.is_admin_locked}
          >
            {schedule.is_completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-slate-300" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{schedule.title}</span>
                {isDateApproaching(schedule) && !schedule.is_completed && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    まもなく期限
                  </span>
                )}
              </div>
            </div>
            
            {schedule.description && (
              <p className="text-sm text-muted-foreground mt-1">{schedule.description}</p>
            )}
            
            <div className="mt-2">
              {!schedule.is_admin_locked ? (
                // 編集可能なスケジュール
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-md w-full">
                    <div className="flex items-center gap-1 mr-1">
                      <CalendarClock className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex gap-1 items-center">
                        <Input
                          type="number"
                          min={2000}
                          max={2100}
                          value={editValues.year}
                          onChange={handleYearChange}
                          className="w-20 h-7 text-xs border-slate-200"
                        />
                        <span className="text-xs text-slate-600">年</span>
                      </div>
                      
                      <div className="flex gap-1 items-center">
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={editValues.month}
                          onChange={handleMonthChange}
                          className="w-14 h-7 text-xs border-slate-200"
                        />
                        <span className="text-xs text-slate-600">月</span>
                      </div>
                      
                      <div className="flex gap-1 items-center">
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={editValues.day === null ? "" : editValues.day}
                          placeholder="--"
                          onChange={handleDayChange}
                          className="w-14 h-7 text-xs border-slate-200"
                        />
                        <span className="text-xs text-slate-600">日</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 ml-auto"
                        onClick={() => handleUpdateDate(schedule)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          "更新"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // 管理者ロックされたスケジュール（閲覧のみ）
                <div className="text-sm font-medium text-blue-600 flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatScheduleDate(schedule)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // スケジュールグループを取得
  const { currentMonthSchedules, futureSchedules, pastSchedules } = groupSchedules()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarRange className="mr-2 h-5 w-5" />
          予定一覧
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 入学日情報表示 */}
        {intakeDate && (
          <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center mb-2">
              <School className="mr-2 h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{courseInfo.name} 入学予定日</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              {intakeDate.year && intakeDate.month && intakeDate.day ? (
                <p>{intakeDate.year}年{intakeDate.month}月{intakeDate.day}日</p>
              ) : intakeDate.year && intakeDate.month ? (
                <p>{intakeDate.year}年{intakeDate.month}月</p>
              ) : intakeDate.month ? (
                <p>{intakeDate.month}月{intakeDate.day ? `${intakeDate.day}日` : ''} {intakeDate.is_tentative ? '(日程は暫定的です)' : ''}</p>
              ) : intakeDate.start_date ? (
                <p>{format(new Date(intakeDate.start_date), 'yyyy年MM月dd日', { locale: ja })}</p>
              ) : (
                <p>入学予定日情報は準備中です</p>
              )}
              {intakeDate.notes && <p className="mt-1">{intakeDate.notes}</p>}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-4 text-red-500">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <p>{error}</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CalendarClock className="mb-2 h-12 w-12" />
            <p>スケジュールはまだありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentMonthSchedules.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-blue-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  今月のスケジュール
                </h3>
                <div className="space-y-3">
                  {currentMonthSchedules.map(schedule => (
                    <div key={schedule.id}>
                      {renderScheduleItem(schedule)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {futureSchedules.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-indigo-600 flex items-center">
                  <CalendarRange className="h-4 w-4 mr-1" />
                  今後のスケジュール
                </h3>
                <div className="space-y-3">
                  {futureSchedules.map(schedule => (
                    <div key={schedule.id}>
                      {renderScheduleItem(schedule)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pastSchedules.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-gray-500 flex items-center">
                  <CalendarClock className="h-4 w-4 mr-1" />
                  過去のスケジュール
                </h3>
                <div className="space-y-3">
                  {pastSchedules.map(schedule => (
                    <div key={schedule.id}>
                      {renderScheduleItem(schedule)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 