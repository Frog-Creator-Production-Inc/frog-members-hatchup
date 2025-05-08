"use client"

import { motion } from "framer-motion"
import { HelpCircle } from "lucide-react"
import { QuestionCard } from "../question-card"
import { MascotBubble } from "../mascot-bubble"

const options = [
  { id: "visa", label: "ビザ申請のサポート" },
  { id: "job", label: "就職先の紹介" },
  { id: "english", label: "英語学習のサポート" },
  { id: "life", label: "現地での生活サポート" },
  { id: "all", label: "すべてのサポートが必要" },
]

interface SupportQuestionProps {
  onAnswer: (answer: string) => void
}

export function SupportQuestion({ onAnswer }: SupportQuestionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <MascotBubble message="どんなサポートが必要？" />
      <div className="grid gap-4 mt-8">
        {options.map((option) => (
          <QuestionCard
            key={option.id}
            onClick={() => {
              if (typeof onAnswer === "function") {
                onAnswer(option.id)
              }
            }}
            icon={HelpCircle}
          >
            {option.label}
          </QuestionCard>
        ))}
      </div>
    </motion.div>
  )
}

