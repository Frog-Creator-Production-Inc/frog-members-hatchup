"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpDown, Plus, School, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Course {
  id: string
  name: string
  category: string
  total_weeks: number
  tuition_and_others: number
  updated_at: string
  schools: {
    id: string
    name: string
  }
}

interface Props {
  courses: Course[]
  schools: { id: string; name: string }[]
  categories: string[]
}

export function CourseList({ courses: initialCourses, schools, categories }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchool, setSelectedSchool] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Course | "schools.name"
    direction: "asc" | "desc"
  }>({ key: "updated_at", direction: "desc" })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const sortedAndFilteredCourses = useMemo(() => {
    return initialCourses
      .filter((course) => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.schools.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesSchool = selectedSchool === "all" || course.schools.id === selectedSchool
        const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
        return matchesSearch && matchesSchool && matchesCategory
      })
      .sort((a, b) => {
        if (sortConfig.key === "schools.name") {
          const aValue = a.schools.name
          const bValue = b.schools.name
          return sortConfig.direction === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === null) return 1
        if (bValue === null) return -1
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        return sortConfig.direction === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      })
  }, [initialCourses, searchTerm, selectedSchool, selectedCategory, sortConfig])

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }

  const SortButton = ({ column }: { column: typeof sortConfig.key }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={() => handleSort(column)}
    >
      <ArrowUpDown className="h-4 w-4" />
    </Button>
  )

  // 削除ダイアログを開く
  const openDeleteDialog = (course: Course) => {
    setCourseToDelete(course)
    setIsDeleteDialogOpen(true)
  }

  // コースを削除する
  const deleteCourse = async () => {
    if (!courseToDelete) return
    
    setIsDeleting(true)
    
    try {
      // 1. まず関連する科目を削除
      const { error: subjectsError } = await supabase
        .from("course_subjects")
        .delete()
        .eq("course_id", courseToDelete.id)
      
      if (subjectsError) {
        console.error("科目の削除中にエラーが発生しました:", subjectsError)
        toast.error("科目の削除中にエラーが発生しました")
        return
      }
      
      // 2. 職業ポジションの関連付けを削除
      const { error: jobPositionsError } = await supabase
        .from("course_job_positions")
        .delete()
        .eq("course_id", courseToDelete.id)
      
      if (jobPositionsError) {
        console.error("職業ポジションの関連付け削除中にエラーが発生しました:", jobPositionsError)
        toast.error("職業ポジションの関連付け削除中にエラーが発生しました")
        return
      }
      
      // 3. コース自体を削除
      const { error: courseError } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseToDelete.id)
      
      if (courseError) {
        console.error("コースの削除中にエラーが発生しました:", courseError)
        toast.error("コースの削除中にエラーが発生しました")
        return
      }
      
      toast.success("コースを削除しました")
      router.refresh() // ページを更新して削除を反映
    } catch (error) {
      console.error("削除処理中にエラーが発生しました:", error)
      toast.error("削除処理中にエラーが発生しました")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setCourseToDelete(null)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>コース一覧</CardTitle>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            新規コース登録
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="コース名・学校名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger>
                <SelectValue placeholder="学校で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての学校</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリーで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのカテゴリー</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  コース名
                  <SortButton column="name" />
                </TableHead>
                <TableHead>
                  学校名
                  <SortButton column="schools.name" />
                </TableHead>
                <TableHead>
                  カテゴリー
                  <SortButton column="category" />
                </TableHead>
                <TableHead className="text-right">
                  期間（週）
                  <SortButton column="total_weeks" />
                </TableHead>
                <TableHead className="text-right">
                  学費（CAD$）
                  <SortButton column="tuition_and_others" />
                </TableHead>
                <TableHead>
                  更新日時
                  <SortButton column="updated_at" />
                </TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>
                    <Link 
                      href={`/admin/schools/${course.schools.id}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <School className="h-4 w-4" />
                      {course.schools.name}
                    </Link>
                  </TableCell>
                  <TableCell>{course.category || "未設定"}</TableCell>
                  <TableCell className="text-right">{course.total_weeks || "-"}</TableCell>
                  <TableCell className="text-right">
                    {course.tuition_and_others 
                      ? course.tuition_and_others.toLocaleString()
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(course.updated_at).toLocaleString("ja-JP")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${course.id}`}>詳細</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${course.id}/edit`}>編集</Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => openDeleteDialog(course)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedAndFilteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    該当するコースがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>コースを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {courseToDelete && (
                <>
                  <p className="font-bold text-lg mb-2">{courseToDelete.name}</p>
                  <p>このコースを削除すると、関連するすべてのデータ（カリキュラム、職業ポジションの関連付けなど）も削除されます。</p>
                  <p className="mt-2 text-destructive">この操作は元に戻せません。</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteCourse()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}