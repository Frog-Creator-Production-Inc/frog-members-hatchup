"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"

interface FileDownloadButtonProps {
  filePath: string
  fileName: string
  documentType: string
}

export function FileDownloadButton({ filePath, fileName, documentType }: FileDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const supabase = createClientComponentClient()

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      // ストレージバケット名（ドキュメントタイプに基づいて決定）
      const bucketName = "application_documents"
      
      // 署名付きURLを取得
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(filePath, 60)
        
      if (error) throw error
      
      if (!data.signedUrl) {
        throw new Error("ダウンロードURLの取得に失敗しました")
      }
      
      // ファイルをダウンロード
      const response = await fetch(data.signedUrl)
      if (!response.ok) {
        throw new Error("ファイルのダウンロードに失敗しました")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("ファイルをダウンロードしました")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("ファイルのダウンロードに失敗しました")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDownload}
      disabled={isDownloading}
    >
      <Download className="h-4 w-4 mr-1" />
      ダウンロード
    </Button>
  )
} 