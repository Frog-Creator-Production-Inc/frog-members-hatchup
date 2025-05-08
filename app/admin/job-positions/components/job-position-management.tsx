"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { JobPositionForm } from "./job-position-form"
import { JobPositionsList } from "./job-positions-list"
import { JobPosition } from "@/types/supabase"

interface JobPositionManagementProps {
  initialJobPositions: JobPosition[]
}

export function JobPositionManagement({ initialJobPositions }: JobPositionManagementProps) {
  const [jobPositions, setJobPositions] = useState(initialJobPositions)
  const [isAddingJobPosition, setIsAddingJobPosition] = useState(false)
  const [editingJobPosition, setEditingJobPosition] = useState<JobPosition | null>(null)
  
  const supabase = createClientComponentClient()

  // 職種の追加
  const handleAddJobPosition = async (data: Partial<JobPosition>) => {
    try {
      const { data: newJobPosition, error } = await supabase
        .from('job_positions')
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      
      setJobPositions([...jobPositions, newJobPosition])
      setIsAddingJobPosition(false)
      toast.success('職種を追加しました')
    } catch (error: any) {
      console.error('職種の追加エラー:', error)
      toast.error(`職種の追加に失敗しました: ${error.message}`)
    }
  }
  
  // 職種の更新
  const handleUpdateJobPosition = async (id: string, data: Partial<JobPosition>) => {
    try {
      const { data: updatedJobPosition, error } = await supabase
        .from('job_positions')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      setJobPositions(jobPositions.map(jp => jp.id === id ? updatedJobPosition : jp))
      setEditingJobPosition(null)
      toast.success('職種を更新しました')
    } catch (error: any) {
      console.error('職種の更新エラー:', error)
      toast.error(`職種の更新に失敗しました: ${error.message}`)
    }
  }
  
  // 職種の削除
  const handleDeleteJobPosition = async (id: string) => {
    try {
      // コースとの関連を確認
      const { data: relatedCourses, error: checkError } = await supabase
        .from('course_job_positions')
        .select('course_id')
        .eq('job_position_id', id)

      if (checkError) throw checkError

      // プロファイルでの使用を確認
      const { data: relatedProfiles, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('future_occupation', id)
      
      if (profileCheckError) throw profileCheckError

      // 関連がある場合は削除不可
      if ((relatedCourses && relatedCourses.length > 0) || (relatedProfiles && relatedProfiles.length > 0)) {
        toast.error('この職種はコースまたはユーザープロファイルで使用されているため削除できません')
        return
      }

      const { error } = await supabase
        .from('job_positions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setJobPositions(jobPositions.filter(jp => jp.id !== id))
      toast.success('職種を削除しました')
    } catch (error: any) {
      console.error('職種の削除エラー:', error)
      toast.error(`職種の削除に失敗しました: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {isAddingJobPosition ? (
        <div className="bg-muted/50 p-4 rounded-lg border bg-white">
          <h3 className="text-lg font-medium mb-4">新しい職種を追加</h3>
          <JobPositionForm 
            onSubmit={handleAddJobPosition}
            onCancel={() => setIsAddingJobPosition(false)}
          />
        </div>
      ) : editingJobPosition ? (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">職種を編集</h3>
          <JobPositionForm 
            initialData={editingJobPosition}
            onSubmit={(data) => handleUpdateJobPosition(editingJobPosition.id, data)}
            onCancel={() => setEditingJobPosition(null)}
          />
        </div>
      ) : (
        <Button 
          onClick={() => setIsAddingJobPosition(true)}
          className="mb-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          職種を追加
        </Button>
      )}
      
      {!isAddingJobPosition && !editingJobPosition && (
        <JobPositionsList
          jobPositions={jobPositions}
          onEdit={setEditingJobPosition}
          onDelete={handleDeleteJobPosition}
        />
      )}
    </div>
  )
} 