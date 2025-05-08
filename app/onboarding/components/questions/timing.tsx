"use client"

import { motion } from "framer-motion"
import { Calendar } from "lucide-react"
import { QuestionCard } from "../question-card"
import { MascotBubble } from "../mascot-bubble"

const options = [
  { id: "asap", label: "できるだけ早く" },
  { id: "3months", label: "3ヶ月以内" },
  { id: "6months", label: "半年以内" },
  { id: "1year", label: "1年以内" },
  { id: "planning", label: "まだ計画段階" },
]

interface TimingQuestionProps {
  onAnswer: (answer: string) => void
}

export function TimingQuestion({ onAnswer }: TimingQuestionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <MascotBubble message="海外へ行くのはいつ頃を考えてるかな？" />
      <div className="grid gap-4 mt-8">
        {options.map((option) => (
          <QuestionCard key={option.id} onClick={() => onAnswer(option.id)} icon={Calendar}>
            {option.label}
          </QuestionCard>
        ))}
      </div>
    </motion.div>
  )
}

