"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MoveUp, MoveDown } from "lucide-react"
import { VisaRequirementForm } from "./visa-requirement-form"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface VisaRequirementsListProps {
  requirements: any[]
  visaTypes: any[]
  onEdit: (requirement: any) => void
  onDelete: (id: string) => void
  editingRequirement: any
  onUpdate: (id: string, data: any) => void
  onCancelEdit: () => void
  onReorder: (reorderedRequirements: any[]) => void
}

export function VisaRequirementsList({
  requirements,
  visaTypes,
  onEdit,
  onDelete,
  editingRequirement,
  onUpdate,
  onCancelEdit,
  onReorder
}: VisaRequirementsListProps) {
  const [selectedVisaTypeId, setSelectedVisaTypeId] = useState<string>("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    onDelete(id)
    setDeletingId(null)
  }

  const handleMoveUp = (requirement: any) => {
    const sameTypeRequirements = requirements.filter(r => r.visa_type_id === requirement.visa_type_id)
    const currentIndex = sameTypeRequirements.findIndex(r => r.id === requirement.id)
    
    if (currentIndex <= 0) return
    
    const newRequirements = [...requirements]
    const requirementToMove = newRequirements.find(r => r.id === requirement.id)
    const requirementAbove = sameTypeRequirements[currentIndex - 1]
    
    if (requirementToMove && requirementAbove) {
      const tempOrderIndex = requirementToMove.order_index
      requirementToMove.order_index = requirementAbove.order_index
      
      const aboveInMainList = newRequirements.find(r => r.id === requirementAbove.id)
      if (aboveInMainList) {
        aboveInMainList.order_index = tempOrderIndex
      }
      
      onReorder(newRequirements)
    }
  }

  const handleMoveDown = (requirement: any) => {
    const sameTypeRequirements = requirements.filter(r => r.visa_type_id === requirement.visa_type_id)
    const currentIndex = sameTypeRequirements.findIndex(r => r.id === requirement.id)
    
    if (currentIndex >= sameTypeRequirements.length - 1) return
    
    const newRequirements = [...requirements]
    const requirementToMove = newRequirements.find(r => r.id === requirement.id)
    const requirementBelow = sameTypeRequirements[currentIndex + 1]
    
    if (requirementToMove && requirementBelow) {
      const tempOrderIndex = requirementToMove.order_index
      requirementToMove.order_index = requirementBelow.order_index
      
      const belowInMainList = newRequirements.find(r => r.id === requirementBelow.id)
      if (belowInMainList) {
        belowInMainList.order_index = tempOrderIndex
      }
      
      onReorder(newRequirements)
    }
  }

  // フィルタリングと並べ替え
  const filteredRequirements = selectedVisaTypeId 
    ? requirements.filter(req => req.visa_type_id === selectedVisaTypeId)
    : requirements

  const sortedRequirements = [...filteredRequirements].sort((a, b) => {
    if (a.visa_type_id !== b.visa_type_id) {
      return a.visa_type_id.localeCompare(b.visa_type_id)
    }
    return (a.order_index || 0) - (b.order_index || 0)
  })

  // ビザタイプ名を取得する関数
  const getVisaTypeName = (visaTypeId: string) => {
    const visaType = visaTypes.find(vt => vt.id === visaTypeId)
    return visaType ? visaType.name : "不明なビザタイプ"
  }

  // HTMLをプレーンテキストに変換する関数
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  return (
    <div>
      <div className="mb-4">
        <Label htmlFor="visa-type-filter" className="block mb-2">ビザタイプでフィルター</Label>
        <Select 
          value={selectedVisaTypeId} 
          onValueChange={setSelectedVisaTypeId}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="すべてのビザタイプ" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="">すべてのビザタイプ</SelectItem>
            {visaTypes.map(visaType => (
              <SelectItem key={visaType.id} value={visaType.id}>
                {visaType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ビザタイプ</TableHead>
              <TableHead>説明</TableHead>
              <TableHead>順序</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequirements.map(requirement => (
              <TableRow key={requirement.id}>
                {editingRequirement?.id === requirement.id ? (
                  <TableCell colSpan={4}>
                    <VisaRequirementForm
                      initialData={requirement}
                      visaTypes={visaTypes}
                      onSubmit={(data) => onUpdate(requirement.id, data)}
                      onCancel={onCancelEdit}
                    />
                  </TableCell>
                ) : (
                  <>
                    <TableCell>{getVisaTypeName(requirement.visa_type_id)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {requirement.description ? stripHtml(requirement.description).substring(0, 100) + "..." : "-"}
                    </TableCell>
                    <TableCell>{requirement.order_index || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveUp(requirement)}
                          disabled={sortedRequirements.filter(r => r.visa_type_id === requirement.visa_type_id).indexOf(requirement) === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveDown(requirement)}
                          disabled={
                            sortedRequirements.filter(r => r.visa_type_id === requirement.visa_type_id).indexOf(requirement) === 
                            sortedRequirements.filter(r => r.visa_type_id === requirement.visa_type_id).length - 1
                          }
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(requirement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={deletingId === requirement.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeletingId(requirement.id)}
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
                                onClick={() => handleDelete(requirement.id)}
                              >
                                削除する
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {sortedRequirements.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  {selectedVisaTypeId ? "選択したビザタイプの要件がありません" : "要件がありません"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 