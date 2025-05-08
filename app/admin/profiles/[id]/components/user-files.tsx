"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Download, FileText, Loader2, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { formatDate, formatBytes } from "@/lib/utils"

const STORAGE_BUCKET = 'user-documents' // バケット名を定数として定義

interface UserFile {
  id: string
  name: string
  size: number
  type: string
  path: string      // urlをpathに変更
  user_id: string   // profile_idをuser_idに変更
  downloaded: boolean
  created_at: string
}

interface Props {
  profileId: string
  files: UserFile[]
}

export function UserFiles({ profileId, files: initialFiles }: Props) {
  const [files, setFiles] = useState<UserFile[]>(initialFiles)
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({})
  const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({})
  const supabase = createClientComponentClient()

  const handleDownload = async (file: UserFile) => {
    setDownloading(prev => ({ ...prev, [file.id]: true }))

    try {
      // ファイルパスを構築（プロファイルIDごとにフォルダを分ける）
      const filePath = `${profileId}/${file.name}`

      // 1. 署名付きURLを取得
      const { data, error: signedUrlError } = await supabase
        .storage
        .from(STORAGE_BUCKET) // user-documentsを使用
        .createSignedUrl(filePath, 60) // 60秒間有効なURL

      if (signedUrlError) {
        console.error('SignedURL error:', signedUrlError)
        throw signedUrlError
      }

      if (!data?.signedUrl) {
        throw new Error('Failed to get signed URL')
      }

      // 2. 署名付きURLを使用してファイルをダウンロード
      const response = await fetch(data.signedUrl)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      window.URL.revokeObjectURL(url)

      // 3. ダウンロード状態を更新
      const { error: updateError } = await supabase
        .from('user_files')
        .update({ downloaded: true })
        .eq('id', file.id)

      if (updateError) throw updateError

      // ローカルの状態を更新
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === file.id ? { ...f, downloaded: true } : f
        )
      )

      toast.success("ファイルをダウンロードしました")

      // 4. Storageからファイルを削除
      const { error: deleteError } = await supabase
        .storage
        .from(STORAGE_BUCKET) // user-documentsを使用
        .remove([filePath]) // 更新されたファイルパスを使用

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
        toast.error("ストレージからの削除に失敗しました")
        return
      }

      // 5. データベースからレコードを削除
      const { error: dbDeleteError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id)

      if (dbDeleteError) {
        console.error('Database delete error:', dbDeleteError)
        toast.error("データベースからの削除に失敗しました")
        return
      }

      // ローカルの状態からファイルを削除
      setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id))

      toast.success("ファイルを完全に削除しました")

    } catch (error) {
      console.error("Download/Delete error:", error)
      toast.error(`処理に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setDownloading(prev => ({ ...prev, [file.id]: false }))
    }
  }

  const handleDelete = async (file: UserFile) => {
    if (!confirm("このファイルを削除してもよろしいですか？")) return

    setDeleting(prev => ({ ...prev, [file.id]: true }))

    try {
      const filePath = `${profileId}/${file.name}`

      // 1. Storageからファイルを削除
      const { error: storageError } = await supabase
        .storage
        .from(STORAGE_BUCKET) // user-documentsを使用
        .remove([filePath])

      if (storageError) throw storageError

      // 2. データベースからレコードを削除
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      // 削除成功後、ローカルの状態からファイルを削除
      setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id))

      toast.success("ファイルを削除しました")
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("削除に失敗しました")
    } finally {
      setDeleting(prev => ({ ...prev, [file.id]: false }))
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ユーザーファイル
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length > 0 ? (
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-white"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{file.name}</span>
                    {file.downloaded ? (
                      <Badge variant="outline">確認済み</Badge>
                    ) : (
                      <Badge>未確認</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{formatBytes(file.size)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={downloading[file.id]}
                  >
                    {downloading[file.id] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ダウンロード中...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        ダウンロード
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(file)}
                    disabled={deleting[file.id]}
                  >
                    {deleting[file.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            ファイルはありません
          </div>
        )}
      </CardContent>
    </Card>
  )
}

