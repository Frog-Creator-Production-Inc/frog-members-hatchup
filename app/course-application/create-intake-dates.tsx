'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Calendar, Database, CheckCircle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CreateIntakeDates() {
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [isAddingData, setIsAddingData] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [intakeDates, setIntakeDates] = useState<any[]>([])
  const [isLoadingIntakeDates, setIsLoadingIntakeDates] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // コンポーネントがマウントされたときにコース一覧を取得
  useEffect(() => {
    fetchCourses()
  }, [])
  
  // コースを変更したときに入学日一覧を更新
  useEffect(() => {
    if (courseId) {
      fetchIntakeDates(courseId)
    } else {
      setIntakeDates([])
    }
  }, [courseId])

  // コース一覧を取得
  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true)
      
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .order('name')
      
      if (error) {
        console.error('コース取得エラー:', error)
        toast({
          title: 'エラー',
          description: 'コース一覧の取得に失敗しました',
          variant: 'destructive'
        })
        return
      }
      
      if (data) {
        setCourses(data)
      }
    } catch (error) {
      console.error('コース取得プロセスエラー:', error)
    } finally {
      setIsLoadingCourses(false)
    }
  }
  
  // 入学日一覧を取得
  const fetchIntakeDates = async (courseId: string) => {
    try {
      setIsLoadingIntakeDates(true)
      
      const { data, error } = await supabase
        .from('course_intake_dates')
        .select('*')
        .eq('course_id', courseId)
        .order('start_date', { ascending: true })
      
      if (error) {
        console.error('入学日取得エラー:', error)
        toast({
          title: 'エラー',
          description: '入学日一覧の取得に失敗しました',
          variant: 'destructive'
        })
        return
      }
      
      if (data) {
        setIntakeDates(data)
      }
    } catch (error) {
      console.error('入学日取得プロセスエラー:', error)
    } finally {
      setIsLoadingIntakeDates(false)
    }
  }

  // テーブル作成処理
  const createTable = async () => {
    if (isCreatingTable) return
    
    try {
      setIsCreatingTable(true)
      setResult(null)
      
      // RLSポリシーでテーブル作成はできないため、管理者用APIを作成する必要があります
      // ここではフロントエンドから直接テストデータを追加します
      
      // テスト用にテーブルの存在を確認
      const { data, error } = await supabase
        .from('course_intake_dates')
        .select('count')
        .limit(1)
      
      if (error && error.code === '42P01') {
        setResult('テーブルが存在しません。管理者に連絡してテーブルを作成してください。\n\n必要なテーブル構造:\ncourse_intake_dates (\n  id uuid PRIMARY KEY,\n  course_id uuid REFERENCES courses(id),\n  start_date date NOT NULL,\n  application_deadline date,\n  created_at timestamp with time zone DEFAULT now(),\n  updated_at timestamp with time zone DEFAULT now()\n)')
      } else if (error) {
        setResult(`エラー: ${error.message}`)
      } else {
        setResult(`テーブルは既に存在します。レコード数: ${data.length}`)
      }
    } catch (error) {
      console.error('テーブル確認エラー:', error)
      toast({
        title: 'エラー',
        description: 'テーブル確認中にエラーが発生しました',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingTable(false)
    }
  }

  // テストデータ追加処理
  const addTestData = async () => {
    if (isAddingData || !courseId || !startDate) return
    
    try {
      setIsAddingData(true)
      setResult(null)
      
      const { data, error } = await supabase
        .from('course_intake_dates')
        .insert([
          {
            course_id: courseId,
            start_date: startDate,
            application_deadline: deadline || null
          }
        ])
        .select()
      
      if (error) {
        setResult(`エラー: ${error.message}`)
      } else {
        setResult(`データが正常に追加されました: ${JSON.stringify(data, null, 2)}`)
        setCourseId('')
        setStartDate('')
        setDeadline('')
        
        toast({
          title: '成功',
          description: '入学日データが追加されました',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('データ追加エラー:', error)
      toast({
        title: 'エラー',
        description: 'データ追加中にエラーが発生しました',
        variant: 'destructive'
      })
    } finally {
      setIsAddingData(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">入学日データ管理（開発用）</h1>
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              テーブル確認
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createTable} 
              disabled={isCreatingTable}
              className="mb-4"
            >
              {isCreatingTable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              テーブルを確認
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              入学日データ追加
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="course-id">コース</Label>
                <Select
                  value={courseId}
                  onValueChange={(value) => setCourseId(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="コースを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCourses ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        読み込み中...
                      </SelectItem>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="start-date">入学日</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="deadline">申込締切日（任意）</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={addTestData} 
                disabled={isAddingData || !courseId || !startDate}
                className="w-full"
              >
                {isAddingData && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                データを追加
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {courseId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                現在の入学日一覧
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingIntakeDates ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>読み込み中...</span>
                </div>
              ) : intakeDates.length > 0 ? (
                <div className="space-y-2">
                  {intakeDates.map((date) => (
                    <div key={date.id} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {new Date(date.start_date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {date.application_deadline && (
                            <div className="text-sm text-gray-500">
                              締切: {new Date(date.application_deadline).toLocaleDateString('ja-JP')}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {date.id.substr(0, 8)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  このコースの入学日はまだ登録されていません
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 p-4 rounded-md overflow-auto whitespace-pre-wrap">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 