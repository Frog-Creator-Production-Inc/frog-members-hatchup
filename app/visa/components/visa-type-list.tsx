"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

interface VisaTypeListProps {
  visaTypes: VisaType[]
  onDrop: (visaTypeId: string) => void
}

export function VisaTypeList({ visaTypes, onDrop }: VisaTypeListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState<string[]>([])

  // カテゴリーでフィルタリング
  const toggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category))
    } else {
      setCategories([...categories, category])
    }
  }

  // 利用可能なすべてのカテゴリーを取得
  const allCategories = Array.from(new Set(visaTypes.map((visa) => visa.category)))

  // ビザタイプをフィルタリング
  const filteredVisaTypes = visaTypes.filter((visa) => {
    const matchesSearch = 
      visa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visa.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categories.length === 0 || categories.includes(visa.category)
    
    return matchesSearch && matchesCategory
  })

  // ビザタイプをクリックして追加する処理
  const handleAddVisa = (visaTypeId: string) => {
    onDrop(visaTypeId)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ビザを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allCategories.map((category) => (
            <Badge
              key={category}
              variant={categories.includes(category) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredVisaTypes.map((visa) => (
          <Card
            key={visa.id}
            className="hover:bg-accent/50 transition-colors relative"
          >
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sm">{visa.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {visa.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="whitespace-nowrap">
                    {visa.average_processing_time}ヶ月
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    onClick={() => handleAddVisa(visa.id)}
                    title="ビザプランに追加"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredVisaTypes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            該当するビザが見つかりませんでした
          </div>
        )}
      </div>
    </div>
  )
}