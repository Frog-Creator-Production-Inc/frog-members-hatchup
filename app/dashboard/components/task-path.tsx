import { Star } from "lucide-react"
import type { Profile } from "@/types/supabase"

interface TaskPathProps {
  profile: Profile
}

const tasks = [
  { id: "english_level", name: "英語力確認" },
  { id: "work_experience", name: "職歴確認" },
  { id: "working_holiday", name: "ワーホリ確認" },
  { id: "age_range", name: "年齢確認" },
  { id: "abroad_timing", name: "渡航時期" },
  { id: "support_needed", name: "必要サポート" },
]

export default function TaskPath({ profile }: TaskPathProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="h-0.5 w-full bg-gray-200" />
      </div>
      <div className="relative flex justify-between">
        {tasks.map((task) => (
          <div key={task.id} className="flex flex-col items-center">
            <div
              className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white
                ${profile[task.id as keyof Profile] ? "border-[#4FD1C5]" : "border-gray-300"}`}
            >
              <Star className={`h-6 w-6 ${profile[task.id as keyof Profile] ? "text-[#4FD1C5]" : "text-gray-300"}`} />
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                profile[task.id as keyof Profile] ? "text-[#4FD1C5]" : "text-gray-500"
              }`}
            >
              {task.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

