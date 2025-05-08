"use client"

import { motion } from "framer-motion"
import { Plane } from "lucide-react"
import { QuestionCard } from "../question-card"
import { MascotBubble } from "../mascot-bubble"

const options = [
  { id: "eligible", label: "はい、申請可能です" },
  { id: "applied", label: "過去に申請したことがあります" },
  { id: "age", label: "年齢制限で申請できません" },
  { id: "unsure", label: "わかりません" },
]

interface WorkingHolidayQuestionProps {
  onAnswer: (answer: string) => void
}

export function WorkingHolidayQuestion({ onAnswer }: WorkingHolidayQuestionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <MascotBubble message="ワーキングホリデーは申請できる？" />
      <div className="grid gap-4 mt-8">
        {options.map((option) => (
          <QuestionCard key={option.id} onClick={() => onAnswer(option.id)} icon={Plane}>
            {option.label}
          </QuestionCard>
        ))}
      </div>
    </motion.div>
  )
}

