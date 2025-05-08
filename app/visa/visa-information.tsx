"use client"

import React, { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Clock, FileText, ExternalLink, Users, Briefcase, GraduationCap, Home, Plane, Info, ArrowUpRight, CheckCircle, Filter, Search, ArrowDown, ArrowUp, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  order_index?: number
}

// カテゴリーの表示名と順序の定義
const CATEGORY_CONFIG = {
  student: { 
    name: "学生ビザ", 
    order: 1, 
    icon: GraduationCap,
    description: "教育機関での学習を目的としたビザです。"
  },
  visitor: { 
    name: "観光ビザ", 
    order: 2, 
    icon: Plane,
    description: "短期間の滞在や観光を目的としたビザです。"
  },
  work: { 
    name: "就労ビザ", 
    order: 3, 
    icon: Briefcase,
    description: "就労目的の滞在を認めるビザです。"
  },
  permanent: { 
    name: "永住権", 
    order: 4, 
    icon: Home,
    description: "永続的な滞在を認める資格です。"
  }
} as const

export default function VisaInformation() {
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
  const [loading, setLoading] = useState(true)
  const [visaCategories, setVisaCategories] = useState<Record<string, VisaType[]>>({})
  const [expandedVisa, setExpandedVisa] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [sortBy, setSortBy] = useState<"name" | "processing_time">("name")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchVisaTypes = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("visa_types")
          .select(`
            *,
            requirements:visa_requirements!visa_requirements_visa_type_id_fkey(*)
          `)
          .order("order_index", { ascending: true })

        if (error) {
          throw error
        }

        if (data) {
          setVisaTypes(data)
          
          // カテゴリごとにビザタイプを分類
          const categories = data.reduce((acc, visa) => {
            let displayName = "その他"
            
            if (visa.category && visa.category in CATEGORY_CONFIG) {
              const categoryKey = visa.category as keyof typeof CATEGORY_CONFIG
              displayName = CATEGORY_CONFIG[categoryKey].name
            }
            
            if (!acc[displayName]) {
              acc[displayName] = []
            }
            acc[displayName].push(visa)
            return acc
          }, {} as Record<string, VisaType[]>)
          
          setVisaCategories(categories)
        }
      } catch (error) {
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    fetchVisaTypes()
  }, [supabase])

  // カテゴリごとのアイコンを取得する関数
  const getCategoryIcon = (category: string) => {
    const categoryKey = Object.keys(CATEGORY_CONFIG).find(
      key => CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG].name === category
    ) as keyof typeof CATEGORY_CONFIG | undefined
    
    return categoryKey ? CATEGORY_CONFIG[categoryKey].icon : Users
  }

  const toggleExpand = (visaId: string) => {
    if (expandedVisa === visaId) {
      setExpandedVisa(null)
    } else {
      setExpandedVisa(visaId)
    }
  }

  // ビザをフィルタリングおよびソートする
  const getFilteredAndSortedVisas = (visas: VisaType[]) => {
    // 検索フィルタリング
    let filtered = [...visas]
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(visa => 
        visa.name.toLowerCase().includes(query) || 
        visa.description.toLowerCase().includes(query)
      )
    }
    
    // カテゴリフィルタリング
    if (filterCategory !== "all") {
      filtered = filtered.filter(visa => {
        const categoryKey = Object.keys(CATEGORY_CONFIG).find(
          key => CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG].name === filterCategory
        )
        return visa.category === categoryKey
      })
    }
    
    // ソート
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name)
      } else {
        const timeA = a.average_processing_time || 0
        const timeB = b.average_processing_time || 0
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA
      }
    })
    
    return filtered
  }

  // ビザカードコンポーネント
  const VisaCard = ({ visa, category }: { visa: VisaType, category: string }) => {
    const Icon = getCategoryIcon(category);
    
    return (
      <div 
        className={cn(
          "relative flex flex-col rounded-xl bg-white transition-all duration-300 cursor-pointer overflow-hidden",
          expandedVisa === visa.id 
            ? "shadow-md border-primary/20 border" 
            : "shadow-sm hover:shadow-md border border-gray-100"
        )}
        onClick={() => toggleExpand(visa.id)}
      >
        <div className="relative z-10 p-5">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mr-4">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-800 group-hover:text-gray-900">{visa.name}</h4>
              <Badge variant="outline" className="mt-1 text-xs font-normal">
                {category}
              </Badge>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {visa.description}
          </p>
          
          <div className="flex flex-wrap gap-4 mt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{visa.average_processing_time ? `${visa.average_processing_time}日` : "申請期間なし"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>申請から許可までの平均処理期間</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>書類: {visa.requirements?.length || 0}点</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>必要書類の数</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {expandedVisa === visa.id && visa.requirements && visa.requirements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
              <h5 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                必要書類
              </h5>
              <div className="space-y-3">
                {[...visa.requirements]
                  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                  .map((req) => (
                    <div key={req.id} className="flex gap-2 border-b border-gray-50 pb-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
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
          
          {visa.link && (
            <a 
              href={visa.link} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation(); // カードのクリックイベントが発火しないようにする
              }}
              className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 text-sm font-medium text-primary hover:text-white bg-primary/5 hover:bg-primary rounded-md transition-colors duration-200"
            >
              詳細情報
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
        
        {/* 装飾的な背景エフェクト */}
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mb-8 blur-2xl transition-all duration-500"></div>
        <div className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 bg-primary/5 rounded-full transition-all duration-500", 
          expandedVisa === visa.id ? "w-[500px] h-[500px] -bottom-[400px] blur-md" : ""
        )}></div>
      </div>
    );
  };

  // カテゴリカードコンポーネント
  const CategoryCard = ({ category, description, icon: Icon }: { 
    category: string; 
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{category}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-12">
      {/* ビザ概要セクション */}
      <Card className="bg-white shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            ビザとは
          </CardTitle>
          <CardDescription>ビザの基本情報と申請に関する重要な情報をご確認ください</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-gray-600">
            ビザ（査証）は、外国に入国・滞在するための許可証です。
            国によって異なる種類のビザがあり、それぞれ滞在目的や期間、
            活動内容に応じた条件が設定されています。
          </p>
          
          <div>
            <h3 className="text-xl font-medium mb-4 text-gray-700">ビザ申請の基本</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>申請は通常、渡航前に行います</li>
              <li>申請先は渡航先国の大使館や領事館です</li>
              <li>必要書類や審査期間は国やビザの種類によって異なります</li>
              <li>申請料金が必要な場合がほとんどです</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">
                ビザの申請は複雑なプロセスを含むことがあります。
                専門家のアドバイスを受けることをお勧めします。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリセクション */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">ビザのカテゴリ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(CATEGORY_CONFIG).map(([key, value]) => (
            <div
              key={key}
              onClick={() => setFilterCategory(value.name)}
              className={cn(filterCategory === value.name && "ring-2 ring-primary ring-offset-2")}
            >
              <CategoryCard 
                category={value.name} 
                description={value.description}
                icon={value.icon}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ビザの種類セクション */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">ビザの種類</h2>
          
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ビザタイプを検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Select 
                value={filterCategory} 
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="カテゴリで絞り込み" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのカテゴリ</SelectItem>
                  {Object.values(CATEGORY_CONFIG).map(config => (
                    <SelectItem key={config.name} value={config.name}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "name" | "processing_time")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="並び替え" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">名前順</SelectItem>
                  <SelectItem value="processing_time">処理期間順</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="h-10 w-10"
              >
                {sortOrder === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(visaCategories)
              .sort(([a], [b]) => {
                const aOrder = Object.values(CATEGORY_CONFIG).find(c => c.name === a)?.order || 999
                const bOrder = Object.values(CATEGORY_CONFIG).find(c => c.name === b)?.order || 999
                return aOrder - bOrder
              })
              .filter(([category]) => {
                if (filterCategory === "all") return true
                return category === filterCategory
              })
              .map(([category, visas]) => {
                const filteredVisas = getFilteredAndSortedVisas(visas)
                
                if (filteredVisas.length === 0) return null
                
                return (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        {React.createElement(getCategoryIcon(category), { className: "h-5 w-5 text-primary" })}
                      </div>
                      <h3 className="text-xl font-medium text-gray-800">{category}</h3>
                      <Badge variant="outline" className="ml-2">
                        {filteredVisas.length}件
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVisas.map((visa) => (
                        <VisaCard
                          key={visa.id}
                          visa={visa}
                          category={category}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
        
        {/* 検索結果がない場合 */}
        {!loading && 
          Object.values(visaCategories).flat().filter(visa => 
            visa.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            visa.description.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">検索結果がありません</h3>
            <p className="text-gray-500">
              「{searchQuery}」に一致するビザ情報は見つかりませんでした。
              <br />
              検索キーワードを変更するか、フィルターをリセットしてください。
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("")
                setFilterCategory("all")
              }}
            >
              フィルターをリセット
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

