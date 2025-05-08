import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import type { CourseIntakeDate } from "@/types/database.types"

interface CourseIntakesProps {
  intakeDates: CourseIntakeDate[]
}

export function CourseIntakes({ intakeDates }: CourseIntakesProps) {
  if (intakeDates.length === 0) return null

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          入学時期
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {intakeDates.map((intake) => (
            <div key={intake.id} className="text-sm">
              {new Date(intake.intake_date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

