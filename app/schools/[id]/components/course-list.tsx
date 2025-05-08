import Link from "next/link"
import { DataCard } from "@/components/ui/data-card"
import { PriceDisplay } from "@/components/ui/price-display"
import type { Course } from "@/types/schema"

interface CourseListProps {
  courses: Course[] | null | undefined
}

export function CourseList({ courses }: CourseListProps) {
  if (!courses || courses.length === 0) {
    return <p>現在、利用可能なコースはありません。</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <DataCard
          key={course.id}
          title={
            <Link href={`/courses/${course.id}`} className="hover:underline">
              {course.name}
            </Link>
          }
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>期間: {course.total_weeks}週間</div>
            {course.work_permit_weeks && <div>就労可能期間: {course.work_permit_weeks}週間</div>}
            {course.tuition_and_others && (
              <div>
                学費: <PriceDisplay amount={course.tuition_and_others} />
              </div>
            )}
          </div>
        </DataCard>
      ))}
    </div>
  )
}

