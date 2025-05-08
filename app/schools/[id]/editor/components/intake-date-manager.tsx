"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"
import { Calendar, Plus, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface IntakeDateManagerProps {
  schoolId: string
  courseId: string
  token: string
  email: string
}

interface IntakeDate {
  id: string
  course_id: string
  month: number
  day: number | null
  year: number | null
  is_tentative: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

// 月のリストを英語に変更
const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

export function IntakeDateManager({ schoolId, courseId, token, email }: IntakeDateManagerProps) {
  const [intakeDates, setIntakeDates] = useState<IntakeDate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newIntake, setNewIntake] = useState({
    month: "",
    day: "",
    year: "",
    is_tentative: true,
    notes: ""
  })

  // 初回レンダリング時と依存配列の値が変わったときに開始日を取得
  useEffect(() => {
    fetchIntakeDates()
  }, [courseId])

  // 開始日データを取得
  const fetchIntakeDates = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        token,
        email
      })
      
      const response = await fetch(`/api/schools/${schoolId}/courses/${courseId}/intake-dates?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch start dates")
      }
      
      const data = await response.json()
      setIntakeDates(data.intakeDates || [])
    } catch (error) {
      console.error("Error fetching intake dates:", error)
      toast.error("An error occurred while fetching start dates")
    } finally {
      setIsLoading(false)
    }
  }

  // 新規開始日追加
  const handleAddIntakeDate = async () => {
    if (!newIntake.month) {
      toast.error("Month is required")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/schools/${schoolId}/courses/${courseId}/intake-dates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: parseInt(newIntake.month),
          day: newIntake.day ? parseInt(newIntake.day) : null,
          year: newIntake.year ? parseInt(newIntake.year) : null,
          is_tentative: newIntake.is_tentative,
          notes: newIntake.notes || null,
          token,
          email
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add start date")
      }
      
      toast.success("Start date added successfully")
      setIsDialogOpen(false)
      
      // フォームをリセット
      setNewIntake({
        month: "",
        day: "",
        year: "",
        is_tentative: true,
        notes: ""
      })
      
      // リストを更新
      fetchIntakeDates()
    } catch (error) {
      console.error("Error adding intake date:", error)
      toast.error("An error occurred while adding start date")
    } finally {
      setIsLoading(false)
    }
  }

  // 開始日削除
  const handleDeleteIntakeDate = async (intakeDateId: string) => {
    if (!confirm("Are you sure you want to delete this start date?")) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const queryParams = new URLSearchParams({
        intakeDateId,
        token,
        email
      })
      
      const response = await fetch(`/api/schools/${schoolId}/courses/${courseId}/intake-dates?${queryParams.toString()}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete start date")
      }
      
      toast.success("Start date deleted successfully")
      fetchIntakeDates()
    } catch (error) {
      console.error("Error deleting intake date:", error)
      toast.error("An error occurred while deleting start date")
    } finally {
      setIsLoading(false)
    }
  }

  // 月を日本語表示
  const formatMonth = (month: number) => {
    return months.find(m => m.value === month)?.label || `Month ${month}`
  }

  // 開始日のフォーマット
  const formatIntakeDate = (date: IntakeDate) => {
    let result = formatMonth(date.month)
    
    if (date.day) {
      result += ` ${date.day}`
    }
    
    if (date.year) {
      result = `${result} ${date.year}`
    }
    
    if (date.is_tentative) {
      result += " (Tentative)"
    }
    
    return result
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Course Start Dates</h3>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Start Date
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add New Start Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month *</Label>
                  <Select 
                    value={newIntake.month} 
                    onValueChange={(value) => setNewIntake({...newIntake, month: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={String(month.value)}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="day">Day (optional)</Label>
                  <Input
                    id="day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1-31"
                    value={newIntake.day}
                    onChange={(e) => setNewIntake({...newIntake, day: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">Year (optional)</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g. 2024"
                    value={newIntake.year}
                    onChange={(e) => setNewIntake({...newIntake, year: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_tentative"
                  checked={newIntake.is_tentative}
                  onCheckedChange={(checked) => 
                    setNewIntake({...newIntake, is_tentative: checked === true})
                  }
                />
                <Label htmlFor="is_tentative" className="text-sm font-normal">
                  Tentative date (not confirmed)
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional information about this start date"
                  value={newIntake.notes}
                  onChange={(e) => setNewIntake({...newIntake, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddIntakeDate}
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Start Date"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="py-4 text-center text-gray-500">Loading...</div>
      ) : intakeDates.length > 0 ? (
        <div className="space-y-2">
          {intakeDates.map((intakeDate) => (
            <div 
              key={intakeDate.id} 
              className="flex justify-between items-center p-3 border rounded-md bg-white"
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span>{formatIntakeDate(intakeDate)}</span>
                {intakeDate.notes && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {intakeDate.notes}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteIntakeDate(intakeDate.id)}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500 border rounded-md bg-gray-50">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No start dates registered yet</p>
          <p className="text-sm">Click the "Add Start Date" button to register new dates</p>
        </div>
      )}
    </div>
  )
} 