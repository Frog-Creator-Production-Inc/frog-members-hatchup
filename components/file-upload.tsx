"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"

interface FileUploadProps {
  onUpload: (file: File) => void
  isUploading?: boolean
  accept?: string
  maxSize?: number // バイト単位
}

export function FileUpload({ 
  onUpload, 
  isUploading = false, 
  accept = "*", 
  maxSize = 10 * 1024 * 1024 // デフォルト10MB
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    // ファイルサイズのチェック
    if (file.size > maxSize) {
      setError(`ファイルサイズが大きすぎます（最大${maxSize / (1024 * 1024)}MB）`)
      return false
    }
    
    // ファイル形式のチェック
    if (accept !== "*") {
      const acceptedTypes = accept.split(",").map(type => type.trim())
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
      const fileType = file.type
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith(".")) {
          // 拡張子でのチェック
          return fileExtension === type.toLowerCase()
        } else {
          // MIMEタイプでのチェック
          return fileType === type || type === "*"
        }
      })
      
      if (!isAccepted) {
        setError(`サポートされていないファイル形式です（${accept}）`)
        return false
      }
    }
    
    setError(null)
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        onUpload(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        onUpload(file)
      }
    }
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept}
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
          <p className="mt-2 text-sm text-gray-500">
            {isUploading ? "アップロード中..." : "ファイルをドラッグ＆ドロップまたはクリックして選択"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {accept !== "*" ? `サポート形式: ${accept}` : ""}
            {maxSize ? ` (最大${maxSize / (1024 * 1024)}MB)` : ""}
          </p>
        </label>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 