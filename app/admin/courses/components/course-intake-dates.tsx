"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Trash2, Calendar, Plus, Save, X, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface IntakeDate {
  id: string
  course_id: string
  month: number
  day?: number | null
  year?: number | null
  is_tentative: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

interface CourseIntakeDatesProps {
  courseId: string
  intakeDates?: IntakeDate[]
}

export function CourseIntakeDates({ courseId, intakeDates: initialIntakeDates }: CourseIntakeDatesProps) {
  const [intakeDates, setIntakeDates] = useState<IntakeDate[]>(initialIntakeDates || [])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingIntakeId, setEditingIntakeId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<IntakeDate>>({
    month: 1,
    day: null,
    year: null,
    is_tentative: true,
    notes: ""
  })
  const supabase = createClientComponentClient()
  
  // 月の選択肢
  const monthOptions = [
    { value: 1, label: "1月" },
    { value: 2, label: "2月" },
    { value: 3, label: "3月" },
    { value: 4, label: "4月" },
    { value: 5, label: "5月" },
    { value: 6, label: "6月" },
    { value: 7, label: "7月" },
    { value: 8, label: "8月" },
    { value: 9, label: "9月" },
    { value: 10, label: "10月" },
    { value: 11, label: "11月" },
    { value: 12, label: "12月" }
  ]

  // コースの入学日を取得
  useEffect(() => {
    const fetchIntakeDates = async () => {
      if (initialIntakeDates) {
        setIntakeDates(initialIntakeDates)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("course_intake_dates")
          .select("*")
          .eq("course_id", courseId)
          .order("year", { ascending: true, nullsFirst: true })
          .order("month", { ascending: true })
          .order("day", { ascending: true, nullsFirst: true })

        if (error) throw error

        setIntakeDates(data || [])
      } catch (error: any) {
        console.error("Error fetching intake dates:", error)
        toast.error(`入学日の取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchIntakeDates()
  }, [courseId, initialIntakeDates, supabase])

  // 入学日を追加
  const handleAddIntakeDate = async () => {
    try {
      setLoading(true)
      
      // 新しい入学日データを準備し、undefined値を適切に処理
      const newIntakeDate = {
        course_id: courseId,
        month: formData.month !== undefined ? formData.month : 1,
        day: formData.day !== undefined ? formData.day : null,
        year: formData.year !== undefined ? formData.year : null,
        is_tentative: formData.is_tentative !== undefined ? formData.is_tentative : true,
        notes: formData.notes !== undefined ? formData.notes : null
      }

      console.log("新規追加データ:", newIntakeDate);

      // 挿入処理の実行
      const { data: insertResult, error: insertError } = await supabase
        .from("course_intake_dates")
        .insert([newIntakeDate])
        .select("id");

      if (insertError) throw insertError;
      
      if (!insertResult || insertResult.length === 0) {
        throw new Error("入学日の追加に失敗しました");
      }
      
      // 挿入されたデータを再取得
      const newId = insertResult[0].id;
      const { data: newData, error: fetchError } = await supabase
        .from("course_intake_dates")
        .select("*")
        .eq("id", newId)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (newData) {
        setIntakeDates(prev => [...prev, newData])
        toast.success("入学日を追加しました")
      } else {
        toast.error("入学日の追加に失敗しました")
      }
      
      resetForm()
      setShowAddDialog(false)
    } catch (error: any) {
      console.error("Error adding intake date:", error)
      toast.error(`入学日の追加に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 入学日を更新
  const handleUpdateIntakeDate = async () => {
    if (!editingIntakeId) return

    try {
      setLoading(true)
      
      // 更新データを準備し、undefined値を適切に処理
      const updateData = {
        month: formData.month !== undefined ? formData.month : 1,
        day: formData.day !== undefined ? formData.day : null,
        year: formData.year !== undefined ? formData.year : null,
        is_tentative: formData.is_tentative !== undefined ? formData.is_tentative : true,
        notes: formData.notes !== undefined ? formData.notes : null
      }

      console.log("更新データ:", updateData, "ID:", editingIntakeId);

      // 更新処理の実行
      const { error: updateError } = await supabase
        .from("course_intake_dates")
        .update(updateData)
        .eq("id", editingIntakeId);

      if (updateError) throw updateError;
      
      // 更新後のデータを再取得
      const { data: updatedData, error: fetchError } = await supabase
        .from("course_intake_dates")
        .select("*")
        .eq("id", editingIntakeId)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (updatedData) {
        setIntakeDates(prev => 
          prev.map(intake => intake.id === editingIntakeId ? updatedData : intake)
        )
        
        toast.success("入学日を更新しました")
      } else {
        toast.error("更新データの取得に失敗しました")
      }
      
      resetForm()
      setEditingIntakeId(null)
      setShowAddDialog(false)
    } catch (error: any) {
      console.error("Error updating intake date:", error)
      toast.error(`入学日の更新に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 入学日を削除
  const handleDeleteIntakeDate = async (id: string) => {
    if (!confirm("この入学日を削除してもよろしいですか？")) return

    try {
      setIsDeleting(id)
      
      const { error } = await supabase
        .from("course_intake_dates")
        .delete()
        .eq("id", id)

      if (error) throw error

      setIntakeDates(prev => prev.filter(intake => intake.id !== id))
      toast.success("入学日を削除しました")
    } catch (error: any) {
      console.error("Error deleting intake date:", error)
      toast.error(`入学日の削除に失敗しました: ${error.message}`)
    } finally {
      setIsDeleting(null)
    }
  }

  // 編集モードを開始
  const startEditing = (intakeDate: IntakeDate) => {
    if (!intakeDate) {
      console.warn('startEditing was called with undefined/null intakeDate');
      return;
    }
    
    // 値が確実に存在するようにフォームデータを設定
    setFormData({
      month: intakeDate.month || 1,
      day: intakeDate.day !== undefined ? intakeDate.day : null,
      year: intakeDate.year !== undefined ? intakeDate.year : null,
      is_tentative: intakeDate.is_tentative !== undefined ? intakeDate.is_tentative : true,
      notes: intakeDate.notes !== undefined ? intakeDate.notes : ''
    })
    setEditingIntakeId(intakeDate.id)
    setShowAddDialog(true)
  }

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      month: 1,
      day: null,
      year: null,
      is_tentative: true,
      notes: ""
    })
    setEditingIntakeId(null)
  }

  // 表示用の日付フォーマット
  const formatIntakeDate = (intakeDate: IntakeDate) => {
    if (!intakeDate) {
      console.warn('formatIntakeDate was called with undefined/null intakeDate');
      return '日付情報なし';
    }
    
    const monthStr = monthOptions.find(m => m.value === intakeDate.month)?.label || `${intakeDate.month}月`
    
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

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>入学日</CardTitle>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingIntakeId(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              入学日を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingIntakeId ? "入学日を編集" : "入学日を追加"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">月 <span className="text-red-500">*</span></Label>
                  <Select
                    value={String(formData.month)}
                    onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="月を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={String(month.value)}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="day">日（任意）</Label>
                  <Input
                    id="day"
                    type="number"
                    min={1}
                    max={31}
                    value={formData.day || ""}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="未定"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">年（任意）</Label>
                  <Input
                    id="year"
                    type="number"
                    min={2000}
                    max={2100}
                    value={formData.year || ""}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="未定"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_tentative"
                  checked={formData.is_tentative}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_tentative: checked })}
                />
                <Label htmlFor="is_tentative">
                  暫定的な日程
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 inline text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        確定していない入学日の場合はオンにしてください
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">備考（任意）</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="例: 申込締切は2ヶ月前"
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                キャンセル
              </Button>
              <Button 
                onClick={editingIntakeId ? handleUpdateIntakeDate : handleAddIntakeDate}
                disabled={loading}
              >
                {loading ? "保存中..." : (editingIntakeId ? "更新" : "追加")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {loading && !initialIntakeDates ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : intakeDates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>入学日</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>備考</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intakeDates.map((intakeDate) => (
                <TableRow key={intakeDate.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatIntakeDate(intakeDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={intakeDate.is_tentative ? "outline" : "default"}>
                      {intakeDate.is_tentative ? "暫定" : "確定"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {intakeDate.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => startEditing(intakeDate)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteIntakeDate(intakeDate.id)}
                        disabled={!!isDeleting}
                      >
                        {isDeleting === intakeDate.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">入学日がまだ登録されていません</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => { resetForm(); setShowAddDialog(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              入学日を追加
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 