import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Zap } from "lucide-react"

const quests = [
  {
    title: "今日のタスクをこなす",
    progress: 0,
    total: 3,
    reward: "経験値 30XP",
  },
  {
    title: "コミュニティに投稿する",
    progress: 0,
    total: 1,
    reward: "経験値 10XP",
  },
]

export default function DailyQuests() {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#4FD1C5]" />
          デイリークエスト
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quests.map((quest, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{quest.title}</span>
                <span className="text-[#4FD1C5]">{quest.reward}</span>
              </div>
              <Progress value={(quest.progress / quest.total) * 100} className="bg-gray-100" />
              <p className="text-xs text-gray-600 text-right">
                {quest.progress} / {quest.total}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

