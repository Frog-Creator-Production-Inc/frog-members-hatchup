"use client"

import React from "react"
import { CheckCircle, Clock, PenLine, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface VisaStepProgressProps {
  currentStep: number
}

export function VisaStepProgress({ currentStep }: VisaStepProgressProps) {
  const steps = [
    {
      id: 1,
      name: "コース選択",
      description: "カレッジのコースを選んで申し込む",
      icon: currentStep > 1 ? CheckCircle : Clock,
      status: currentStep > 1 ? "complete" : "current",
    },
    {
      id: 2,
      name: "ビザプラン作成",
      description: "管理者があなたに合ったビザプランを作成",
      icon: currentStep > 2 ? CheckCircle : currentStep === 2 ? Clock : AlertTriangle,
      status: currentStep > 2 ? "complete" : currentStep === 2 ? "current" : "upcoming",
    },
    {
      id: 3,
      name: "ビザプラン確認・質問",
      description: "管理者との相談や質問",
      icon: currentStep === 3 ? PenLine : AlertTriangle,
      status: currentStep === 3 ? "current" : "upcoming",
    },
  ]

  // ステップの進行度を計算（0～100%）
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="w-full space-y-8">
      {/* プログレスバー */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden w-full">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/80 to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* ステップ表示 */}
      <div className="relative flex items-start">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step indicator */}
            <div className="relative flex flex-col items-center text-center flex-1">
              {/* ステップ番号とアイコンの円 */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ 
                  scale: step.status === "current" ? 1.1 : 1,
                  opacity: 1
                }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div
                  className={cn(
                    "relative w-14 h-14 flex items-center justify-center rounded-full z-10 border-2 shadow-sm transition-all duration-300",
                    {
                      "bg-primary border-primary text-white": step.status === "current",
                      "bg-green-50 border-green-500 text-green-600": step.status === "complete",
                      "bg-gray-50 border-gray-200 text-gray-400": step.status === "upcoming",
                    }
                  )}
                >
                  <step.icon className="h-6 w-6" />
                  
                  {/* 現在のステップに輝きエフェクト */}
                  {step.status === "current" && (
                    <motion.div
                      className="absolute -inset-1 rounded-full bg-primary/20"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 0.3, 0.7]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  )}
                  
                  {/* ステップ番号 */}
                  <div 
                    className={cn(
                      "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
                      {
                        "bg-primary text-white border-white": step.status === "current",
                        "bg-green-500 text-white border-white": step.status === "complete",
                        "bg-gray-100 text-gray-500 border-gray-200": step.status === "upcoming",
                      }
                    )}
                  >
                    {step.id}
                  </div>
                </div>
              </motion.div>
              
              {/* ステップ名と説明 */}
              <div className="mt-4 w-full px-2">
                <p
                  className={cn("font-medium text-sm", {
                    "text-primary": step.status === "current",
                    "text-green-600": step.status === "complete",
                    "text-gray-500": step.status === "upcoming",
                  })}
                >
                  {step.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex items-center self-center h-14 mx-2 relative">
                <div
                  className={cn("h-0.5 w-full min-w-[40px] flex-grow relative", {
                    "bg-green-500": currentStep > index + 1,
                    "bg-gray-200": currentStep <= index + 1,
                  })}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
} 