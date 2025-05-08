import { TypeIcon as type, type LucideIcon } from "lucide-react"

interface QuestionCardProps {
  children: React.ReactNode
  onClick: () => void
  icon?: LucideIcon
}

export function QuestionCard({ children, onClick, icon: Icon }: QuestionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-4 hover:bg-primary/5"
    >
      {Icon && <Icon className="h-5 w-5 text-primary flex-shrink-0" />}
      <span className="text-gray-700">{children}</span>
    </button>
  )
}

