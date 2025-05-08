"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, SortAsc } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { VisaTypeForm } from "./visa-type-form"
import { VisaTypesList } from "./visa-types-list"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface VisaManagementProps {
  initialVisaTypes: any[]
  initialVisaRequirements: any[]
}

export function VisaManagement({ 
  initialVisaTypes, 
  initialVisaRequirements 
}: VisaManagementProps) {
  const [visaTypes, setVisaTypes] = useState(initialVisaTypes)
  const [visaRequirements, setVisaRequirements] = useState(initialVisaRequirements)
  const [isAddingVisaType, setIsAddingVisaType] = useState(false)
  const [editingVisaType, setEditingVisaType] = useState<any>(null)
  const [editingTypeRequirements, setEditingTypeRequirements] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  
  const supabase = createClientComponentClient()

  // 編集中のビザタイプの要件を取得
  useEffect(() => {
    if (editingVisaType) {
      const typeRequirements = visaRequirements.filter(
        req => req.visa_type_id === editingVisaType.id
      ).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      
      setEditingTypeRequirements(typeRequirements)
    } else {
      setEditingTypeRequirements([])
    }
  }, [editingVisaType, visaRequirements])

  // フィルタリングされたビザタイプを取得
  const getFilteredVisaTypes = () => {
    let filtered = [...visaTypes]
    
    // 検索フィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(visa => 
        visa.name.toLowerCase().includes(query) || 
        visa.description.toLowerCase().includes(query)
      )
    }
    
    // カテゴリフィルタリング
    if (filterCategory !== "all") {
      filtered = filtered.filter(visa => visa.category === filterCategory)
    }
    
    // ソート
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "category") {
        return a.category.localeCompare(b.category)
      }
      if (sortBy === "processing_time") {
        const timeA = a.average_processing_time || 0
        const timeB = b.average_processing_time || 0
        return timeA - timeB
      }
      return 0
    })
    
    return filtered
  }

  // カテゴリごとにグループ化
  const getVisaTypesByCategory = () => {
    const filtered = getFilteredVisaTypes()
    const groups: Record<string, any[]> = {}
    
    filtered.forEach(visa => {
      const category = visa.category || "other"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(visa)
    })
    
    return groups
  }

  // ビザタイプの追加
  const handleAddVisaType = async (data: any, requirements: any[]) => {
    try {
      // 1. ビザタイプを追加
      const { data: newVisaType, error } = await supabase
        .from('visa_types')
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      
      // 2. 関連する要件を追加
      if (requirements.length > 0) {
        const requirementsWithTypeId = requirements.map(req => ({
          ...req,
          visa_type_id: newVisaType.id,
          isNew: undefined // isNewフラグを削除
        }))
        
        const { data: newRequirements, error: reqError } = await supabase
          .from('visa_requirements')
          .insert(requirementsWithTypeId)
          .select()
        
        if (reqError) throw reqError
        
        setVisaRequirements([...visaRequirements, ...newRequirements])
      }
      
      setVisaTypes([...visaTypes, newVisaType])
      setIsAddingVisaType(false)
      toast.success('ビザタイプを追加しました')
    } catch (error: any) {
      console.error('ビザタイプの追加エラー:', error)
      toast.error(`ビザタイプの追加に失敗しました: ${error.message}`)
    }
  }
  
  // ビザタイプの更新
  const handleUpdateVisaType = async (id: string, data: any, requirements: any[]) => {
    try {
      // 1. ビザタイプを更新
      const { data: updatedVisaType, error } = await supabase
        .from('visa_types')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // 2. 要件を処理
      // 2.1 新規追加の要件
      const newRequirements = requirements.filter(req => req.isNew)
      if (newRequirements.length > 0) {
        const newReqData = newRequirements.map(req => ({
          description: req.description,
          additional_info: req.additional_info,
          order_index: req.order_index,
          visa_type_id: id
        }))
        
        const { data: insertedReqs, error: insertError } = await supabase
          .from('visa_requirements')
          .insert(newReqData)
          .select()
        
        if (insertError) throw insertError
      }
      
      // 2.2 既存の要件を更新
      const existingRequirements = requirements.filter(req => !req.isNew)
      for (const req of existingRequirements) {
        const { error: updateError } = await supabase
          .from('visa_requirements')
          .update({
            description: req.description,
            additional_info: req.additional_info,
            order_index: req.order_index
          })
          .eq('id', req.id)
        
        if (updateError) throw updateError
      }
      
      // 2.3 削除された要件を処理
      const currentReqIds = requirements.filter(req => !req.isNew).map(req => req.id)
      const originalReqIds = visaRequirements
        .filter(req => req.visa_type_id === id)
        .map(req => req.id)
      
      const deletedReqIds = originalReqIds.filter(reqId => !currentReqIds.includes(reqId))
      
      if (deletedReqIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('visa_requirements')
          .delete()
          .in('id', deletedReqIds)
        
        if (deleteError) throw deleteError
      }
      
      // 3. 状態を更新
      // ビザタイプの更新
      setVisaTypes(visaTypes.map(vt => vt.id === id ? updatedVisaType : vt))
      
      // 要件の更新
      const updatedRequirements = [
        ...visaRequirements.filter(req => req.visa_type_id !== id), // 他のビザタイプの要件
        ...requirements.filter(req => !req.isNew), // 既存の更新された要件
        ...(newRequirements.length > 0 ? 
          await supabase.from('visa_requirements').select('*').eq('visa_type_id', id).then(({ data }) => data || []) 
          : []) // 新しく追加された要件
      ]
      
      setVisaRequirements(updatedRequirements)
      setEditingVisaType(null)
      toast.success('ビザタイプを更新しました')
    } catch (error: any) {
      console.error('ビザタイプの更新エラー:', error)
      toast.error(`ビザタイプの更新に失敗しました: ${error.message}`)
    }
  }
  
  // ビザタイプの削除
  const handleDeleteVisaType = async (id: string) => {
    try {
      // ビザタイプを削除すると、関連する要件も自動的に削除される（外部キー制約）
      const { error } = await supabase
        .from('visa_types')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setVisaTypes(visaTypes.filter(vt => vt.id !== id))
      setVisaRequirements(visaRequirements.filter(req => req.visa_type_id !== id))
      toast.success('ビザタイプを削除しました')
    } catch (error: any) {
      console.error('ビザタイプの削除エラー:', error)
      toast.error(`ビザタイプの削除に失敗しました: ${error.message}`)
    }
  }

  // カテゴリ名の表示名を取得
  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      "student": "学生ビザ",
      "work": "就労ビザ",
      "visitor": "観光ビザ",
      "permanent": "永住権",
      "other": "その他"
    }
    return categoryMap[category] || category
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">ビザタイプ管理</CardTitle>
          <CardDescription>
            ビザ情報を追加、編集、削除します。ユーザーに表示される情報を管理できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ビザタイプを検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <div className="w-full md:w-48">
                <Select 
                  value={filterCategory} 
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="カテゴリで絞り込み" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのカテゴリ</SelectItem>
                    <SelectItem value="student">学生ビザ</SelectItem>
                    <SelectItem value="work">就労ビザ</SelectItem>
                    <SelectItem value="visitor">観光ビザ</SelectItem>
                    <SelectItem value="permanent">永住権</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-48">
                <Select 
                  value={sortBy} 
                  onValueChange={setSortBy}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4" />
                      <SelectValue placeholder="ソート順" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">名前</SelectItem>
                    <SelectItem value="category">カテゴリ</SelectItem>
                    <SelectItem value="processing_time">処理期間</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="ml-auto">
              <Button 
                onClick={() => setIsAddingVisaType(true)}
                className="whitespace-nowrap"
                disabled={isAddingVisaType || editingVisaType !== null}
              >
                <Plus className="h-4 w-4 mr-2" />
                新規ビザタイプ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAddingVisaType ? (
        <Card>
          <CardHeader>
            <CardTitle>新しいビザタイプを追加</CardTitle>
          </CardHeader>
          <CardContent>
            <VisaTypeForm 
              onSubmit={handleAddVisaType}
              onCancel={() => setIsAddingVisaType(false)}
            />
          </CardContent>
        </Card>
      ) : editingVisaType ? (
        <Card>
          <CardHeader>
            <CardTitle>ビザタイプを編集</CardTitle>
          </CardHeader>
          <CardContent>
            <VisaTypeForm 
              initialData={editingVisaType}
              requirements={editingTypeRequirements}
              onSubmit={(data, requirements) => handleUpdateVisaType(editingVisaType.id, data, requirements)}
              onCancel={() => setEditingVisaType(null)}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="list">
          <TabsList className="mb-4">
            <TabsTrigger value="list">リスト表示</TabsTrigger>
            <TabsTrigger value="category">カテゴリ別</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <Card>
              <CardContent className="pt-6">
                <VisaTypesList 
                  visaTypes={getFilteredVisaTypes()}
                  onEdit={(visaType) => setEditingVisaType(visaType)}
                  onDelete={handleDeleteVisaType}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="category">
            <div className="space-y-6">
              {Object.entries(getVisaTypesByCategory()).map(([category, visas]) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle>{getCategoryDisplayName(category)}</CardTitle>
                    <CardDescription>
                      {visas.length}件のビザタイプ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VisaTypesList 
                      visaTypes={visas}
                      onEdit={(visaType) => setEditingVisaType(visaType)}
                      onDelete={handleDeleteVisaType}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 