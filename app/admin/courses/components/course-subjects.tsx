"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { Plus, Trash2 } from "lucide-react"

interface Subject {
  id: string
  title: string
  description: string | null
}

interface CourseSubjectsProps {
  courseId: string
  subjects?: Subject[]
  readOnly?: boolean
}

export function CourseSubjects({ courseId, subjects: initialSubjects = [], readOnly = false }: CourseSubjectsProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [loading, setLoading] = useState(false)
  const [editingSubjects, setEditingSubjects] = useState<{ [id: string]: { title: string; description: string } }>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    const initialEditing = {} as { [id: string]: { title: string; description: string } }
    subjects.forEach(subject => {
      initialEditing[subject.id] = {
        title: subject.title,
        description: subject.description || ""
      }
    })
    setEditingSubjects(initialEditing)
  }, [subjects])

  const handleAddSubject = async () => {
    try {
      setLoading(true)
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
      setEditingSubjects(prev => ({
        ...prev,
        [data.id]: {
          title: data.title,
          description: data.description || ""
        }
      }))
      toast.success("科目を追加しました")
    } catch (error) {
      console.error("Error adding subject:", error)
      toast.error("科目の追加に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from("course_subjects")
        .update(updates)
        .eq("id", id)

      if (error) throw error

      setSubjects(subjects.map(subject => 
        subject.id === id ? { ...subject, ...updates } : subject
      ))
      toast.success("科目を更新しました")
    } catch (error) {
      console.error("Error updating subject:", error)
      toast.error("科目の更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("この科目を削除してもよろしいですか？")) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from("course_subjects")
        .delete()
        .eq("id", id)

      if (error) throw error

      setSubjects(subjects.filter(subject => subject.id !== id))
      setEditingSubjects(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      toast.success("科目を削除しました")
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast.error("科目の削除に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-white">
        <CardTitle>カリキュラム</CardTitle>
        {!readOnly && (
          <Button onClick={handleAddSubject} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            科目を追加
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              科目が登録されていません
            </p>
          ) : (
            subjects.map(subject => (
              <div
                key={subject.id}
                className="space-y-4 p-4 rounded-lg border"
              >
                {!readOnly && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    value={editingSubjects[subject.id]?.title || ""}
                    onChange={(e) =>
                      setEditingSubjects(prev => ({
                        ...prev,
                        [subject.id]: {
                          ...(prev[subject.id] || {
                            title: subject.title,
                            description: subject.description || ""
                          }),
                          title: e.target.value
                        }
                      }))
                    }
                    placeholder="科目名"
                    className="font-medium"
                    readOnly={readOnly}
                  />
                </div>
                <div>
                  <Textarea
                    value={editingSubjects[subject.id]?.description || ""}
                    onChange={(e) =>
                      setEditingSubjects(prev => ({
                        ...prev,
                        [subject.id]: {
                          ...(prev[subject.id] || {
                            title: subject.title,
                            description: subject.description || ""
                          }),
                          description: e.target.value
                        }
                      }))
                    }
                    placeholder="科目の説明"
                    rows={3}
                    readOnly={readOnly}
                  />
                </div>
                {!readOnly && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() =>
                        handleUpdateSubject(subject.id, {
                          title: editingSubjects[subject.id]?.title,
                          description: editingSubjects[subject.id]?.description
                        })
                      }
                      disabled={loading}
                      size="sm"
                    >
                      更新
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}