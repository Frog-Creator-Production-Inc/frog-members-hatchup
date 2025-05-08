"use client"

import { motion } from "framer-motion"
import { User } from "lucide-react"
import { QuestionCard } from "../question-card"
import { MascotBubble } from "../mascot-bubble"

const options = [
  { id: "18-25", label: "18-25歳" },
  { id: "26-30", label: "26-30歳" },
  { id: "31-35", label: "31-35歳" },
  { id: "36-40", label: "36-40歳" },
  { id: "over-40", label: "41歳以上" },
]

interface AgeQuestionProps {
  onAnswer: (answer: string) => void
}

export function AgeQuestion({ onAnswer }: AgeQuestionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <MascotBubble message="年齢を教えてくれるかな？（ビザ申請のポイントに影響するよ！）" />
      <div className="grid gap-4 mt-8">
        {options.map((option) => (
          <QuestionCard key={option.id} onClick={() => onAnswer(option.id)} icon={User}>
            {option.label}
          </QuestionCard>
        ))}
      </div>
    </motion.div>
  )
}

