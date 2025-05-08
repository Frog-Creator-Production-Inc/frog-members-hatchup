"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface VisaTypeFormProps {
  initialData?: any
  requirements?: any[]
  onSubmit: (data: any, requirements: any[]) => void
  onCancel: () => void
}

export function VisaTypeForm({ 
  initialData, 
  requirements = [],
  onSubmit, 
  onCancel 
}: VisaTypeFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    description: initialData?.description || "",
    average_processing_time: initialData?.average_processing_time || "",
    link: initialData?.link || "",
    order_index: initialData?.order_index || 0,
  })

  const [visaRequirements, setVisaRequirements] = useState<any[]>(requirements)
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null)
  const [editingRequirementData, setEditingRequirementData] = useState<any>(null)
  const [newRequirement, setNewRequirement] = useState({
    description: "",
    additional_info: "",
    order_index: 0
  })
  const [mounted, setMounted] = useState(false)
  const [deletingRequirementId, setDeletingRequirementId] = useState<string | null>(null)
  
  // クライアントサイドでのみレンダリングするために使用
  useEffect(() => {
    setMounted(true)
  }, [])

  // requirementsプロップが変更されたときにvisaRequirementsステートを更新
  useEffect(() => {
    if (requirements && requirements.length > 0) {
      setVisaRequirements(requirements)
    }
  }, [requirements])

  // 編集開始時に一時データを設定
  useEffect(() => {
    if (editingRequirementId) {
      const requirement = visaRequirements.find(req => req.id === editingRequirementId)
      if (requirement) {
        setEditingRequirementData({
          description: requirement.description,
          additional_info: requirement.additional_info || ""
        })
      }
    } else {
      setEditingRequirementData(null)
    }
  }, [editingRequirementId, visaRequirements])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = value === "" ? "" : parseInt(value, 10)
    setFormData(prev => ({ ...prev, [name]: numValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData, visaRequirements)
  }

  // データベースの制約に合わせたカテゴリーオプション
  // 実際のデータベース制約に合わせて修正
  const categoryOptions = [
    "work",      // 就労ビザ
    "permanent", // 永住権
    "student",   // 学生ビザ
    "visitor"    // 観光ビザ
  ]

  // 表示用のカテゴリー名マッピング
  const categoryLabels: Record<string, string> = {
    "work": "就労ビザ",
    "permanent": "永住権",
    "student": "学生ビザ",
    "visitor": "観光ビザ"
  }

  // 要件の追加
  const handleAddRequirement = () => {
    if (!newRequirement.description.trim()) return
    
    const maxOrderIndex = visaRequirements.length > 0
      ? Math.max(...visaRequirements.map(req => req.order_index || 0))
      : -1
    
    const requirement = {
      id: `temp-${Date.now()}`, // 一時的なID
      visa_type_id: initialData?.id || null,
      description: newRequirement.description,
      additional_info: newRequirement.additional_info,
      order_index: maxOrderIndex + 1,
      isNew: true // 新規追加フラグ
    }
    
    setVisaRequirements([...visaRequirements, requirement])
    setNewRequirement({
      description: "",
      additional_info: "",
      order_index: 0
    })
  }

  // 編集中の要件データを更新（一時データのみ）
  const handleEditingDataChange = (field: string, value: string) => {
    setEditingRequirementData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // 要件の更新（編集完了時）
  const handleUpdateRequirement = (id: string) => {
    if (!editingRequirementData) return
    
    setVisaRequirements(visaRequirements.map(req => 
      req.id === id ? { 
        ...req, 
        description: editingRequirementData.description,
        additional_info: editingRequirementData.additional_info
      } : req
    ))
    setEditingRequirementId(null)
    setEditingRequirementData(null)
  }

  // 要件の削除
  const handleDeleteRequirement = (id: string) => {
    setVisaRequirements(visaRequirements.filter(req => req.id !== id))
    setDeletingRequirementId(null)
  }

  // 要件の並べ替え（上へ）
  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    
    const newRequirements = [...visaRequirements]
    const temp = newRequirements[index]
    newRequirements[index] = newRequirements[index - 1]
    newRequirements[index - 1] = temp
    
    // order_indexを更新
    newRequirements.forEach((req, i) => {
      req.order_index = i
    })
    
    setVisaRequirements(newRequirements)
  }

  // 要件の並べ替え（下へ）
  const handleMoveDown = (index: number) => {
    if (index >= visaRequirements.length - 1) return
    
    const newRequirements = [...visaRequirements]
    const temp = newRequirements[index]
    newRequirements[index] = newRequirements[index + 1]
    newRequirements[index + 1] = temp
    
    // order_indexを更新
    newRequirements.forEach((req, i) => {
      req.order_index = i
    })
    
    setVisaRequirements(newRequirements)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">ビザタイプ情報</h3>
        
        <div className="space-y-2">
          <Label htmlFor="name">ビザ名 *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">カテゴリー</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => handleSelectChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="カテゴリーを選択" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {categoryOptions.map(category => (
                <SelectItem key={category} value={category}>
                  {categoryLabels[category] || category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="average_processing_time">平均処理時間（日数）</Label>
            <Input
              id="average_processing_time"
              name="average_processing_time"
              type="number"
              value={formData.average_processing_time}
              onChange={handleNumberChange}
              placeholder="例: 30"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="order_index">表示順序</Label>
            <Input
              id="order_index"
              name="order_index"
              type="number"
              value={formData.order_index}
              onChange={handleNumberChange}
              placeholder="例: 1"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="link">関連リンク</Label>
          <Input
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="例: https://www.example.com"
          />
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">ビザ要件</h3>
        
        {/* 既存の要件リスト */}
        <div className="space-y-4 mb-6">
          {visaRequirements.map((requirement, index) => (
            <Card key={requirement.id} className="relative">
              {editingRequirementId === requirement.id ? (
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`req-description-${requirement.id}`}>説明 *</Label>
                      <Textarea
                        id={`req-description-${requirement.id}`}
                        value={editingRequirementData?.description || ""}
                        onChange={(e) => handleEditingDataChange("description", e.target.value)}
                        rows={5}
                        className="min-h-[150px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`req-additional-info-${requirement.id}`}>追加情報</Label>
                      <Textarea
                        id={`req-additional-info-${requirement.id}`}
                        value={editingRequirementData?.additional_info || ""}
                        onChange={(e) => handleEditingDataChange("additional_info", e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setEditingRequirementId(null)}>
                        キャンセル
                      </Button>
                      <Button type="button" onClick={() => handleUpdateRequirement(requirement.id)}>
                        完了
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      {requirement.description.substring(0, 100)}
                      {requirement.description.length > 100 ? "..." : ""}
                    </CardTitle>
                    {requirement.additional_info && (
                      <CardDescription>
                        {requirement.additional_info}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="flex justify-between pt-0">
                    <div className="text-sm text-muted-foreground">
                      順序: {requirement.order_index}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === visaRequirements.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRequirementId(requirement.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <AlertDialog open={deletingRequirementId === requirement.id} onOpenChange={(open) => !open && setDeletingRequirementId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeletingRequirementId(requirement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>要件を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は元に戻せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDeleteRequirement(requirement.id)}
                            >
                              削除する
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
          
          {visaRequirements.length === 0 && (
            <div className="text-center py-4 text-muted-foreground border rounded-md">
              ビザ要件がありません
            </div>
          )}
        </div>
        
        {/* 新しい要件の追加フォーム */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">新しい要件を追加</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-requirement-description">説明 *</Label>
                <Textarea
                  id="new-requirement-description"
                  value={newRequirement.description}
                  onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  className="min-h-[150px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-requirement-additional-info">追加情報</Label>
                <Textarea
                  id="new-requirement-additional-info"
                  value={newRequirement.additional_info}
                  onChange={(e) => setNewRequirement(prev => ({ ...prev, additional_info: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="button" 
              onClick={handleAddRequirement}
              disabled={!newRequirement.description.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              要件を追加
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
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