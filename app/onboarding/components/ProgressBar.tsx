"use client"

import type React from "react"

interface ProgressBarProps {
  current: number
  total: number
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = (current / total) * 100

  return (
    <div className="w-full h-3 bg-gray-200 rounded-full mb-8">
      <div
        className="h-full bg-[#58CC02] rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default ProgressBar

