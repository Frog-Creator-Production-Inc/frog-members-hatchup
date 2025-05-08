import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
interface CourseSubject {
  id: string
  title: string
  description: string | null
}

interface CourseSubjectsProps {
  subjects: CourseSubject[]
}

export function CourseSubjects({ subjects }: CourseSubjectsProps) {
  if (subjects.length === 0) return <p className="text-gray-500">科目情報はありません。</p>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700 mb-4">カリキュラム</h3>
      <div className="space-y-4">
        {subjects.map((subject, index) => (
          <div
            key={subject.id}
            className={cn(
              "group relative rounded-lg border p-4 transition-all hover:bg-muted/50 bg-gray-50",
              "flex items-start gap-4"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {index + 1}
            </div>
            <div className="space-y-1">
              <h4 className="font-medium leading-none">{subject.title}</h4>
              {subject.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {subject.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
