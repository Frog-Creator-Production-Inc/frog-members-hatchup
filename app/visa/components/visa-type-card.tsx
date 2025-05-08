"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Plus, ChevronDown, ExternalLink } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Requirement {
  id: string
  description: string
  additional_info?: string
  order_index: number
}

interface VisaTypeCardProps {
  visa: {
    id: string
    name: string
    description: string
    average_processing_time: number
    requirements?: Requirement[]
    link?: string
  }
  onDrop: () => void
  disabled?: boolean
}

export function VisaTypeCard({ visa, onDrop, disabled = false }: VisaTypeCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // クライアントサイドでのみレンダリングするために使用
  useEffect(() => {
    setMounted(true)
  }, [visa])

  // HTMLをプレーンテキストに変換する関数
  const stripHtml = (html: string) => {
    if (!mounted) return ""
    const tmp = document.createElement("DIV")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  // 要件を表示順でソート
  const sortedRequirements = visa.requirements 
    ? [...visa.requirements].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : []

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CardTitle className="text-lg">{visa.name}</CardTitle>
            </div>
            <Button
              variant="default"
              size="icon"
              onClick={onDrop}
              className="h-8 w-8"
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 常に表示される基本情報 */}
          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>処理期間: {visa.average_processing_time || 0}日</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>
                必要書類: {sortedRequirements.length}点
              </span>
            </div>
          </div>

          {/* 開閉式の詳細情報 */}
          <CollapsibleContent>
            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{visa.description}</p>
              
              {mounted && sortedRequirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">必要書類</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                    {sortedRequirements.map((req) => (
                      <li key={req.id} className="pl-2">
                        <div dangerouslySetInnerHTML={{ __html: req.description }} />
                        {req.additional_info && (
                          <p className="text-xs text-gray-500 mt-1 ml-5">
                            {req.additional_info}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {visa.link && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={visa.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    詳細情報を見る
                  </a>
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}
