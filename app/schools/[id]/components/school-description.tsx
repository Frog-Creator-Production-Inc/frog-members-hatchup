import { FileText } from "lucide-react"

interface SchoolDescriptionProps {
  description: string | null
}

export default function SchoolDescription({ description }: SchoolDescriptionProps) {
  if (!description) {
    return (
      <p className="text-muted-foreground">学校の概要情報はありません。</p>
    )
  }

  return (
    <div className="prose prose-sm max-w-none">
      {description.split('\n').map((paragraph, index) => (
        <p key={index} className="text-gray-600 mb-4 last:mb-0">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

