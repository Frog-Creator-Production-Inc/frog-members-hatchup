"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-hot-toast"
import { Save, Book, FileText, Calendar, DollarSign, Info, PlusCircle, Image as ImageIcon, BookOpen, Trash2, AlertTriangle, Plus, Check, Briefcase } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { PhotoUploader } from "./photo-uploader"
import { IntakeDateManager } from "./intake-date-manager"
import { SubjectManager } from "./subject-manager"
import { JobPositionManager } from "./job-position-manager"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandList, CommandGroup } from "@/components/ui/command"

// 型定義
interface Course {
  id: string
  name: string
  category: string | null
  description: string | null
  total_weeks: number | null
  lecture_weeks: number | null
  work_permit_weeks: number | null
  tuition_and_others: number | null
  url: string | null
  migration_goals: string[] | null
  admission_requirements: string | null
  graduation_requirements: string | null
  job_support: string | null
  notes: string | null
}

interface School {
  id: string
  name: string
  logo_url?: string | null
  website?: string | null
  location_id?: string | null
  goal_locations?: {
    id: string
    city: string
    country: string
  } | null
}

interface CourseEditorFormProps {
  school: School
  courses: Course[]
  token: string
  email: string
}

// 新規コース用の初期データ
const initialNewCourse: Omit<Course, "id"> = {
  name: "",
  category: null,
  description: null,
  total_weeks: null,
  lecture_weeks: null,
  work_permit_weeks: null,
  tuition_and_others: null,
  url: null,
  migration_goals: null,
  admission_requirements: null,
  graduation_requirements: null,
  job_support: null,
  notes: null
}

// プリセットカテゴリー
const PRESET_CATEGORIES = [
  "Technology",
  "Business",
  "Hospitality",
  "Healthcare",
  "Design"
]

