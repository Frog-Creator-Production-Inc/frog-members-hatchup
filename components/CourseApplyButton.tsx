'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { StatusBadge } from '@/components/ui/status-badge'
import { IconBox } from '@/components/ui/icon-box'
import { Loader2, AlertTriangle, Clock, ArrowRight, FileText, Bell, Calendar, Info, Square, CheckSquare2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ApplicationConfirmDialog } from '@/components/ApplicationConfirmDialog'
import { Database } from '@/types/supabase'

interface CourseApplication {
  id: string
  status: string
}

interface IntakeDate {
  id: string
  course_id: string
  
  // 実際のスキーマに合わせてフィールド定義
  month: number
  day?: number | null
  year?: number | null
  is_tentative?: boolean
  notes?: string | null
  
  created_at: string
  updated_at: string
}

interface CourseApplyButtonProps {
  courseId: string
  courseName: string
}

export default function CourseApplyButton({ courseId, courseName }: CourseApplyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isApplicationExists, setIsApplicationExists] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [application, setApplication] = useState<CourseApplication | null>(null)
  const supabase = createClientComponentClient<Database>()
  
  // スタート日選択用の状態
  const [intakeDates, setIntakeDates] = useState<IntakeDate[]>([])
  const [selectedIntakeDateId, setSelectedIntakeDateId] = useState<string>('')
  const [isStartDateDialogOpen, setIsStartDateDialogOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isApplicationConfirmOpen, setIsApplicationConfirmOpen] = useState(false)

  // コンポーネントがマウントされたときに認証状態を確認
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      if (session && session.user.email) {
        setUserEmail(session.user.email)
        setUserId(session.user.id)
        
        // このユーザーがこのコースを既に申請しているか確認
        if (session.user.id) {
          await checkExistingApplication(session.user.id)
        }
      }
    }
    
    checkAuth()
    
    // コースの入学日を取得
    fetchIntakeDates()
  }, [supabase, courseId])
  
  // 入学日情報を取得
  const fetchIntakeDates = async () => {
    try {
      setLoading(true)
      
      if (!courseId) return []

      const { data: intakeDatesData, error } = await supabase
        .from('course_intake_dates')
        .select('*')
        .eq('course_id', courseId)
        .order('year', { ascending: true, nullsFirst: false })
        .order('month', { ascending: true })
        .order('day', { ascending: true, nullsFirst: false })
      
      if (error) {
        console.error("入学日取得エラー:", error)
        return []
      }
      
      // 現在の日付情報を取得
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1 // JavaScriptの月は0から始まるため+1
      const currentDay = now.getDate()
      
      const filteredDates = intakeDatesData.filter(date => {
        // 年が設定されていない場合は自動計算
        let year = date.year
        const month = date.month
        const day = date.day || 1 // 日が設定されていない場合は1日と仮定
        
        // 年が指定されていない場合は、以下のロジックで年を決定
        if (!year) {
          // 現在の月より前の月は来年として扱う
          if (month < currentMonth || (month === currentMonth && day < currentDay)) {
            year = currentYear + 1
          } else {
            year = currentYear
          }
        }
        
        // 過去日チェックのため日付オブジェクトを作成
        const intakeDate = new Date(year, month - 1, day)
        const today = new Date(currentYear, currentMonth - 1, currentDay)
        
        // 今日以降の日付のみを返す
        return intakeDate >= today
      })
      
      if (filteredDates.length > 0) {
        setIntakeDates(filteredDates)
        // デフォルトで最初の入学日を選択
        setSelectedIntakeDateId(filteredDates[0].id)
      } else {
        // データが取得できなかった場合は空の配列を設定
        setIntakeDates([])
      }
    } catch (error) {
      console.error("入学日取得中の例外:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // 既存の申請を確認
  const checkExistingApplication = async (userId: string) => {
    try {
      setLoading(true)
      
      // APIエンドポイントを使用して申請情報を取得
      const response = await fetch(`/api/course-application/status?courseId=${courseId}&userId=${userId}`)
      
      if (!response.ok) {
        // 認証エラーの場合
        if (response.status === 401) {
          return
        }
        
        throw new Error(`API エラー: ${response.status}`)
      }
      
      const result = await response.json()
      
      // 申請が存在する場合
      if (result.data) {
        setIsApplicationExists(true)
        setApplication({
          id: result.data.id,
          status: result.data.status
        })
      }
    } catch (error) {
      // エラー処理
    } finally {
      setLoading(false)
    }
  }

  const handleDialogOpen = () => {
    if (!isAuthenticated) {
      toast.error('申請にはログインが必要です')
      router.push('/login')
      return
    }
    
    // 入学日選択ダイアログを表示（データがあれば）
    if (intakeDates && intakeDates.length > 0) {
      setIsStartDateDialogOpen(true)
    } else {
      // 入学日がない場合は申請できないことを通知
      toast.error('このコースは現在申請できません。スタート日が設定されていません。')
    }
  }
  
  // 入学日選択後、申請ダイアログを表示
  const handleStartDateSelected = () => {
    setIsStartDateDialogOpen(false)
    setIsApplicationConfirmOpen(true)
  }

  const handleApplicationConfirm = () => {
    setIsApplicationConfirmOpen(false)
    setIsDialogOpen(true)
  }

  const handleApply = async () => {
    try {
      setIsSubmitting(true)

      // 1. ユーザー情報を取得
      if (!userEmail) {
        throw new Error('ユーザーメールアドレスが取得できません')
      }

      // 2. Content Snareでクライアント検索
      const searchResponse = await fetch(`/api/content-snare/client-search?email=${encodeURIComponent(userEmail)}`)
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json()
        throw new Error(errorData.error || 'クライアント検索に失敗しました')
      }
      
      const searchData = await searchResponse.json()
      let clientId = ''

      // 3. クライアントが存在する場合はそのIDを使用、なければ新規作成
      if (searchData.clients && searchData.clients.length > 0) {
        clientId = searchData.clients[0].id
      } else {
        // クライアント作成
        const { data: userData } = await supabase.auth.getUser()
        const userName = userData?.user?.user_metadata?.full_name || ''
        const firstName = userName.split(' ')[0] || 'New'
        const lastName = userName.split(' ')[1] || 'User'
        
        const createClientResponse = await fetch('/api/content-snare/create-client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email: userEmail
          })
        })

        if (!createClientResponse.ok) {
          const errorData = await createClientResponse.json()
          throw new Error(errorData.error || 'クライアント作成に失敗しました')
        }

        const createClientData = await createClientResponse.json()
        clientId = createClientData.client_id
      }

      // 4. 申請を作成（選択した入学日IDを含める）
      const createApplicationResponse = await fetch('/api/course-application/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          courseName,
          clientId,
          intake_date_id: selectedIntakeDateId
        })
      })

      if (!createApplicationResponse.ok) {
        const errorData = await createApplicationResponse.json()
        throw new Error(errorData.error || '申請作成に失敗しました')
      }

      // 5. 成功時の処理
      setIsDialogOpen(false)
      toast.success('申請を受け付けました')
      
      // 申請存在フラグを更新
      setIsApplicationExists(true)
      
      // 申請情報を再取得
      if (userId) {
        await checkExistingApplication(userId)
      }
      
    } catch (error: any) {
      toast.error(`エラーが発生しました: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // ステータス表示用の関数
  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'draft': return '下書き'
      case 'submitted': return '提出済み'
      case 'reviewing': return '審査中'
      case 'approved': return '承認済み'
      case 'rejected': return '却下'
      default: return '未着手'
    }
  }
  
  // 入学日のフォーマット
  const formatDate = (date: IntakeDate) => {
    // 現在の日付情報を取得
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()
    
    // 年が設定されていない場合は自動計算
    let year = date.year
    const month = date.month
    const day = date.day
    
    if (!year) {
      // 現在の月より前の月は来年として扱う
      if (month < currentMonth || (month === currentMonth && (day || 1) < currentDay)) {
        year = currentYear + 1
      } else {
        year = currentYear
      }
    }

    let dateString = `${year}年${month}月`
    if (day) {
      dateString += `${day}日`
    }

    // 暫定かどうか
    if (date.is_tentative) {
      dateString += ' (暫定)'
    }

    return dateString
  }

  return (
    <>
      <div className="m-4 border rounded-lg shadow-sm overflow-hidden bg-white">
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">このコースに興味がありますか？申請プロセスを開始できます。</p>
          
          {isApplicationExists ? (
            <div className="mx-2">
              <LoadingButton 
                className="w-full py-3 justify-center items-center text-white bg-green-600 hover:bg-green-700 transition shadow-sm"
                onClick={() => router.push('/course-application')}
              >
                申請管理ページへ移動
              </LoadingButton>
              <div className="mt-2 text-center">
                <span className="text-sm text-gray-600">
                  申請ステータス: <span className="font-medium">{getStatusLabel(application?.status)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div>
              <LoadingButton 
                onClick={handleDialogOpen} 
                className="w-full py-4 justify-between items-center text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
                size="lg"
                disabled={loading || isApplicationExists}
                isLoading={loading}
                loadingText="スタート日情報を確認中..."
              >
                <span className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  <span className="text-base font-medium">申請を開始する</span>
                </span>
                <ArrowRight className="h-5 w-5 opacity-70" />
              </LoadingButton>
              <p className="text-xs text-gray-500 mt-2 text-center">今すぐ申し込みプロセスを開始できます</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 申請プロセス確認ダイアログ */}
      <ApplicationConfirmDialog
        courseName={courseName}
        isOpen={isApplicationConfirmOpen}
        onClose={() => setIsApplicationConfirmOpen(false)}
        onConfirm={handleApplicationConfirm}
      />

      {/* 入学日選択ダイアログ */}
      <Dialog open={isStartDateDialogOpen} onOpenChange={setIsStartDateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>入学日を選択</DialogTitle>
            <DialogDescription>
              申請する{courseName}のスタート日を選択してください。この日程を基準に、ビザ申請などの渡航スケジュールが設定されます。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="intake-date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                スタート日
              </label>
              <Select
                value={selectedIntakeDateId}
                onValueChange={(value) => setSelectedIntakeDateId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="スタート日を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {intakeDates.map((date) => (
                    <SelectItem key={date.id} value={date.id}>
                      {formatDate(date)}
                      {date.notes && (
                        <span className="text-xs text-gray-500 ml-2">
                          （備考: {date.notes}）
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                このスタート日を基準にスケジュールが設定されます
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStartDateDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleStartDateSelected}
              disabled={!selectedIntakeDateId}
            >
              選択して次へ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>コース申請の確認</DialogTitle>
            <DialogDescription>
              {courseName}の申請を行います。申請後、必要書類の提出や追加情報の入力が必要になります。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-3 rounded-md">
              <h3 className="text-sm font-medium mb-2">申請内容</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">コース名:</span>
                  <span className="text-sm font-medium">{courseName}</span>
                </div>
                
                {selectedIntakeDateId && intakeDates.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">スタート日:</span>
                    <span className="text-sm font-medium">
                      {formatDate(intakeDates.find(d => d.id === selectedIntakeDateId) as IntakeDate)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">申請者:</span>
                  <span className="text-sm font-medium">{userEmail}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                申請を開始すると、入力フォームが作成されます。必要な情報を入力してください。
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md">
              <div className="bg-blue-50 p-3 border-b text-blue-800">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  コース申請に関する重要事項
                </h3>
              </div>
              <div className="p-3 space-y-2 text-sm">
                <p>コース申請後、以下の手続きが必要になります：</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>身分証明書のアップロード</li>
                  <li>パスポート情報の入力</li> 
                  <li>申込金の支払い（申請確定後）</li>
                  <li>ビザ申請に必要な書類の準備</li>
                </ul>
                <p className="text-gray-700 mt-2">申請後のキャンセルには手数料がかかる場合があります。詳細は利用規約をご確認ください。</p>
              </div>
              <div className="p-3 bg-gray-50 flex items-center text-xs text-gray-500">
                <div className="mr-2 cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
                  {termsAccepted ? 
                    <CheckSquare2 className="h-4 w-4 text-blue-600" /> : 
                    <Square className="h-4 w-4" />
                  }
                </div>
                <label htmlFor="terms" className="cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
                  上記の注意事項を確認し、同意します。
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleApply}
              disabled={isSubmitting || !termsAccepted}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              申請を確定する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 