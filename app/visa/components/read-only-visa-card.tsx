"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Briefcase, Calendar, CheckCircle, ChevronDown, ChevronUp, Clock, ExternalLink, FileText, Globe, GraduationCap, Home, Info, MessageSquare, Plane, Users } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface VisaType {
  id: string
  name: string
  category: string
  description: string
  average_processing_time: number
  requirements?: {
    id: string
    description: string
    additional_info?: string
    order_index: number
  }[]
  link?: string
}

interface ReadOnlyVisaCardProps {
  visa: VisaType
  notes: string
  adminMemo: string | null
  onNotesChange: (notes: string) => void
}

export function ReadOnlyVisaCard({ visa, notes, adminMemo, onNotesChange }: ReadOnlyVisaCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(notes)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSave = () => {
    onNotesChange(editedNotes)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedNotes(notes)
    setIsEditing(false)
  }

  // カテゴリーに基づいてアイコンを選択
  const getCategoryIcon = () => {
    switch (visa.category) {
      case "student":
        return GraduationCap
      case "work":
        return Briefcase
      case "visitor":
        return Plane
      case "permanent":
        return Home
      default:
        return Globe
    }
  }

  // カテゴリの日本語名を取得
  const getCategoryName = () => {
    const categoryMap: Record<string, string> = {
      "student": "学生ビザ",
      "work": "就労ビザ",
      "visitor": "観光ビザ",
      "permanent": "永住権",
    }
    return categoryMap[visa.category] || "その他"
  }

  const Icon = getCategoryIcon()
  const categoryName = getCategoryName()

  return (
    <div className={cn(
      "rounded-xl overflow-hidden border border-gray-200 transition-all duration-300",
      isExpanded ? "shadow-md" : "shadow-sm hover:shadow"
    )}>
      {/* ヘッダー部分 */}
      <div className="bg-white p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{visa.name}</h3>
              <Badge variant="outline" className="mt-1 text-xs font-normal">
                {categoryName}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-gray-600 text-sm">{visa.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
            <span>処理期間: {visa.average_processing_time}日</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-1.5 text-gray-500" />
            <span>必要書類: {visa.requirements?.length || 0}点</span>
          </div>
          {visa.link && (
            <a
              href={visa.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              <span>詳細情報</span>
            </a>
          )}
        </div>
      </div>

      {/* 展開部分 */}
      {isExpanded && (
        <div className="px-5 pb-5 bg-gray-50 border-t border-gray-200">
          {/* 管理者からのメモ */}
          {adminMemo && (
            <div className="mt-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium text-gray-700">管理者からのメモ</h4>
              </div>
              <div className="bg-white p-3 rounded-md border border-primary/20 text-sm text-gray-700">
                {adminMemo}
              </div>
            </div>
          )}

          {/* 必要書類リスト */}
          {visa.requirements && visa.requirements.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium text-gray-700">必要書類</h4>
              </div>
              <div className="bg-white rounded-md border border-gray-200 divide-y divide-gray-100">
                {visa.requirements
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((req) => (
                    <div key={req.id} className="p-3">
                      <div className="flex gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-700 font-medium">{req.description}</div>
                          {req.additional_info && (
                            <p className="text-xs text-gray-500 mt-1">
                              {req.additional_info}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ユーザーノート */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium text-gray-700">あなたのメモ</h4>
              </div>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="h-7 text-xs"
                >
                  編集
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="このビザについてのメモを残すことができます..."
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    className="h-8 text-xs"
                  >
                    キャンセル
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    className="h-8 text-xs"
                  >
                    保存
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-md border border-gray-200 min-h-[60px] text-sm text-gray-700">
                {notes || <span className="text-gray-400 italic">メモはありません。「編集」をクリックして追加できます。</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 