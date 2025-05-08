"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from "next/dynamic"

// リッチテキストエディタを動的にインポート（SSRを避けるため）
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"

interface VisaRequirementFormProps {
  initialData?: any
  visaTypes: any[]
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function VisaRequirementForm({ 
  initialData, 
  visaTypes,
  onSubmit, 
  onCancel 
}: VisaRequirementFormProps) {
  const [formData, setFormData] = useState({
    visa_type_id: initialData?.visa_type_id || "",
    description: initialData?.description || "",
    additional_info: initialData?.additional_info || "",
    order_index: initialData?.order_index || 0,
  })
  
  const [mounted, setMounted] = useState(false)
  
  // クライアントサイドでのみレンダリングするために使用
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTextChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = value === "" ? 0 : parseInt(value, 10)
    setFormData(prev => ({ ...prev, [name]: numValue }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // リッチテキストエディタのモジュール設定
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="visa_type_id">ビザタイプ *</Label>
        <Select 
          value={formData.visa_type_id} 
          onValueChange={(value) => handleSelectChange("visa_type_id", value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="ビザタイプを選択" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {visaTypes.map(visaType => (
              <SelectItem key={visaType.id} value={visaType.id}>
                {visaType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">説明 *</Label>
        {mounted && (
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(content) => handleTextChange("description", content)}
            modules={modules}
            className="bg-white min-h-[200px] mb-12"
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="additional_info">追加情報</Label>
        <Textarea
          id="additional_info"
          name="additional_info"
          value={formData.additional_info}
          onChange={(e) => handleTextChange("additional_info", e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="order_index">表示順序</Label>
        <input
          id="order_index"
          name="order_index"
          type="number"
          value={formData.order_index}
          onChange={handleNumberChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="例: 1"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">
          {initialData ? "更新" : "追加"}
        </Button>
      </div>
    </form>
  )
} 