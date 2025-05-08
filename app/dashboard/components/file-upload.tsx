"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, File } from "lucide-react"
import { uploadFile } from "@/lib/file-storage"
import { toast } from "react-hot-toast"
import type { UserFile } from "@/types/file"

interface FileUploadProps {
  userId: string
  onUploadComplete?: (fileId: string, fileName: string) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number
}

export function FileUpload({ 
  userId, 
  onUploadComplete,
  acceptedFileTypes = ["application/pdf", "image/*"],
  maxFileSize = 50 * 1024 * 1024 // デフォルト50MB
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)
      try {
        for (const file of acceptedFiles) {
          // ファイルサイズチェック
          if (file.size > maxFileSize) {
            throw new Error(`ファイルサイズは${maxFileSize / 1024 / 1024}MB以下にしてください`)
          }

          const uploadedFile = await uploadFile(file, userId)
          if (onUploadComplete) {
            onUploadComplete(uploadedFile.id, file.name)
          }
          toast.success(`${file.name}をアップロードしました`)
        }
      } catch (error) {
        console.error("Upload error:", error)
        toast.error(error instanceof Error ? error.message : "アップロードに失敗しました")
      } finally {
        setUploading(false)
      }
    },
    [userId, maxFileSize, onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
  })

  return (
    <Card className="bg-white">
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="text-sm text-muted-foreground">アップロード中...</div>
          ) : isDragActive ? (
            <div className="text-sm text-muted-foreground">ここにファイルをドロップ</div>
          ) : (
            <div className="text-sm text-muted-foreground">
              クリックまたはドラッグ＆ドロップでファイルをアップロード
              <br />
              <span className="text-xs">
                対応形式: {acceptedFileTypes.join(", ")}
                （最大{maxFileSize / 1024 / 1024}MB）
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}