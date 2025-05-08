import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"

interface TaskProgressProps {
  progress: number
}

export default function TaskProgress({ progress }: TaskProgressProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">タスク進捗</CardTitle>
        <Trophy className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>完了タスク</span>
            <span>{progress}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {progress < 100 ? "着実に進めていますね！" : "全てのタスクを完了しました！"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

