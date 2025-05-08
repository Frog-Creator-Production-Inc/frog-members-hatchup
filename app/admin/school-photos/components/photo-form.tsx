import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import Image from "next/image"

interface PhotoFormProps {
  initialData?: {
    id: string
    url: string
    description: string
    school_id: string
    course_id?: string
  }
  mode: "create" | "edit"
}

export function PhotoForm({ initialData, mode }: PhotoFormProps) {
  const [url, setUrl] = useState(initialData?.url || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [schoolId, setSchoolId] = useState(initialData?.school_id || "")
  const [courseId, setCourseId] = useState(initialData?.course_id || "")
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([])
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name")
        .order("name")
      
      if (error) {
        console.error("Error fetching schools:", error)
        toast.error("学校の取得に失敗しました")
        return
      }
      
      setSchools(data || [])
    }
    
    fetchSchools()
  }, [supabase])
  
  // 学校IDが変更されたときにその学校のコースを取得
  useEffect(() => {
    const fetchCourses = async () => {
      if (!schoolId) {
        setCourses([])
        return
      }
      
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")
        .eq("school_id", schoolId)
        .order("name")
      
      if (error) {
        console.error("Error fetching courses:", error)
        toast.error("コースの取得に失敗しました")
        return
      }
      
      setCourses(data || [])
    }
    
    fetchCourses()
  }, [schoolId, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // ファイルがアップロードされた場合
      if (file) {
        // Storageのパスを設定
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`
        
        // アップロード開始
        setUploadProgress(10)
        
        const { error: uploadError } = await supabase
          .storage
          .from('school-photos')
          .upload(filePath, file)
        
        if (uploadError) throw uploadError
        
        setUploadProgress(70)
        
        // 公開URL取得
        const { data: urlData } = supabase
          .storage
          .from('school-photos')
          .getPublicUrl(filePath)
        
        setUrl(urlData.publicUrl)
        
        setUploadProgress(90)
      }
      
      if (mode === "create") {
        const { error } = await supabase
          .from("school_photos")
          .insert({
            url: file ? url : url, // アップロードされたファイルのURLか、入力されたURL
            description,
            school_id: schoolId,
            course_id: courseId || null // コースIDが選択されていない場合はnull
          })
        
        if (error) throw error
        
        toast.success("写真を登録しました")
      } else {
        if (!initialData) throw new Error("初期データがありません")
        
        const { error } = await supabase
          .from("school_photos")
          .update({
            url: file ? url : url,
            description,
            school_id: schoolId,
            course_id: courseId || null // コースIDが選択されていない場合はnull
          })
          .eq("id", initialData.id)
        
        if (error) throw error
        
        toast.success("写真を更新しました")
      }
      
      setUploadProgress(100)
      router.push("/admin/school-photos")
      router.refresh()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(`エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school">学校</Label>
              <Select 
                value={schoolId} 
                onValueChange={setSchoolId}
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
              <Label htmlFor="course">コース（任意）</Label>
              <Select 
                value={courseId} 
                onValueChange={setCourseId}
                disabled={!schoolId || courses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="コースを選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">コースなし（学校の写真）</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                特定のコースの写真として使用する場合に選択してください。コース詳細ページに表示されます。
              </p>
            </div>

            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="file">写真のアップロード</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="url">画像URL（直接入力）</Label>
              <Input 
                id="url" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={!!file}
              />
              <p className="text-xs text-muted-foreground">
                ファイルアップロード時は自動的に設定されます
              </p>
            </div>
            
            {initialData?.url && (
              <div className="mt-4">
                <Label>現在の画像</Label>
                <div className="mt-2 relative h-64 w-full border rounded-md overflow-hidden">
                  <Image
                    src={initialData.url}
                    alt={initialData.description || "学校の写真"}
                    fill
                    style={{ objectFit: "contain" }}
                    className="bg-gray-100"
                    unoptimized
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="写真の説明を入力してください"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading || (!url && !file) || !schoolId}>
                {loading ? `${mode === "create" ? "登録" : "更新"}中...` : mode === "create" ? "登録" : "更新"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
} 