export function CourseEditorForm({ school, courses, token, email }: CourseEditorFormProps) {
  const [editableCourses, setEditableCourses] = useState<Course[]>(courses)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courses.length > 0 ? courses[0].id : null
  )
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newCourse, setNewCourse] = useState<Omit<Course, "id">>(initialNewCourse)
  const [isNewCourseDialogOpen, setIsNewCourseDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  
  // 編集用カテゴリー状態
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCustomCategory, setNewCustomCategory] = useState("")
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  
  // 新規コース用カテゴリー状態
  const [isAddingNewCategoryForNew, setIsAddingNewCategoryForNew] = useState(false)
  const [newCustomCategoryForNew, setNewCustomCategoryForNew] = useState("")
  const [newCategoryPopoverOpen, setNewCategoryPopoverOpen] = useState(false)
  
  // 選択中のコースを取得
  const selectedCourse = editableCourses.find(course => course.id === selectedCourseId) || null
  
  // フィールド更新ハンドラー
  const handleFieldChange = (fieldName: keyof Course, value: any) => {
    if (!selectedCourseId) return
    
    setEditableCourses(prev => 
      prev.map(course => 
        course.id === selectedCourseId 
          ? { ...course, [fieldName]: value } 
          : course
      )
    )
    
    // 保存フラグをリセット
    setSaved(false)
  }
  
  // 新規コースフィールド更新ハンドラー
  const handleNewCourseFieldChange = (fieldName: keyof Omit<Course, "id">, value: any) => {
    setNewCourse(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }
  
  // カテゴリー選択ハンドラー
  const handleCategorySelect = (category: string) => {
    handleFieldChange("category", category);
    setCategoryPopoverOpen(false);
  };
  
  // 新規コース用カテゴリー選択ハンドラー
  const handleNewCategorySelect = (category: string) => {
    handleNewCourseFieldChange("category", category);
    setNewCategoryPopoverOpen(false);
  };
  
  // 新しいカスタムカテゴリーを追加（編集用）
  const handleAddCustomCategory = () => {
    if (!newCustomCategory.trim()) return;
    handleFieldChange("category", newCustomCategory.trim());
    setNewCustomCategory("");
    setIsAddingNewCategory(false);
    setCategoryPopoverOpen(false);
  };
  
  // 新しいカスタムカテゴリーを追加（新規コース用）
  const handleAddCustomCategoryForNew = () => {
    if (!newCustomCategoryForNew.trim()) return;
    handleNewCourseFieldChange("category", newCustomCategoryForNew.trim());
    setNewCustomCategoryForNew("");
    setIsAddingNewCategoryForNew(false);
    setNewCategoryPopoverOpen(false);
  };
  
  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCourseId) {
      toast.error("Course is not selected")
      return
    }
    
    setLoading(true)
    
    try {
      // 現在選択中のコースのみを保存
      const courseToUpdate = editableCourses.find(c => c.id === selectedCourseId)
      
      if (!courseToUpdate) {
        throw new Error("Selected course not found")
      }
      
      const response = await fetch(`/api/schools/${school.id}/courses/${selectedCourseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course: courseToUpdate,
          token,
          email
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update course")
      }
      
      setSaved(true)
      toast.success("Course information saved successfully")
    } catch (error) {
      console.error("Error updating course:", error)
      toast.error("An error occurred while saving course information")
    } finally {
      setLoading(false)
    }
  }
  
  // 新規コース作成処理
  const handleCreateCourse = async () => {
    if (!newCourse.name) {
      toast.error("Course name is required")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/schools/${school.id}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course: newCourse,
          token,
          email
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create course")
      }
      
      // 新しいコースを追加
      const createdCourse = data.course
      setEditableCourses(prev => [...prev, createdCourse])
      
      // 新しいコースを選択
      setSelectedCourseId(createdCourse.id)
      
      // フォームをリセット
      setNewCourse(initialNewCourse)
      
      // ダイアログを閉じる
      setIsNewCourseDialogOpen(false)
      
      toast.success("New course created successfully")
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("An error occurred while creating course")
    } finally {
      setLoading(false)
    }
  }
  
  // コース削除処理
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    setLoading(true);
    
    try {
      console.log(`Attempting to delete course: ${courseToDelete.id}`);
      const response = await fetch(`/api/schools/${school.id}/courses/${courseToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete course");
      }
      
      console.log("Delete response:", data);
      
      // 削除したコースを一覧から除外
      setEditableCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      
      // 削除したコースが現在選択中だった場合、選択をクリア
      if (selectedCourseId === courseToDelete.id) {
        const remainingCourses = editableCourses.filter(c => c.id !== courseToDelete.id);
        setSelectedCourseId(remainingCourses.length > 0 ? remainingCourses[0].id : null);
      }
      
      toast.success("Course deleted successfully");
      
      // ダイアログを閉じる
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error(`An error occurred while deleting course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 削除ダイアログを開く
  const openDeleteDialog = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation(); // ボタンクリックがコース選択に影響しないよう伝播を止める
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <div className="w-1/3">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Book className="mr-2 h-5 w-5" />
                Course List
              </CardTitle>
              <Dialog open={isNewCourseDialogOpen} onOpenChange={setIsNewCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">Course Name *</Label>
                      <Input
                        id="new-name"
                        value={newCourse.name || ""}
                        onChange={(e) => handleNewCourseFieldChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-category">Category</Label>
                      <Popover open={newCategoryPopoverOpen} onOpenChange={setNewCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={newCategoryPopoverOpen}
                            className="w-full justify-between"
                          >
                            {newCourse.category || "Select a category..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-white border shadow-md" align="start">
                          <Command>
                            <CommandInput placeholder="Search categories..." />
                            <CommandList>
                              <CommandGroup heading="Preset Categories">
                                {PRESET_CATEGORIES.map((category) => (
                                  <CommandItem
                                    key={category}
                                    value={category}
                                    onSelect={() => handleNewCategorySelect(category)}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        newCourse.category === category ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {category}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              <CommandGroup heading="Custom">
                                <CommandItem 
                                  onSelect={() => setIsAddingNewCategoryForNew(true)}
                                  className="cursor-pointer"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add New Category
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                          {isAddingNewCategoryForNew && (
                            <div className="p-2 border-t flex items-center gap-2">
                              <Input
                                value={newCustomCategoryForNew}
                                onChange={(e) => setNewCustomCategoryForNew(e.target.value)}
                                placeholder="New category name"
                                className="flex-1"
                                autoFocus
                              />
                              <Button 
                                size="sm" 
                                onClick={handleAddCustomCategoryForNew}
                                disabled={!newCustomCategoryForNew.trim()}
                              >
                                Add
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-description">Description</Label>
                      <Textarea
                        id="new-description"
                        rows={3}
                        value={newCourse.description || ""}
                        onChange={(e) => handleNewCourseFieldChange("description", e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateCourse}
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create Course"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {editableCourses.length > 0 ? (
                  editableCourses.map((course) => (
                    <div key={course.id} className="relative group">
                      <Button
                        variant={selectedCourseId === course.id ? "default" : "outline"}
                        className="w-full justify-start h-auto py-2 pr-10"
                        onClick={() => setSelectedCourseId(course.id)}
                      >
                        <span className="text-left whitespace-normal break-words">
                          {course.name}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => openDeleteDialog(course, e)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    No courses registered. Please add a new course.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {selectedCourse ? (
          <div className="w-2/3">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      {selectedCourse.name}
                    </span>
                    <Button type="submit" disabled={loading} className="ml-auto">
                      {loading ? "Saving..." : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="mb-6 grid sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-1 bg-gray-50 p-1 rounded-lg">
                      <TabsTrigger value="basic" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Info className="h-4 w-4" />
                        <span>Basic Info</span>
                      </TabsTrigger>
                      <TabsTrigger value="details" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="h-4 w-4" />
                        <span>Details</span>
                      </TabsTrigger>
                      <TabsTrigger value="requirements" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Requirements</span>
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ImageIcon className="h-4 w-4" />
                        <span>Photos</span>
                      </TabsTrigger>
                      <TabsTrigger value="intake-dates" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Start Dates</span>
                      </TabsTrigger>
                      <TabsTrigger value="subjects" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <BookOpen className="h-4 w-4" />
                        <span>Curriculum</span>
                      </TabsTrigger>
                      <TabsTrigger value="job-positions" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Briefcase className="h-4 w-4" />
                        <span>Career</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Course Name *</Label>
                          <Input
                            id="name"
                            value={selectedCourse.name}
                            onChange={(e) => handleFieldChange("name", e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={categoryPopoverOpen}
                                className="w-full justify-between"
                              >
                                {selectedCourse.category || "Select a category..."}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-white border shadow-md" align="start">
                              <Command>
                                <CommandInput placeholder="Search categories..." />
                                <CommandList>
                                  <CommandGroup heading="Preset Categories">
                                    {PRESET_CATEGORIES.map((category) => (
                                      <CommandItem
                                        key={category}
                                        value={category}
                                        onSelect={() => handleCategorySelect(category)}
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedCourse.category === category ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {category}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <CommandGroup heading="Custom">
                                    <CommandItem 
                                      onSelect={() => setIsAddingNewCategory(true)}
                                      className="cursor-pointer"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add New Category
                                    </CommandItem>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                              {isAddingNewCategory && (
                                <div className="p-2 border-t flex items-center gap-2">
                                  <Input
                                    value={newCustomCategory}
                                    onChange={(e) => setNewCustomCategory(e.target.value)}
                                    placeholder="New category name"
                                    className="flex-1"
                                    autoFocus
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={handleAddCustomCategory}
                                    disabled={!newCustomCategory.trim()}
                                  >
                                    Add
                                  </Button>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            rows={4}
                            value={selectedCourse.description || ""}
                            onChange={(e) => handleFieldChange("description", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="url">Course URL</Label>
                          <Input
                            id="url"
                            value={selectedCourse.url || ""}
                            onChange={(e) => handleFieldChange("url", e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="total_weeks" className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            Total Duration (weeks)
                          </Label>
                          <Input
                            id="total_weeks"
                            type="number"
                            value={selectedCourse.total_weeks || ""}
                            onChange={(e) => handleFieldChange("total_weeks", e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lecture_weeks">Lecture Period (weeks)</Label>
                          <Input
                            id="lecture_weeks"
                            type="number"
                            value={selectedCourse.lecture_weeks || ""}
                            onChange={(e) => handleFieldChange("lecture_weeks", e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="work_permit_weeks">Work Permit Period (weeks)</Label>
                          <Input
                            id="work_permit_weeks"
                            type="number"
                            value={selectedCourse.work_permit_weeks || ""}
                            onChange={(e) => handleFieldChange("work_permit_weeks", e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="tuition_and_others" className="flex items-center">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Tuition Fee (total)
                          </Label>
                          <Input
                            id="tuition_and_others"
                            type="number"
                            value={selectedCourse.tuition_and_others || ""}
                            onChange={(e) => handleFieldChange("tuition_and_others", e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center">
                          <Info className="mr-2 h-4 w-4" />
                          Additional Information / Notes
                        </Label>
                        <Textarea
                          id="notes"
                          rows={3}
                          value={selectedCourse.notes || ""}
                          onChange={(e) => handleFieldChange("notes", e.target.value)}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="requirements" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admission_requirements">Admission Requirements</Label>
                        <Textarea
                          id="admission_requirements"
                          rows={4}
                          value={selectedCourse.admission_requirements || ""}
                          onChange={(e) => handleFieldChange("admission_requirements", e.target.value)}
                          placeholder="Example: TOEIC score above 500, high school graduate, etc."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="graduation_requirements">Graduation Requirements</Label>
                        <Textarea
                          id="graduation_requirements"
                          rows={4}
                          value={selectedCourse.graduation_requirements || ""}
                          onChange={(e) => handleFieldChange("graduation_requirements", e.target.value)}
                          placeholder="Example: At least 80% attendance, final exam score above 70%, etc."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="job_support">Job Support</Label>
                        <Textarea
                          id="job_support"
                          rows={4}
                          value={selectedCourse.job_support || ""}
                          onChange={(e) => handleFieldChange("job_support", e.target.value)}
                          placeholder="Example: Resume review, mock interview, job introduction, etc."
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="photos" className="space-y-4">
                      <PhotoUploader 
                        schoolId={school.id}
                        courseId={selectedCourse.id}
                        token={token}
                        email={email}
                      />
                    </TabsContent>
                    
                    <TabsContent value="intake-dates" className="space-y-4">
                      <IntakeDateManager
                        schoolId={school.id}
                        courseId={selectedCourse.id}
                        token={token}
                        email={email}
                      />
                    </TabsContent>
                    
                    <TabsContent value="subjects" className="space-y-4">
                      <SubjectManager
                        schoolId={school.id}
                        courseId={selectedCourse.id}
                        token={token}
                        email={email}
                      />
                    </TabsContent>
                    
                    <TabsContent value="job-positions" className="space-y-4">
                      <JobPositionManager
                        schoolId={school.id}
                        courseId={selectedCourse.id}
                        token={token}
                        email={email}
                      />
                    </TabsContent>
                  </Tabs>
                  
                  {saved && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3 text-green-800">
                      Changes saved successfully.
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </div>
        ) : (
          <div className="w-2/3">
            <Card>
              <CardHeader>
                <CardTitle>Please select a course</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Please select a course from the left list or add a new course.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* コース削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Course Deletion
            </DialogTitle>
            <DialogDescription>
              This operation cannot be undone. Are you sure you want to delete "{courseToDelete?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCourseToDelete(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 