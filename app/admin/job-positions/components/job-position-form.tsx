"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { JobPosition } from "@/types/supabase"

interface JobPositionFormProps {
  initialData?: JobPosition
  onSubmit: (data: Partial<JobPosition>) => void
  onCancel: () => void
}

export function JobPositionForm({ initialData, onSubmit, onCancel }: JobPositionFormProps) {
  const [formData, setFormData] = useState<Partial<JobPosition>>({
    title: "",
    description: "",
    industry: "",
    ...initialData
  })
  
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        industry: initialData.industry || "",
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("送信エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">職種名 <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          name="title"
          placeholder="例: ウェブデベロッパー"
          value={formData.title || ""}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="industry">業界</Label>
        <Input
          id="industry"
          name="industry"
          placeholder="例: IT・テクノロジー"
          value={formData.industry || ""}
          onChange={handleChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="この職種の説明を入力してください"
          value={formData.description || ""}
          onChange={handleChange}
          rows={4}
        />
      </div>
      
      <div className="flex items-center justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isLoading}>
          {initialData ? "更新" : "追加"}
        </Button>
      </div>
    </form>
  )
} 