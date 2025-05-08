import { Badge } from "@/components/ui/badge"

interface JobPosition {
  job_position_id: string
  job_positions: {
    id: string
    title: string
    description: string | null
    industry: string | null
  } | any // データ構造が異なる場合の対応
}

interface CourseJobPositionsProps {
  jobPositions: JobPosition[] | any[] // 型の互換性を確保
}

export function CourseJobPositions({ jobPositions }: CourseJobPositionsProps) {
  if (!jobPositions || jobPositions.length === 0) {
    return <p className="text-gray-500">関連する職種情報はありません。</p>
  }

  return (
    <div className="space-y-4">
      {jobPositions.map((item) => {
        // job_positionsが配列の場合は最初の要素を使用
        const jobPosition = Array.isArray(item.job_positions) 
          ? item.job_positions[0]
          : item.job_positions;

        return (
          <div key={item.job_position_id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">{jobPosition.title}</h3>
              {jobPosition.industry && (
                <Badge variant="outline">{jobPosition.industry}</Badge>
              )}
            </div>
            {jobPosition.description && (
              <p className="text-sm text-muted-foreground">{jobPosition.description}</p>
            )}
          </div>
        );
      })}
    </div>
  )
} 