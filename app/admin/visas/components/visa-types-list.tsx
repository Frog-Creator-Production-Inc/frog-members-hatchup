"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
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
import { useState } from "react"
import { VisaTypeForm } from "./visa-type-form"

interface VisaTypesListProps {
  visaTypes: any[]
  onEdit: (visaType: any) => void
  onDelete: (id: string) => void
  editingVisaType: any
  onUpdate: (id: string, data: any, requirements: any[]) => void
  onCancelEdit: () => void
}

export function VisaTypesList({
  visaTypes,
  onEdit,
  onDelete,
  editingVisaType,
  onUpdate,
  onCancelEdit
}: VisaTypesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    onDelete(id)
    setDeletingId(null)
  }

  // 表示順でソート
  const sortedVisaTypes = [...visaTypes].sort((a, b) => {
    return (a.order_index || 0) - (b.order_index || 0)
  })

  return (
    <div className="bg-white rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>カテゴリー</TableHead>
            <TableHead>説明</TableHead>
            <TableHead>処理時間</TableHead>
            <TableHead>表示順</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedVisaTypes.map(visaType => (
            <TableRow key={visaType.id}>
              {editingVisaType?.id === visaType.id ? (
                <TableCell colSpan={6}>
                  <VisaTypeForm
                    initialData={visaType}
                    onSubmit={(data: any) => onUpdate(visaType.id, data, [])}
                    onCancel={onCancelEdit}
                  />
                </TableCell>
              ) : (
                <>
                  <TableCell className="font-medium">{visaType.name}</TableCell>
                  <TableCell>{visaType.category || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">{visaType.description || "-"}</TableCell>
                  <TableCell>{visaType.average_processing_time ? `${visaType.average_processing_time}日` : "-"}</TableCell>
                  <TableCell>{visaType.order_index || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(visaType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={deletingId === visaType.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeletingId(visaType.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>ビザタイプを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は元に戻せません。このビザタイプに関連するすべての要件も削除されます。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => handleDelete(visaType.id)}
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
          {visaTypes.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                ビザタイプがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 