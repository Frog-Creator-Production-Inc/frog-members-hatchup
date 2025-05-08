"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, MapPin, Clock, Calendar, DollarSign, BookOpen,
  Filter, SortDesc, Grid, List, Table as TableIcon, X, 
  School, ImageOff, ChevronDown, ChevronUp 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getGoalLocations } from "@/lib/supabase/queries"
import type { GoalLocation } from "@/types/supabase"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import Image from "next/image"
import CourseTable from "./course-table"
import CourseCards from "./course-cards"
import CourseList from "./course-list"

interface SchoolPhoto {
  id: string
  url: string
  description: string
}

interface Course {
  id: string
  name: string
  category?: string
  schools?: {
    id: string
    name: string
    logo_url?: string
    school_photos?: SchoolPhoto[]
    goal_locations?: {
      id: string
      city: string
      country: string
    }
  }
  total_weeks?: number
  tuition_and_others?: number
  is_favorite?: boolean
  intake_dates?: IntakeDate[]
}

interface IntakeDate {
  id: string
  course_id: string
  month: number
  day?: number | null
  year?: number | null
  is_tentative: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

interface EnhancedCourseSearchProps {
  userId: string
  selectedCategory?: string
  initialCourses: Course[]
  favoriteCourseIds: string[]
  categories: string[]
}

// ランダムな要素を配列から取得する関数
function getRandomItem<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export default function EnhancedCourseSearch({
  userId,
  selectedCategory,
  initialCourses,
  favoriteCourseIds = [],
  categories
}: EnhancedCourseSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [locations, setLocations] = useState<GoalLocation[]>([])
  const [loading, setLoading] = useState(true)
  
  // 新しいフィルター状態
  const [view, setView] = useState<"table" | "card" | "list">("card")
  const [sortBy, setSortBy] = useState<string>("name_asc")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    categories: selectedCategory ? [selectedCategory] : [],
    durationRange: [0, 400], // 週数の上限を400週に変更
    costRange: [0, 70000], // ドル
    jobPermit: false
  })

  // デバッグ用ログ
  useEffect(() => {
    console.log("Initial courses:", initialCourses);
    console.log("Initial filters:", {
      selectedCategory,
      filters,
      selectedLocation,
      searchTerm
    });
  }, [initialCourses, selectedCategory, filters, selectedLocation, searchTerm]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true)
        const locationsData = await getGoalLocations()
        setLocations(locationsData)
      } catch (error) {
        console.error("ロケーションデータの読み込みに失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [])

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId)
    if (locationId === "all") {
      setSelectedLocation("")
    }
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    
    const sortedCourses = [...courses]
    switch (value) {
      case "price_asc":
        sortedCourses.sort((a, b) => {
          if (!a.tuition_and_others) return 1
          if (!b.tuition_and_others) return -1
          return a.tuition_and_others - b.tuition_and_others
        })
        break
      case "price_desc":
        sortedCourses.sort((a, b) => {
          if (!a.tuition_and_others) return 1
          if (!b.tuition_and_others) return -1
          return b.tuition_and_others - a.tuition_and_others
        })
        break
      case "duration_asc":
        sortedCourses.sort((a, b) => {
          if (!a.total_weeks) return 1
          if (!b.total_weeks) return -1
          return a.total_weeks - b.total_weeks
        })
        break
      case "duration_desc":
        sortedCourses.sort((a, b) => {
          if (!a.total_weeks) return 1
          if (!b.total_weeks) return -1
          return b.total_weeks - a.total_weeks
        })
        break
      case "name_desc":
        sortedCourses.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "name_asc":
      default:
        sortedCourses.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    setCourses(sortedCourses)
  }

  const handleCategoryFilter = (category: string, checked: boolean) => {
    if (checked) {
      setFilters({
        ...filters,
        categories: [...filters.categories, category]
      })
    } else {
      setFilters({
        ...filters,
        categories: filters.categories.filter(c => c !== category)
      })
    }
  }

  const handleResetFilters = () => {
    setFilters({
      categories: [],
      durationRange: [0, 400],
      costRange: [0, 70000],
      jobPermit: false
    })
    setSearchTerm("")
    setSelectedLocation("")
  }

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case "category":
        if (value) {
          setFilters({
            ...filters,
            categories: filters.categories.filter(c => c !== value)
          })
        }
        break
      case "duration":
        setFilters({
          ...filters,
          durationRange: [0, 400]
        })
        break
      case "cost":
        setFilters({
          ...filters,
          costRange: [0, 70000]
        })
        break
      case "jobPermit":
        setFilters({
          ...filters,
          jobPermit: false
        })
        break
      case "search":
        setSearchTerm("")
        break
      case "location":
        setSelectedLocation("")
        break
    }
  }

  const filteredCourses = courses.filter((course) => {
    // デバッグログ：各コースの処理開始
    console.log('Processing course for filtering:', {
      id: course.id,
      name: course.name,
      category: course.category,
      total_weeks: course.total_weeks,
      tuition_and_others: course.tuition_and_others,
      tuition_type: typeof course.tuition_and_others,
      tuition_raw: course.tuition_and_others,
      school: course.schools?.name,
      location: course.schools?.goal_locations
    });

    // 検索キーワードによるフィルタリング
    const matchesSearch = 
      searchTerm === "" ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.schools?.name && course.schools.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.schools?.goal_locations?.city && course.schools.goal_locations.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.schools?.goal_locations?.country && course.schools.goal_locations.country.toLowerCase().includes(searchTerm.toLowerCase()))

    // カテゴリーによるフィルタリング
    const matchesCategories = 
      filters.categories.length === 0 || 
      (course.category && filters.categories.includes(course.category))

    // 地域によるフィルタリング
    const matchesLocation =
      !selectedLocation ||
      selectedLocation === "all" ||
      (course.schools?.goal_locations?.id && course.schools.goal_locations.id === selectedLocation)

    // 期間によるフィルタリング
    const matchesDuration = 
      !course.total_weeks || 
      (course.total_weeks >= filters.durationRange[0] && course.total_weeks <= filters.durationRange[1])

    // 費用によるフィルタリング - CSVデータの形式の違いに対応
    let costValue = 0;
    if (course.tuition_and_others !== undefined && course.tuition_and_others !== null) {
      // 異なる形式に対応する処理
      if (typeof course.tuition_and_others === 'number') {
        // すでに数値型の場合はそのまま使用
        costValue = course.tuition_and_others;
      } else {
        // 文字列の場合はカンマを削除して数値に変換
        try {
          const costString = String(course.tuition_and_others).replace(/[^\d.-]/g, '');
          costValue = Number(costString);
        } catch (e) {
          console.error('Cost conversion error:', e);
        }
      }
    }
    
    // コスト変換のデバッグログ
    console.log('Cost conversion:', {
      courseName: course.name,
      raw: course.tuition_and_others,
      type: typeof course.tuition_and_others,
      converted: costValue,
      min: filters.costRange[0],
      max: filters.costRange[1],
      comparison: {
        isGTE: costValue >= filters.costRange[0],
        isLTE: costValue <= filters.costRange[1]
      }
    });

    // コスト条件の評価
    const matchesCost = 
      course.tuition_and_others === undefined || 
      course.tuition_and_others === null ||
      (costValue >= filters.costRange[0] && costValue <= filters.costRange[1])

    // 就労許可フィルターは未実装（データがないため）
    const matchesJobPermit = !filters.jobPermit || true

    // デバッグログ：フィルタリング結果
    console.log('Filter results for course:', {
      name: course.name,
      matchesSearch,
      matchesCategories,
      matchesLocation,
      matchesDuration,
      matchesCost,
      matchesJobPermit,
      filters: {
        searchTerm,
        categories: filters.categories,
        selectedLocation,
        durationRange: filters.durationRange,
        costRange: filters.costRange,
        jobPermit: filters.jobPermit
      }
    });

    return matchesSearch && matchesCategories && matchesLocation && matchesDuration && matchesCost && matchesJobPermit
  })

  // デバッグログ：フィルタリング統計
  useEffect(() => {
    console.log('Filtering statistics:', {
      totalCourses: courses.length,
      filteredCourses: filteredCourses.length,
      filters: {
        searchTerm,
        categories: filters.categories,
        selectedLocation,
        durationRange: filters.durationRange,
        costRange: filters.costRange,
        jobPermit: filters.jobPermit
      },
      courses: courses.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category
      }))
    });
  }, [courses, filteredCourses, searchTerm, filters, selectedLocation]);

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>
  }

  // アクティブなフィルターの数をカウント
  const activeFiltersCount = 
    (filters.categories.length > 0 ? 1 : 0) +
    ((filters.durationRange[0] > 0 || filters.durationRange[1] < 400) ? 1 : 0) +
    ((filters.costRange[0] > 0 || filters.costRange[1] < 70000) ? 1 : 0) +
    (filters.jobPermit ? 1 : 0) +
    (searchTerm !== "" ? 1 : 0) +
    (selectedLocation !== "" && selectedLocation !== "all" ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* 検索・フィルターバー */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="コース名、学校名、キーワードで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-200"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="地域を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての地域</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.city}, {location.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant={showFilters ? "default" : "outline"} 
              className="flex gap-2 items-center h-10"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              フィルター
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">名前順（A-Z）</SelectItem>
                <SelectItem value="name_desc">名前順（Z-A）</SelectItem>
                <SelectItem value="price_asc">価格順（安い順）</SelectItem>
                <SelectItem value="price_desc">価格順（高い順）</SelectItem>
                <SelectItem value="duration_asc">期間順（短い順）</SelectItem>
                <SelectItem value="duration_desc">期間順（長い順）</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:flex border rounded-lg overflow-hidden h-10">
              <Button 
                variant={view === "card" ? "default" : "ghost"} 
                size="icon"
                onClick={() => setView("card")}
                className="rounded-none border-0 h-10 w-10"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
                className="rounded-none border-0 h-10 w-10"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={view === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("table")}
                className="rounded-none border-0 h-10 w-10"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* フィルターパネル */}
        {showFilters && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* カテゴリーフィルター */}
              <div>
                <h3 className="font-medium mb-3 text-sm text-gray-700">カテゴリー</h3>
                <ScrollArea className="h-[180px] pr-4">
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center gap-2">
                        <Checkbox 
                          id={`cat-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={(checked) => handleCategoryFilter(category, !!checked)}
                        />
                        <label 
                          htmlFor={`cat-${category}`} 
                          className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* 期間フィルター */}
              <div>
                <h3 className="font-medium text-sm text-gray-700">期間（週）</h3>
                <div className="px-2 py-4">
                  <div className="flex justify-between gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={0}
                        max={filters.durationRange[1]}
                        value={filters.durationRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value <= filters.durationRange[1]) {
                            setFilters({
                              ...filters, 
                              durationRange: [value, filters.durationRange[1]]
                            });
                          }
                        }}
                        className="h-10 text-center pl-2 pr-8 rounded-md border-gray-200"
                        placeholder="最小"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">週</span>
                    </div>
                    <span className="text-gray-400 flex items-center">〜</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={filters.durationRange[0]}
                        max={400}
                        value={filters.durationRange[1]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= filters.durationRange[0]) {
                            setFilters({
                              ...filters, 
                              durationRange: [filters.durationRange[0], value]
                            });
                          }
                        }}
                        className="h-10 text-center pl-2 pr-8 rounded-md border-gray-200"
                        placeholder="最大"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">週</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>最短: 0週</span>
                    <span>最長: 400週</span>
                  </div>
                </div>
              </div>
              
              {/* 費用フィルター */}
              <div>
                <h3 className="font-medium text-sm text-gray-700">費用（カナダドル）</h3>
                <div className="px-2 py-4">
                  <div className="flex justify-between gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={0}
                        max={filters.costRange[1]}
                        value={filters.costRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value <= filters.costRange[1]) {
                            setFilters({
                              ...filters, 
                              costRange: [value, filters.costRange[1]]
                            });
                          }
                        }}
                        className="h-10 text-center pl-12 rounded-md border-gray-200"
                        placeholder="最小"
                      />
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">CA$</span>
                    </div>
                    <span className="text-gray-400 flex items-center">〜</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={filters.costRange[0]}
                        max={70000}
                        value={filters.costRange[1]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= filters.costRange[0]) {
                            setFilters({
                              ...filters, 
                              costRange: [filters.costRange[0], value]
                            });
                          }
                        }}
                        className="h-10 text-center pl-12 rounded-md border-gray-200"
                        placeholder="最大"
                      />
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">CA$</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>最低: CA$0</span>
                    <span>最高: CA$30,000</span>
                  </div>
                </div>
              </div>
              
              {/* その他のフィルター */}
              <div>
                <h3 className="font-medium mb-3 text-sm text-gray-700">その他の条件</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="job-permit"
                      checked={filters.jobPermit}
                      onCheckedChange={(checked) => 
                        setFilters({...filters, jobPermit: !!checked})
                      }
                    />
                    <label 
                      htmlFor="job-permit" 
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      就労許可あり
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* フィルターアクション */}
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetFilters}
              >
                すべてリセット
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                フィルターを適用
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* アクティブフィルター表示 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-500 mr-1">フィルター:</span>
          
          {filters.categories.map(cat => (
            <Badge key={cat} variant="outline" className="flex items-center gap-1 bg-white">
              {cat}
              <button 
                onClick={() => removeFilter("category", cat)}
                className="ml-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {(filters.durationRange[0] > 0 || filters.durationRange[1] < 400) && (
            <Badge variant="outline" className="flex items-center gap-1 bg-white">
              期間: {filters.durationRange[0]}～{filters.durationRange[1]}週
              <button 
                onClick={() => removeFilter("duration")}
                className="ml-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(filters.costRange[0] > 0 || filters.costRange[1] < 70000) && (
            <Badge variant="outline" className="flex items-center gap-1 bg-white">
              費用: CA${filters.costRange[0].toLocaleString()}～{filters.costRange[1].toLocaleString()}
              <button 
                onClick={() => removeFilter("cost")}
                className="ml-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.jobPermit && (
            <Badge variant="outline" className="flex items-center gap-1 bg-white">
              就労許可あり
              <button 
                onClick={() => removeFilter("jobPermit")}
                className="ml-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {searchTerm && (
            <Badge variant="outline" className="flex items-center gap-1 bg-white">
              検索: {searchTerm}
              <button 
                onClick={() => removeFilter("search")}
                className="ml-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedLocation && selectedLocation !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1 bg-white">
              地域: {locations.find(l => l.id === selectedLocation)?.city || selectedLocation}
              <button 
                onClick={() => removeFilter("location")}
                className="ml-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
      
      {/* 結果カウンター */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {filteredCourses.length}件のコースが見つかりました
        </div>
      </div>
      
      {/* コンテンツ表示領域 */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-8 text-center">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-gray-100 p-3 rounded-full mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">コースが見つかりませんでした</h2>
            <p className="text-muted-foreground mb-4">検索条件を変更してもう一度お試しください。</p>
            <Button variant="outline" onClick={handleResetFilters}>
              フィルターをリセット
            </Button>
          </div>
        </div>
      ) : (
        <>
          {view === "card" && (
            <CourseCards courses={filteredCourses} />
          )}
          
          {view === "list" && (
            <CourseList courses={filteredCourses} />
          )}
          
          {view === "table" && (
            <CourseTable courses={filteredCourses} />
          )}
        </>
      )}
    </div>
  )
} 