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
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { JobPosition } from "@/types/supabase"

interface JobPositionsListProps {
  jobPositions: JobPosition[]
  onEdit: (jobPosition: JobPosition) => void
  onDelete: (id: string) => void
}

export function JobPositionsList({
  jobPositions,
  onEdit,
  onDelete
}: JobPositionsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // 検索フィルタリング
  const filteredJobPositions = jobPositions.filter(
    (job) => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.industry && job.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <Input
            placeholder="職種、業界などで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>職種名</TableHead>
              <TableHead>業界</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  {searchTerm ? "検索条件に一致する職種が見つかりません" : "登録されている職種がありません"}
                </TableCell>
              </TableRow>
            ) : (
              filteredJobPositions.map((jobPosition) => (
                <TableRow key={jobPosition.id}>
                  <TableCell className="font-medium">{jobPosition.title}</TableCell>
                  <TableCell>{jobPosition.industry || "未設定"}</TableCell>
                  <TableCell>
                    {jobPosition.description 
                      ? jobPosition.description.length > 50 
                        ? `${jobPosition.description.substring(0, 50)}...` 
                        : jobPosition.description 
                      : "未設定"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(jobPosition)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={deletingId === jobPosition.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeletingId(jobPosition.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>職種を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は元に戻せません。この職種がコースやユーザープロファイルで使用されている場合は削除できません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => {
                                onDelete(jobPosition.id)
                                setDeletingId(null)
                              }}
                              className="bg-red-500 text-white hover:bg-red-600"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 