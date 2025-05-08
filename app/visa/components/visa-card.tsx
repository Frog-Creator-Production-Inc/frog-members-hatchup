"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Clock, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Requirement {
  id: string
  description: string
  additional_info?: string
  order_index: number
}

interface VisaType {
  id: string
  name: string
  category: string
  description: string
  average_processing_time: number
  requirements?: Requirement[]
  link?: string
}

interface VisaCardProps {
  visa: VisaType
  notes?: string
  adminMemo?: string | null
  onNotesChange?: (notes: string) => void
  onAdminMemoChange?: (memo: string) => void
  isAdmin?: boolean
  readOnly?: boolean
}

export function VisaCard({ 
  visa, 
  notes = "", 
  adminMemo = null,
  onNotesChange,
  onAdminMemoChange,
  isAdmin = false,
  readOnly = false
}: VisaCardProps) {
  const [expanded, setExpanded] = useState(false)

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onNotesChange) {
      onNotesChange(e.target.value)
    }
  }

  const handleAdminMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onAdminMemoChange) {
      onAdminMemoChange(e.target.value)
    }
  }

  return (
    <Card className={cn("transition-all", expanded ? "shadow-md" : "")}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{visa.name}</CardTitle>
            <CardDescription className="mt-1">{visa.category}</CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            <Clock className="h-3 w-3 mr-1" />
            {visa.average_processing_time}ヶ月
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">{visa.description}</p>
        
        {expanded && visa.requirements && visa.requirements.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">必要書類</h4>
            <div className="space-y-3">
              {visa.requirements.sort((a, b) => a.order_index - b.order_index).map((req) => (
                <div key={req.id} className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-700">{req.description}</div>
                    {req.additional_info && (
                      <p className="text-xs text-gray-500 mt-1">
                        {req.additional_info}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expanded && visa.link && (
          <div className="mt-4">
            <a 
              href={visa.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              詳細情報を見る
            </a>
          </div>
        )}

        {expanded && (
          <div className="mt-4 space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-1">メモ</h4>
              <Textarea
                placeholder={readOnly ? "メモはありません" : "メモを入力してください"}
                value={notes}
                onChange={handleNotesChange}
                className="min-h-[80px] text-sm"
                readOnly={readOnly}
              />
            </div>

            {isAdmin && (
              <div>
                <h4 className="text-sm font-medium mb-1">管理者メモ</h4>
                <Textarea
                  placeholder="管理者メモを入力してください"
                  value={adminMemo || ""}
                  onChange={handleAdminMemoChange}
                  className="min-h-[80px] text-sm bg-muted/50"
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full flex items-center justify-center"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span>閉じる</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              <span>詳細を見る</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}