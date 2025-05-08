"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, Edit, X, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Subject {
  id: string
  title: string
  description: string | null
  course_id: string
}

interface SubjectManagerProps {
  schoolId: string
  courseId: string
  token: string
  email: string
}

export function SubjectManager({ schoolId, courseId, token, email }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  
  // カリキュラム一覧の取得
  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/schools/${schoolId}/courses/${courseId}/subjects?token=${token}&email=${encodeURIComponent(email)}`
      )
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch curriculum subjects")
      }
      
      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast.error("An error occurred while fetching curriculum subjects")
    } finally {
      setLoading(false)
    }
  }
  
  // 初回読み込み
  useEffect(() => {
    fetchSubjects()
  }, [schoolId, courseId, token, email])
  
  // 新規カリキュラムの追加
  const handleAddSubject = async () => {
    if (!newTitle.trim()) {
      toast.error("Title is required")
      return
    }
    
    try {
      setSaving(true)
      const response = await fetch(
        `/api/schools/${schoolId}/courses/${courseId}/subjects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: {
              title: newTitle.trim(),
              description: newDescription.trim() || null,
            },
            token,
            email,
          }),
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add curriculum subject")
      }
      
      const result = await response.json()
      setSubjects([...subjects, result.data])
      setNewTitle("")
      setNewDescription("")
      setAdding(false)
      toast.success("Curriculum subject added successfully")
    } catch (error) {
      console.error("Error adding subject:", error)
      toast.error("An error occurred while adding curriculum subject")
    } finally {
      setSaving(false)
    }
  }
  
  // カリキュラムの削除
  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this curriculum subject?")) {
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(
        `/api/schools/${schoolId}/courses/${courseId}/subjects?subjectId=${id}&token=${token}&email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete curriculum subject")
      }
      
      setSubjects(subjects.filter(subject => subject.id !== id))
      toast.success("Curriculum subject deleted successfully")
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast.error("An error occurred while deleting curriculum subject")
    } finally {
      setLoading(false)
    }
  }
  
  // 編集モードの開始
  const handleEditStart = (subject: Subject) => {
    setEditing(subject.id)
    setEditTitle(subject.title)
    setEditDescription(subject.description || "")
  }
  
  // 編集のキャンセル
  const handleEditCancel = () => {
    setEditing(null)
    setEditTitle("")
    setEditDescription("")
  }
  
  // カリキュラムの更新
  const handleUpdateSubject = async (id: string) => {
    if (!editTitle.trim()) {
      toast.error("Title is required")
      return
    }
    
    try {
      setSaving(true)
      const response = await fetch(
        `/api/schools/${schoolId}/courses/${courseId}/subjects`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: {
              id,
              title: editTitle.trim(),
              description: editDescription.trim() || null,
            },
            token,
            email,
          }),
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update curriculum subject")
      }
      
      const result = await response.json()
      setSubjects(
        subjects.map(subject => 
          subject.id === id ? result.data : subject
        )
      )
      setEditing(null)
      toast.success("Curriculum subject updated successfully")
    } catch (error) {
      console.error("Error updating subject:", error)
      toast.error("An error occurred while updating curriculum subject")
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Curriculum Management</h3>
        <Button 
          onClick={() => setAdding(true)} 
          disabled={adding || loading}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      
      {/* 新規追加フォーム */}
      {adding && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-medium">New Subject</h4>
              <Button 
                onClick={() => setAdding(false)} 
                variant="ghost" 
                size="sm"
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Title<span className="text-red-500">*</span></Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Programming Basics"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter subject description"
                  rows={3}
                  disabled={saving}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdding(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddSubject}
                  disabled={saving || !newTitle.trim()}
                >
                  {saving ? "Adding..." : "Add Subject"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* カリキュラム一覧 */}
      {loading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading curriculum subjects...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-8 text-center border rounded-md bg-gray-50">
          <p className="text-gray-500">No curriculum subjects registered yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="border">
              {editing === subject.id ? (
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Title<span className="text-red-500">*</span></Label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        disabled={saving}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        onClick={handleEditCancel} 
                        variant="outline" 
                        size="sm"
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleUpdateSubject(subject.id)} 
                        disabled={saving || !editTitle.trim()}
                        size="sm"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Update
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="pt-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium">{subject.title}</h4>
                      {subject.description && (
                        <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        onClick={() => handleEditStart(subject)} 
                        variant="ghost" 
                        size="sm"
                        disabled={loading || !!editing}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteSubject(subject.id)} 
                        variant="ghost" 
                        size="sm"
                        disabled={loading || !!editing}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 