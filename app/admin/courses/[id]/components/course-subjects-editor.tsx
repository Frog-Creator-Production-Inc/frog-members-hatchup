"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"

interface CourseSubject {
  id: string
  title: string
  description: string | null
}

interface CourseSubjectsEditorProps {
  courseId: string
}

export function CourseSubjectsEditor({ courseId }: CourseSubjectsEditorProps) {
  const [subjects, setSubjects] = useState<CourseSubject[]>([])
  const [editedSubjects, setEditedSubjects] = useState<CourseSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from("course_subjects")
          .select("*")
          .eq("course_id", courseId)
          .order("created_at", { ascending: true })

        if (error) throw error
        setSubjects(data || [])
        setEditedSubjects(data || [])
      } catch (error) {
        console.error("Error loading subjects:", error)
        toast.error("科目の読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadSubjects()
  }, [courseId, supabase])

  const addSubject = async () => {
    try {
      const { data, error } = await supabase
        .from("course_subjects")
        .insert({
          course_id: courseId,
          title: "新しい科目",
          description: "",
        })
        .select()
        .single()

      if (error) throw error

      setSubjects([...subjects, data])
      setEditedSubjects([...editedSubjects, data])
      toast.success("科目を追加しました")
    } catch (error) {
      console.error("Error adding subject:", error)
      toast.error("科目の追加に失敗しました")
    }
  }

  const handleInputChange = (id: string, field: keyof CourseSubject, value: string) => {
    setEditedSubjects(prevSubjects =>
      prevSubjects.map(subject =>
        subject.id === id ? { ...subject, [field]: value } : subject
      )
    )
  }

  const updateSubjects = async () => {
    try {
      setUpdating(true)
      
      // Find subjects that have been modified
      const modifiedSubjects = editedSubjects.filter(editedSubject => {
        const originalSubject = subjects.find(s => s.id === editedSubject.id)
        return originalSubject && (
          originalSubject.title !== editedSubject.title ||
          originalSubject.description !== editedSubject.description
        )
      })

      if (modifiedSubjects.length === 0) {
        toast.success("変更はありません")
        return
      }

      // Update all modified subjects
      const { error } = await supabase
        .from("course_subjects")
        .upsert(modifiedSubjects.map(subject => ({
          id: subject.id,
          course_id: courseId,
          title: subject.title,
          description: subject.description,
        })))

      if (error) throw error

      setSubjects(editedSubjects)
      toast.success("科目を更新しました")
    } catch (error) {
      console.error("Error updating subjects:", error)
      toast.error("科目の更新に失敗しました")
      // Revert changes on error
      setEditedSubjects(subjects)
    } finally {
      setUpdating(false)
    }
  }

  const deleteSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("course_subjects")
        .delete()
        .eq("id", id)

      if (error) throw error

      setSubjects(subjects.filter(subject => subject.id !== id))
      setEditedSubjects(editedSubjects.filter(subject => subject.id !== id))
      toast.success("科目を削除しました")
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast.error("科目の削除に失敗しました")
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  const hasChanges = JSON.stringify(subjects) !== JSON.stringify(editedSubjects)

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">カリキュラム</CardTitle>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={updateSubjects} size="sm" disabled={updating}>
              <Save className="h-4 w-4 mr-2" />
              {updating ? "更新中..." : "更新"}
            </Button>
          )}
          <Button onClick={addSubject} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            科目を追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {editedSubjects.map((subject) => (
            <div key={subject.id} className="space-y-2 p-4 border rounded-lg relative group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteSubject(subject.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <div>
                <label className="text-sm font-medium">科目名</label>
                <Input
                  value={subject.title}
                  onChange={(e) => handleInputChange(subject.id, "title", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">説明</label>
                <Textarea
                  value={subject.description || ""}
                  onChange={(e) => handleInputChange(subject.id, "description", e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          ))}
          {editedSubjects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              科目が登録されていません
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}