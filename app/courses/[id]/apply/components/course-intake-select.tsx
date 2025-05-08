"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

interface CourseIntakeSelectProps {
  courseId: string
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export function CourseIntakeSelect({ courseId, value, onChange, disabled = false }: CourseIntakeSelectProps) {
  const [intakeDates, setIntakeDates] = useState<IntakeDate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // 入学日の取得
  useEffect(() => {
    const fetchIntakeDates = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from("course_intake_dates")
          .select("*")
          .eq("course_id", courseId)
          .order("month", { ascending: true })
          .order("year", { ascending: true, nullsFirst: true })
          .order("day", { ascending: true, nullsFirst: true })

        if (error) throw error

        setIntakeDates(data || [])
      } catch (error) {
        console.error("Error fetching intake dates:", error)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchIntakeDates()
    }
  }, [courseId, supabase])

  // 表示用の日付フォーマット
  const formatIntakeDate = (intakeDate: IntakeDate) => {
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

  // 選択肢のレンダリング
  const renderSelectItem = (intakeDate: IntakeDate) => {
    return (
      <SelectItem key={intakeDate.id} value={intakeDate.id} className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{formatIntakeDate(intakeDate)}</span>
          {intakeDate.is_tentative && (
            <Badge variant="outline" className="ml-2 text-xs">暫定</Badge>
          )}
        </div>
      </SelectItem>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Label htmlFor="intake-date" className="mr-2">希望入学日</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>希望する入学日を選択してください。<br />「暫定」と表示されている日程は変更の可能性があります。</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Select 
        value={value || ""} 
        onValueChange={onChange}
        disabled={disabled || loading || intakeDates.length === 0}
      >
        <SelectTrigger id="intake-date">
          <SelectValue placeholder="入学日を選択" />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="py-2 text-center text-sm text-muted-foreground">
              読み込み中...
            </div>
          ) : intakeDates.length > 0 ? (
            intakeDates.map(renderSelectItem)
          ) : (
            <div className="py-2 text-center text-sm text-muted-foreground">
              入学日情報がありません
            </div>
          )}
        </SelectContent>
      </Select>
      
      {value && intakeDates.length > 0 && (
        <div className="text-sm text-muted-foreground mt-1">
          {intakeDates.find(date => date.id === value)?.notes}
        </div>
      )}
    </div>
  )
} 