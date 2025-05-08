"use client"

import { motion } from "framer-motion"
import { Briefcase, GraduationCap, Rocket, Home } from "lucide-react"
import { QuestionCard } from "../question-card"
import { MascotBubble } from "../mascot-bubble"

const options = [
  { id: "overseas_job", label: "海外就職がしたい", icon: Briefcase },
  { id: "improve_language", label: "語学力を上げたい", icon: GraduationCap },
  { id: "career_change", label: "キャリアチェンジを希望", icon: Rocket },
  { id: "find_new_home", label: "移住先を探している", icon: Home },
]

interface MigrationGoalQuestionProps {
  onAnswer: (answer: string) => void
}

export function MigrationGoalQuestion({ onAnswer }: MigrationGoalQuestionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <MascotBubble message="海外に行く目的は何かな？" />
      <div className="grid gap-4 mt-8">
        {options.map((option) => (
          <QuestionCard key={option.id} onClick={() => onAnswer(option.id)} icon={option.icon}>
            {option.label}
          </QuestionCard>
        ))}
      </div>
    </motion.div>
  )
}

