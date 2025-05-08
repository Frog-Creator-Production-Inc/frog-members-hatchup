"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { VisaCard } from "@/app/visa/components/visa-card"
import { VisaTypeList } from "@/app/visa/components/visa-type-list"
import { Trash2, Save, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface Requirement {
  id: string
  description: string
  additional_info?: string
  order_index: number
}

interface VisaType {
  id: string
  name: string
  category: string
  description: string
  average_processing_time: number
  requirements?: Requirement[]
  link?: string
  order_index?: number
}

interface VisaPlanItem {
  id: string
  visa_type_id: string
  order_index: number
  notes: string
  admin_memo: string | null
}

interface VisaPlan {
  id: string
  name: string
  description: string
  status: string
  user_id: string
  visa_plan_items: VisaPlanItem[]
}

interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

interface VisaPlanCreatorProps {
  visaTypes: VisaType[]
  users: Profile[]
  selectedUser: Profile | null
  initialPlan?: VisaPlan
}

export function VisaPlanCreator({ 
  visaTypes, 
  users, 
  selectedUser, 
  initialPlan 
}: VisaPlanCreatorProps) {
  const [selectedVisas, setSelectedVisas] = useState<VisaPlanItem[]>(
    initialPlan?.visa_plan_items || []
  )
  const [planId, setPlanId] = useState<string | null>(initialPlan?.id || null)
  const [planName, setPlanName] = useState(initialPlan?.name || "")
  const [planDescription, setPlanDescription] = useState(initialPlan?.description || "")
  const [userId, setUserId] = useState<string>(initialPlan?.user_id || selectedUser?.id || "")
  const [planStatus, setPlanStatus] = useState(initialPlan?.status || "draft")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    if (selectedUser) {
      setUserId(selectedUser.id)
    }
  }, [selectedUser])

  // アイテムの並べ替え
  const reorderItems = (startIndex: number, endIndex: number) => {
    const items = Array.from(selectedVisas)
    const [reorderedItem] = items.splice(startIndex, 1)
    items.splice(endIndex, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }))

    setSelectedVisas(updatedItems)
  }

  // ビザタイプをプランに追加
  const handleAddVisa = (visaTypeId: string) => {
    const newItem: VisaPlanItem = {
      id: crypto.randomUUID(),
      visa_type_id: visaTypeId,
      order_index: selectedVisas.length,
      notes: "",
      admin_memo: null
    }

    setSelectedVisas([...selectedVisas, newItem])
  }

  // ビザを削除
  const handleRemoveVisa = (itemId: string) => {
    setSelectedVisas(selectedVisas.filter((item) => item.id !== itemId))
  }

  // ビザを上に移動
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderItems(index, index - 1)
    }
  }

  // ビザを下に移動
  const handleMoveDown = (index: number) => {
    if (index < selectedVisas.length - 1) {
      reorderItems(index, index + 1)
    }
  }

  const handleSave = async () => {
    if (!userId) {
      toast.error("ユーザーを選択してください")
      return
    }

    if (!planName.trim()) {
      toast.error("プラン名を入力してください")
      return
    }

    setIsSaving(true)

    try {
      let currentPlanId = planId

      // 新規作成または更新
      if (!currentPlanId) {
        // 新規プラン作成
        const { data: plan, error: planError } = await supabase
          .from("visa_plans")
          .insert({
            user_id: userId,
            name: planName,
            description: planDescription,
            status: planStatus,
          })
          .select()
          .single()

        if (planError) throw planError
        currentPlanId = plan.id
        setPlanId(currentPlanId)
      } else {
        // 既存プラン更新
        const { error: updateError } = await supabase
          .from("visa_plans")
          .update({
            name: planName,
            description: planDescription,
            user_id: userId,
            status: planStatus,
          })
          .eq("id", currentPlanId)

        if (updateError) throw updateError

        // 既存のアイテムを削除
        const { error: deleteError } = await supabase
          .from("visa_plan_items")
          .delete()
          .eq("plan_id", currentPlanId)

        if (deleteError) throw deleteError
      }

      // ビザプランアイテムを保存（選択されたビザがある場合のみ）
      if (selectedVisas.length > 0) {
        const { error: itemsError } = await supabase
          .from("visa_plan_items")
          .insert(
            selectedVisas.map((item, index) => ({
              ...item,
              plan_id: currentPlanId,
              order_index: index,
            }))
          )

        if (itemsError) throw itemsError
      }

      toast.success("ビザプランを保存しました")
      router.push("/admin/visa-reviews")
    } catch (error) {
      console.error("Error saving visa plan:", error)
      toast.error("ビザプランの保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const getUserDisplayName = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.email
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push("/admin/visa-reviews")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">
          {initialPlan ? "ビザプラン編集" : "新規ビザプラン作成"}
        </h1>
        <div className="flex gap-2">
          <Select 
            value={planStatus} 
            onValueChange={setPlanStatus}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">下書き</SelectItem>
              <SelectItem value="published">公開</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>プラン情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="user">ユーザー</Label>
                  <Select 
                    value={userId} 
                    onValueChange={setUserId}
                    disabled={!!initialPlan}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ユーザーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getUserDisplayName(user)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">プラン名</Label>
                  <Input
                    id="name"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="プラン名を入力"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    placeholder="プランの説明を入力"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>ビザプラン</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px] space-y-4 p-4 border-2 border-dashed rounded-lg">
                {selectedVisas.map((item, index) => {
                  const visaType = visaTypes.find((type) => type.id === item.visa_type_id)
                  if (!visaType) return null

                  return (
                    <div key={item.id} className="relative group">
                      <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            title="上に移動"
                          >
                            <ArrowLeft className="h-4 w-4 rotate-90" />
                          </Button>
                        )}
                        {index < selectedVisas.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            title="下に移動"
                          >
                            <ArrowLeft className="h-4 w-4 -rotate-90" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVisa(item.id)}
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <VisaCard
                        visa={visaType}
                        notes={item.notes}
                        adminMemo={item.admin_memo}
                        isAdmin={true}
                        onNotesChange={(notes) => {
                          const updatedItems = selectedVisas.map((v) =>
                            v.id === item.id ? { ...v, notes } : v
                          )
                          setSelectedVisas(updatedItems)
                        }}
                        onAdminMemoChange={(memo) => {
                          const updatedItems = selectedVisas.map((v) =>
                            v.id === item.id ? { ...v, admin_memo: memo } : v
                          )
                          setSelectedVisas(updatedItems)
                        }}
                      />
                    </div>
                  )
                })}
                {selectedVisas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    右側のリストからビザをクリックして追加してください
                    <p className="mt-2 text-sm">
                      ※ビザなしでもプランを保存できます
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>利用可能なビザ</CardTitle>
            </CardHeader>
            <CardContent>
              <VisaTypeList 
                visaTypes={visaTypes} 
                onDrop={handleAddVisa}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 