"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { getJobPositions, getCourseJobPositions, updateCourseJobPositions } from "@/lib/supabase/queries"
import { Checkbox } from "@/components/ui/checkbox"
import { JobPosition } from "@/types/supabase"
import { X, Upload, ImageIcon } from "lucide-react"
import Image from "next/image"

interface Course {
  id: string
  name: string
  category: string | null
  description: string | null
  total_weeks: number | null
  lecture_weeks: number | null
  tuition_and_others: number | null
  work_permit_weeks: number | null
  school_id: string
  migration_goals: string[] | null
  content_snare_template_id: string | null
  admission_requirements: string | null
  graduation_requirements: string | null
  job_support: string | null
  notes: string | null
}

interface CourseFormProps {
  initialData?: Course
  schools: { id: string; name: string }[]
  mode: "create" | "edit"
}

export function CourseForm({ initialData, schools, mode }: CourseFormProps) {
  const [formData, setFormData] = useState<Course>(
    initialData || {
      id: "",
      name: "",
      category: null,
      description: null,
      total_weeks: null,
      lecture_weeks: null,
      tuition_and_others: null,
      work_permit_weeks: null,
      school_id: "",
      migration_goals: [],
      content_snare_template_id: null,
      admission_requirements: null,
      graduation_requirements: null,
      job_support: null,
      notes: null,
    }
  )
  const [loading, setLoading] = useState(false)
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [selectedJobPositions, setSelectedJobPositions] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // 画像関連の状態を追加
  const [coursePhotos, setCoursePhotos] = useState<any[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photoDescription, setPhotoDescription] = useState("")

  // カテゴリーの選択肢
  const categoryOptions = [
    { value: "Business", label: "Business" },
    { value: "Technology", label: "Technology" },
    { value: "Hospitality", label: "Hospitality" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Creative", label: "Creative" }
  ]

  // 職業ポジションとコースに関連付けられた職業ポジションを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const positions = await getJobPositions()
        setJobPositions(positions || [])

        if (mode === "edit" && initialData?.id) {
          const coursePositions = await getCourseJobPositions(initialData.id)
          const selectedIds = coursePositions.map(item => item.job_position_id)
          setSelectedJobPositions(selectedIds)
          
          // コース画像を取得
          const { data: photos, error } = await supabase
            .from("school_photos")
            .select("*")
            .eq("course_id", initialData.id)
            .order("created_at", { ascending: false })
            
          if (error) {
            console.error("Error fetching course photos:", error)
          } else {
            setCoursePhotos(photos || [])
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("データの取得に失敗しました")
      }
    }

    fetchData()
  }, [initialData?.id, mode, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "edit") {
        const {
          id,
          name,
          category,
          description,
          total_weeks,
          lecture_weeks,
          tuition_and_others,
          work_permit_weeks,
          school_id,
          migration_goals,
          content_snare_template_id,
          admission_requirements,
          graduation_requirements,
          job_support,
          notes,
        } = formData

        const updatePayload = {
          name,
          category,
          description,
          total_weeks,
          lecture_weeks,
          tuition_and_others,
          work_permit_weeks,
          school_id,
          migration_goals,
          content_snare_template_id,
          admission_requirements,
          graduation_requirements,
          job_support,
          notes,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from("courses")
          .update(updatePayload)
          .eq("id", id)

        if (error) throw error

        // 職業ポジションの関連付けを更新
        await updateCourseJobPositions(id, selectedJobPositions)

        toast.success("コースを更新しました")
      } else {
        const { error } = await supabase
          .from("courses")
          .insert([formData])

        if (error) throw error

        toast.success("コースを作成しました")
      }

      router.push("/admin/courses")
      router.refresh()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(`エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 職業ポジションの選択状態を切り替える
  const toggleJobPosition = (jobPositionId: string) => {
    setSelectedJobPositions(prev => {
      if (prev.includes(jobPositionId)) {
        return prev.filter(id => id !== jobPositionId)
      } else {
        return [...prev, jobPositionId]
      }
    })
  }

  // 画像をアップロードする関数
  const handleImageUpload = async () => {
    if (!imageFile || !initialData?.id) return
    
    setUploading(true)
    
    try {
      // 1. Storageにファイルをアップロード
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`
      
      const { error: uploadError } = await supabase
        .storage
        .from('school-photos')
        .upload(filePath, imageFile)
      
      if (uploadError) throw uploadError
      
      // 2. 公開URLを取得
      const { data: urlData } = supabase
        .storage
        .from('school-photos')
        .getPublicUrl(filePath)
      
      // 3. school_photosテーブルに登録
      const { data: photoData, error: insertError } = await supabase
        .from('school_photos')
        .insert([
          { 
            school_id: initialData.school_id,
            course_id: initialData.id,
            url: urlData.publicUrl,
            description: photoDescription || `${initialData.name}の写真`
          }
        ])
        .select()
      
      if (insertError) throw insertError
      
      // 4. 状態を更新
      setCoursePhotos(prev => [photoData[0], ...prev])
      setImageFile(null)
      setPhotoDescription("")
      toast.success("画像をアップロードしました")
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast.error(`画像のアップロードに失敗しました: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }
  
  // 画像を削除する関数
  const handleImageDelete = async (photoId: string) => {
    if (!confirm("この画像を削除してもよろしいですか？")) return
    
    try {
      const { error } = await supabase
        .from('school_photos')
        .delete()
        .eq('id', photoId)
      
      if (error) throw error
      
      setCoursePhotos(prev => prev.filter(photo => photo.id !== photoId))
      toast.success("画像を削除しました")
    } catch (error: any) {
      console.error("Error deleting image:", error)
      toast.error(`画像の削除に失敗しました: ${error.message}`)
    }
  }
  
  // ファイル選択をハンドリング
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0])
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-white">
        <CardContent className="grid gap-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">コース名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_id">学校</Label>
              <Select 
                value={formData.school_id} 
                onValueChange={(value) => setFormData({ ...formData, school_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="学校を選択" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリー</Label>
              <Select 
                value={formData.category || ""} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_weeks">総週数</Label>
              <Input
                id="total_weeks"
                type="number"
                value={formData.total_weeks || ""}
                onChange={(e) => setFormData({ ...formData, total_weeks: parseInt(e.target.value) || null })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lecture_weeks">講義週数</Label>
              <Input
                id="lecture_weeks"
                type="number"
                value={formData.lecture_weeks || ""}
                onChange={(e) => setFormData({ ...formData, lecture_weeks: parseInt(e.target.value) || null })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_permit_weeks">就労許可週数</Label>
              <Input
                id="work_permit_weeks"
                type="number"
                value={formData.work_permit_weeks || ""}
                onChange={(e) => setFormData({ ...formData, work_permit_weeks: parseInt(e.target.value) || null })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tuition_and_others">学費その他（CAD$）</Label>
              <Input
                id="tuition_and_others"
                type="number"
                value={formData.tuition_and_others || ""}
                onChange={(e) => setFormData({ ...formData, tuition_and_others: parseFloat(e.target.value) || null })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
            />
          </div>

          <div className="space-y-4">
            <Label>コース詳細情報</Label>
            <div className="grid grid-cols-1 gap-4 border rounded-md p-4">
              <div className="space-y-2">
                <Label htmlFor="admission_requirements">入学条件</Label>
                <Textarea
                  id="admission_requirements"
                  value={formData.admission_requirements || ""}
                  onChange={(e) => setFormData({ ...formData, admission_requirements: e.target.value })}
                  rows={2}
                  placeholder="例: IELTS 5.5以上、高校卒業以上"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduation_requirements">卒業要件</Label>
                <Textarea
                  id="graduation_requirements"
                  value={formData.graduation_requirements || ""}
                  onChange={(e) => setFormData({ ...formData, graduation_requirements: e.target.value })}
                  rows={2}
                  placeholder="例: 全科目の70%以上の出席、最終試験合格"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_support">就職サポート</Label>
                <Textarea
                  id="job_support"
                  value={formData.job_support || ""}
                  onChange={(e) => setFormData({ ...formData, job_support: e.target.value })}
                  rows={2}
                  placeholder="例: 履歴書作成サポート、模擬面接、求人紹介"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">特記事項</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="例: オンラインコースも提供しています"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ※ 空欄の項目は表示されません
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="migration_goals">渡航目的（複数選択可）</Label>
            <div className="grid grid-cols-2 gap-2">
              {["overseas_job", "improve_language", "career_change", "find_new_home"].map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`goal-${goal}`}
                    checked={(formData.migration_goals || []).includes(goal)}
                    onChange={(e) => {
                      const goals = [...(formData.migration_goals || [])];
                      if (e.target.checked) {
                        goals.push(goal);
                      } else {
                        const index = goals.indexOf(goal);
                        if (index !== -1) goals.splice(index, 1);
                      }
                      setFormData({ ...formData, migration_goals: goals });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor={`goal-${goal}`} className="text-sm">
                    {goal === "overseas_job" && "海外就職"}
                    {goal === "improve_language" && "語学力向上"}
                    {goal === "career_change" && "キャリアチェンジ"}
                    {goal === "find_new_home" && "移住先探し"}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Content Snare Template ID */}
          <div className="space-y-2">
            <Label htmlFor="content_snare_template_id">Content Snare テンプレートID</Label>
            <Input
              id="content_snare_template_id"
              value={formData.content_snare_template_id || ""}
              onChange={(e) => setFormData({ ...formData, content_snare_template_id: e.target.value })}
              placeholder="例: tmp_abcdef123456"
            />
            <p className="text-xs text-muted-foreground">
              ※ コース申請フォームのテンプレートIDを入力してください
            </p>
          </div>

          {/* 職業ポジション選択セクション */}
          <div className="space-y-2">
            <Label htmlFor="job-positions">目指せる職種</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border rounded-md p-4">
              {jobPositions.map((position) => (
                <div key={position.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-position-${position.id}`}
                    checked={selectedJobPositions.includes(position.id)}
                    onCheckedChange={() => toggleJobPosition(position.id)}
                  />
                  <Label
                    htmlFor={`job-position-${position.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {position.title}
                  </Label>
                </div>
              ))}
              {jobPositions.length === 0 && (
                <p className="text-sm text-muted-foreground">職業ポジションが見つかりません</p>
              )}
            </div>
          </div>

          {/* コース写真セクション (編集モードのみ表示) */}
          {mode === "edit" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">コース写真</h3>
              
              <div className="grid gap-4">
                {/* 画像アップロードフォーム */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-image">新しい画像をアップロード</Label>
                    <Input 
                      id="course-image" 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">説明 (任意)</Label>
                    <Input 
                      id="description" 
                      placeholder="画像の説明を入力"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={handleImageUpload} 
                    disabled={!imageFile || uploading}
                    className="w-full"
                  >
                    {uploading ? "アップロード中..." : "写真をアップロード"}
                    {!uploading && <Upload className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
                
                {/* 既存の画像一覧 */}
                {coursePhotos.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {coursePhotos.map(photo => (
                      <div key={photo.id} className="border rounded-lg overflow-hidden relative group">
                        <div className="relative h-40 w-full">
                          <Image
                            src={photo.url}
                            alt={photo.description || "コース画像"}
                            fill
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                        </div>
                        
                        <div className="p-2 bg-white border-t">
                          <p className="text-sm truncate">{photo.description || "説明なし"}</p>
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleImageDelete(photo.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">コース専用の画像がありません</p>
                    <p className="text-sm text-muted-foreground mt-1">画像をアップロードすると、コース詳細ページに表示されます</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/courses")}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : mode === "edit" ? "更新" : "作成"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}