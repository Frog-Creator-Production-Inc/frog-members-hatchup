"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

interface FileDownloadButtonProps {
  fileId: string
  fileName: string
  filePath?: string
  userId?: string
}

export function FileDownloadButton({ fileId, fileName, filePath, userId }: FileDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const supabase = createClientComponentClient()

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      console.log("ダウンロード開始:", { fileId, fileName, filePath, userId })
      
      // ファイル情報を取得
      if (!filePath || !userId) {
        console.log("ファイル情報を取得中...")
        const { data: fileData, error: fileError } = await supabase
          .from('user_files')
          .select('path, user_id')
          .eq('id', fileId)
          .single()
          
        if (fileError) {
          console.error("ファイル情報取得エラー:", fileError)
          throw fileError
        }
        
        filePath = fileData.path
        userId = fileData.user_id
        console.log("取得したファイル情報:", { filePath, userId })
      }
      
      // バケット名を確認
      console.log("バケット一覧を取得中...")
      const { data: buckets } = await supabase.storage.listBuckets()
      console.log("利用可能なバケット:", buckets)
      
      // 正しいバケット名を使用
      const bucketName = 'user-documents' // 修正: 正しいバケット名
      
      // ファイルの完全なパスを構築
      // 修正: 正しいパス形式「user-documents/profiles_id/filename」
      const fullPath = `${userId}/${filePath}`
      console.log("完全なファイルパス:", fullPath)
      
      // ファイルが存在するか確認
      console.log(`${bucketName}バケット内のファイルを確認中...`)
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(userId)
        
      if (listError) {
        console.error("ファイル一覧取得エラー:", listError)
      } else {
        console.log(`${bucketName}/${userId}内のファイル:`, files)
      }
      
      // ファイルのURLを取得
      console.log(`署名付きURLを作成中... バケット: ${bucketName}, パス: ${fullPath}`)
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(fullPath, 60)

      if (error) {
        console.error("署名付きURL作成エラー:", error)
        
        // 代替方法1: 直接ファイル名を使用
        console.log("代替方法1でファイルURLを取得中...")
        const { data: directData, error: directError } = await supabase
          .storage
          .from(bucketName)
          .createSignedUrl(filePath!, 60)
          
        if (!directError && directData) {
          console.log("直接パスでの署名付きURL:", directData.signedUrl)
          // ダウンロード処理
          const response = await fetch(directData.signedUrl)
          if (response.ok) {
            const blob = await response.blob()
            downloadBlob(blob, fileName)
            updateDownloadStatus(fileId)
            return
          }
        }
        
        // 代替方法2: 公開URLを使用
        console.log("代替方法2でファイルURLを取得中...")
        const { data: publicUrl } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(fullPath)
          
        console.log("公開URL:", publicUrl)
        
        if (publicUrl && publicUrl.publicUrl) {
          // 公開URLを使用してダウンロード
          const response = await fetch(publicUrl.publicUrl)
          if (response.ok) {
            const blob = await response.blob()
            downloadBlob(blob, fileName)
            updateDownloadStatus(fileId)
            return
          }
        }
        
        // 代替方法3: 別のパス形式を試す
        console.log("代替方法3でファイルURLを取得中...")
        // user_filesテーブルのpathカラムがそのまま使えるか試す
        const altPath = filePath
        const { data: altData, error: altError } = await supabase
          .storage
          .from(bucketName)
          .createSignedUrl(altPath!, 60)
          
        if (!altError && altData) {
          console.log("代替パスでの署名付きURL:", altData.signedUrl)
          const response = await fetch(altData.signedUrl)
          if (response.ok) {
            const blob = await response.blob()
            downloadBlob(blob, fileName)
            updateDownloadStatus(fileId)
            return
          }
        }
        
        // 代替方法4: 別のバケット名を試す
        console.log("代替方法4でファイルURLを取得中...")
        const altBucketName = 'user_files'
        const { data: altBucketData, error: altBucketError } = await supabase
          .storage
          .from(altBucketName)
          .createSignedUrl(filePath!, 60)
          
        if (!altBucketError && altBucketData) {
          console.log("別バケットでの署名付きURL:", altBucketData.signedUrl)
          const response = await fetch(altBucketData.signedUrl)
          if (response.ok) {
            const blob = await response.blob()
            downloadBlob(blob, fileName)
            updateDownloadStatus(fileId)
            return
          }
        }
        
        throw error
      }

      // 成功した場合の処理
      if (data && data.signedUrl) {
        console.log("署名付きURL取得成功:", data.signedUrl)
        // ファイルをダウンロード
        const response = await fetch(data.signedUrl)
        if (!response.ok) {
          console.error("ファイルのフェッチに失敗:", response.status, response.statusText)
          throw new Error("ファイルのダウンロードに失敗しました")
        }
        
        const blob = await response.blob()
        downloadBlob(blob, fileName)
        
        // ダウンロード状態を更新
        updateDownloadStatus(fileId)
      } else {
        console.error("署名付きURLがありません")
        throw new Error("ファイルのダウンロードに失敗しました")
      }
    } catch (error) {
      console.error("ダウンロードエラー:", error)
      toast.error("ファイルのダウンロードに失敗しました")
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadBlob = (blob: Blob, fileName: string) => {
    // blobをダウンロード
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success("ファイルをダウンロードしました")
  }

  const updateDownloadStatus = async (fileId: string) => {
    try {
      // ダウンロード状態を更新
      const { error } = await supabase
        .from('user_files')
        .update({ downloaded: true })
        .eq('id', fileId)
      
      if (error) {
        console.error("ダウンロード状態の更新に失敗:", error)
      }
    } catch (error) {
      console.error("ダウンロード状態の更新エラー:", error)
    }
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="flex gap-1" 
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      ダウンロード
    </Button>
  )
} 