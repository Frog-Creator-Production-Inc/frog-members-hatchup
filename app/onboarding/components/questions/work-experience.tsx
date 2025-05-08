"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Briefcase } from "lucide-react"
import { QuestionCard } from "../question-card"
import { MascotBubble } from "../mascot-bubble"

const options = [
  { id: "yes", label: "はい、2年以上の経験があります" },
  { id: "almost", label: "もうすぐ2年になります" },
  { id: "no", label: "いいえ、2年未満です" },
]

interface WorkExperienceQuestionProps {
  onAnswer: (answer: string) => void
}

export function WorkExperienceQuestion({ onAnswer }: WorkExperienceQuestionProps) {
  useEffect(() => {
    console.log("WorkExperienceQuestion rendered, onAnswer:", onAnswer)
  }, [onAnswer])

  const handleClick = (answerId: string) => {
    console.log("WorkExperienceQuestion: handleClick called with:", answerId)
    onAnswer(answerId)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <MascotBubble message="専門職として働いて2年以上の経験はあるかな？" />
      <div className="grid gap-4 mt-8">
        {options.map((option) => (
          <QuestionCard key={option.id} onClick={() => handleClick(option.id)} icon={Briefcase}>
            {option.label}
          </QuestionCard>
        ))}
      </div>
    </motion.div>
  )
}

