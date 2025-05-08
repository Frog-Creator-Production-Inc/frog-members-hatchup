"use client"

import { motion } from "framer-motion"
import { Signal } from "lucide-react"
import { QuestionCard } from "../question-card"
import { MascotBubble } from "../mascot-bubble"
import { Progress } from "@/components/ui/progress"
import { useEffect } from "react"

const options = [
  { id: "beginner", label: "英語をはじめて学ぶ", icon: Signal },
  { id: "basic", label: "一般的な単語を知っている", icon: Signal },
  { id: "intermediate", label: "簡単な会話ができる", icon: Signal },
  { id: "advanced", label: "さまざまなトピックについて話せる", icon: Signal },
  { id: "fluent", label: "大抵のトピックについて詳細に話せる", icon: Signal },
]

interface EnglishLevelQuestionProps {
  onAnswer: (answer: string) => void
  progress: number
}

export function EnglishLevelQuestion({ onAnswer, progress }: EnglishLevelQuestionProps) {
  const handleClick = (answerId: string) => {
    console.log("EnglishLevelQuestion: handleClick called with:", answerId)
    console.log("onAnswer type:", typeof onAnswer)
    if (typeof onAnswer === "function") {
      onAnswer(answerId)
    } else {
      console.error("onAnswer is not a function:", onAnswer)
    }
  }

  useEffect(() => {
    console.log("EnglishLevelQuestion mounted")
    return () => {
      console.log("EnglishLevelQuestion unmounted")
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <Progress value={progress} className="w-full h-2 mb-8" />
      <MascotBubble message="英語力はどのくらいある？" />
      <div className="grid gap-4 mt-8">
        {options.map((option) => (
          <QuestionCard key={option.id} onClick={() => handleClick(option.id)} icon={option.icon}>
            {option.label}
          </QuestionCard>
        ))}
      </div>
    </motion.div>
  )
}

