"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Trash2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"

interface Section {
  id: string
  title: string
  description: string | null
  order_index: number
}

interface SectionEditorProps {
  section: Section
  onBack: () => void
  onUpdate: (section: Section) => void
}

export function SectionEditor({ section, onBack, onUpdate }: SectionEditorProps) {
  const [title, setTitle] = useState(section.title)
  const [description, setDescription] = useState(section.description || "")
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("video_sections")
        .update({
          title,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id)

      if (error) throw error

      onUpdate({
        ...section,
        title,
        description,
      })
      
      toast.success("セクションを更新しました")
    } catch (error) {
      console.error("Error updating section:", error)
      toast.error("セクションの更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("このセクションを削除してもよろしいですか？")) {
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from("video_sections")
        .delete()
        .eq("id", section.id)

      if (error) throw error

      toast.success("セクションを削除しました")
      onBack()
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("セクションの削除に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>セクションの編集</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "更新中..." : "更新"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}