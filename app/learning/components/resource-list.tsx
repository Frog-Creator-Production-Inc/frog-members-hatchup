"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ExternalLink, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

interface Resource {
  id: string
  title: string
  description: string | null
  url: string
  type: "document" | "link" | "tool"
}

interface ResourceListProps {
  resources: Resource[]
}

export function ResourceList({ resources }: ResourceListProps) {
  if (!resources || resources.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case "document":
        return FileText
      case "tool":
        return Wrench
      default:
        return ExternalLink
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "document":
        return "ドキュメント"
      case "tool":
        return "ツール"
      default:
        return "リンク"
    }
  }

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          関連リソース
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {resources.map((resource) => {
            const Icon = getIcon(resource.type)
            return (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  "hover:bg-primary/5 transition-colors",
                  "group relative"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      {getTypeLabel(resource.type)}
                    </span>
                  </div>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {resource.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
