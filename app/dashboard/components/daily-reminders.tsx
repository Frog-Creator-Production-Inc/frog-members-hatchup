import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function DailyReminders() {
  const today = new Date()
  const reminders = [
    {
      id: 1,
      title: "英語学習を忘れずに",
      time: "10:00",
      priority: "high",
    },
    {
      id: 2,
      title: "履歴書の作成を進める",
      time: "14:00",
      priority: "medium",
    },
    {
      id: 3,
      title: "コミュニティチェック",
      time: "16:00",
      priority: "low",
    },
  ]

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">今日のリマインダー</CardTitle>
        <Bell className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${
                    reminder.priority === "high"
                      ? "bg-red-500"
                      : reminder.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                />
                <span className="text-sm">{reminder.title}</span>
              </div>
              <span className="text-sm text-muted-foreground">{reminder.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

