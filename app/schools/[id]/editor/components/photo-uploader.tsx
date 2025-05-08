"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { Camera, Trash, Upload, X } from "lucide-react"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PhotoUploaderProps {
  schoolId: string
  courseId?: string
  token: string
  email: string
  onPhotoAdded?: () => void
}

interface Photo {
  id: string
  url: string
  description: string | null
  created_at: string
}

export function PhotoUploader({ schoolId, courseId, token, email, onPhotoAdded }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // 写真データを取得
  const fetchPhotos = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        token,
        email
      })
      
      if (courseId) {
        queryParams.append('courseId', courseId)
      }
      
      const response = await fetch(`/api/schools/${schoolId}/photos?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch photos")
      }
      
      const data = await response.json()
      setPhotos(data.photos || [])
    } catch (error) {
      console.error("Error fetching photos:", error)
      toast.error("An error occurred while fetching photos")
    } finally {
      setIsLoading(false)
    }
  }

  // 初回レンダリング時に写真を取得
  useEffect(() => {
    fetchPhotos()
  }, [courseId]) // courseIdが変わったときにも再取得

  // ファイル選択ハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    
    if (file) {
      setSelectedFile(file)
      
      // プレビューURL生成
      const fileReader = new FileReader()
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string)
      }
      fileReader.readAsDataURL(file)
    }
  }

  // ファイルアップロードハンドラー
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected")
      return
    }
    
    setIsUploading(true)
    
    try {
      // 1. Supabaseストレージにアップロード
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('school-photos')
        .upload(fileName, selectedFile)
      
      if (uploadError) {
        throw new Error(uploadError.message)
      }
      
      // 2. 公開URLを取得
      const { data: { publicUrl } } = supabase
        .storage
        .from('school-photos')
        .getPublicUrl(uploadData.path)
      
      // 3. データベースに登録
      const response = await fetch(`/api/schools/${schoolId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: publicUrl,
          description,
          token,
          email,
          courseId
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to register photo")
      }
      
      // 4. 成功メッセージ
      toast.success("Photo uploaded successfully")
      
      // 5. 状態クリア
      setSelectedFile(null)
      setPreviewUrl(null)
      setDescription("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // 6. 写真リストを更新
      fetchPhotos()
      
      // 7. 親コンポーネントに通知
      if (onPhotoAdded) {
        onPhotoAdded()
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast.error("An error occurred while uploading photo")
    } finally {
      setIsUploading(false)
    }
  }

  // 写真削除ハンドラー
  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const queryParams = new URLSearchParams({
        photoId,
        token,
        email
      })
      
      const response = await fetch(`/api/schools/${schoolId}/photos?${queryParams.toString()}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete photo")
      }
      
      toast.success("Photo deleted successfully")
      fetchPhotos()
    } catch (error) {
      console.error("Error deleting photo:", error)
      toast.error("An error occurred while deleting photo")
    } finally {
      setIsLoading(false)
    }
  }

  // 選択のキャンセル
  const handleCancelSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Add Photos</h3>
        
        <div className="space-y-4">
          {previewUrl ? (
            <div className="relative">
              <div className="mb-2 border rounded-lg overflow-hidden relative" style={{ maxHeight: "250px" }}>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full object-contain"
                  style={{ maxHeight: "250px" }}
                />
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter photo description"
                  className="mt-1"
                />
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading..." : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="mb-2 text-sm text-gray-600">Click or drag and drop to add images</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 写真リスト */}
      {photos.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">
            {courseId ? "Course Photos" : "School Photos"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="border rounded-lg overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={photo.url}
                    alt={photo.description || "School photo"}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                    title="Delete"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </button>
                </div>
                {photo.description && (
                  <div className="p-2 text-sm text-gray-600 truncate">
                    {photo.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 