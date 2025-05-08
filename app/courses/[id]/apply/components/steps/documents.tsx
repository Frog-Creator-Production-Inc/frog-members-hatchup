"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { FileUpload } from "@/components/file-upload"
import { DOCUMENT_TYPES, DOCUMENT_STATUS } from "@/types/application"
import type { CourseApplication } from "@/types/application"
import { formatBytes } from "@/lib/utils"

interface DocumentsProps {
  application: CourseApplication
  onNext: () => void
  onBack: () => void
}

export function Documents({ application, onNext, onBack }: DocumentsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const supabase = createClientComponentClient()

  // コンポーネントマウント時に既存のドキュメントを取得
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from("course_application_documents")
          .select(`
            id,
            document_type,
            status,
            user_files (
              id,
              name,
              size,
              type
            )
          `)
          .eq("application_id", application.id)

        if (error) throw error
        setDocuments(data || [])
      } catch (error) {
        console.error("Error fetching documents:", error)
        toast.error("書類の取得に失敗しました")
      }
    }

    fetchDocuments()
  }, [application.id, supabase])

  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      setIsUploading(true)
      
      // ファイルをストレージにアップロード
      const fileName = `${Date.now()}_${file.name}`
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("ユーザー情報の取得に失敗しました")
        return
      }
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('user-documents')
        .upload(`${user.id}/${fileName}`, file)
        
      if (uploadError) throw uploadError
      
      // ファイル情報をデータベースに保存
      const { data: fileData, error: fileError } = await supabase
        .from('user_files')
        .insert({
          name: file.name,
          size: file.size,
          type: file.type,
          path: fileName,
          user_id: user.id
        })
        .select()
        .single()
        
      if (fileError) throw fileError
      
      // ドキュメントとファイルを関連付け
      const { error: docError } = await supabase
        .from('course_application_documents')
        .insert({
          application_id: application.id,
          file_id: fileData.id,
          document_type: documentType,
          status: DOCUMENT_STATUS.PENDING
        })
        
      if (docError) throw docError
      
      toast.success("ファイルをアップロードしました")
      
      // ドキュメント一覧を更新
      const { data, error } = await supabase
        .from("course_application_documents")
        .select(`
          id,
          document_type,
          status,
          user_files (
            id,
            name,
            size,
            type
          )
        `)
        .eq("application_id", application.id)

      if (error) throw error
      setDocuments(data || [])
      
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("ファイルのアップロードに失敗しました")
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('course_application_documents')
        .delete()
        .eq('id', documentId)
        
      if (error) throw error
      
      // ドキュメント一覧を更新
      setDocuments(documents.filter(doc => doc.id !== documentId))
      toast.success("書類を削除しました")
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error("書類の削除に失敗しました")
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case DOCUMENT_TYPES.PASSPORT: return "パスポート"
      case DOCUMENT_TYPES.RESUME: return "履歴書"
      case DOCUMENT_TYPES.CERTIFICATE: return "証明書"
      case DOCUMENT_TYPES.OTHER: return "その他"
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">必要書類のアップロード</h2>
      <p className="text-muted-foreground">
        以下の書類をアップロードしてください。すべての書類は審査の対象となります。
      </p>

      <div className="space-y-4">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">パスポート</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                パスポートの顔写真ページをアップロードしてください。
              </p>
              {documents.some(doc => doc.document_type === DOCUMENT_TYPES.PASSPORT) ? (
                documents
                  .filter(doc => doc.document_type === DOCUMENT_TYPES.PASSPORT)
                  .map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{doc.user_files.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(doc.user_files.size)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        削除
                      </Button>
                    </div>
                  ))
              ) : (
                <FileUpload
                  onUpload={(file) => handleFileUpload(file, DOCUMENT_TYPES.PASSPORT)}
                  isUploading={isUploading}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">履歴書</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                最新の履歴書をアップロードしてください。
              </p>
              {documents.some(doc => doc.document_type === DOCUMENT_TYPES.RESUME) ? (
                documents
                  .filter(doc => doc.document_type === DOCUMENT_TYPES.RESUME)
                  .map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{doc.user_files.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(doc.user_files.size)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        削除
                      </Button>
                    </div>
                  ))
              ) : (
                <FileUpload
                  onUpload={(file) => handleFileUpload(file, DOCUMENT_TYPES.RESUME)}
                  isUploading={isUploading}
                  accept=".pdf,.doc,.docx"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">その他の書類</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                その他必要な書類があればアップロードしてください。
              </p>
              {documents.some(doc => doc.document_type === DOCUMENT_TYPES.OTHER) ? (
                documents
                  .filter(doc => doc.document_type === DOCUMENT_TYPES.OTHER)
                  .map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{doc.user_files.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(doc.user_files.size)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        削除
                      </Button>
                    </div>
                  ))
              ) : (
                <FileUpload
                  onUpload={(file) => handleFileUpload(file, DOCUMENT_TYPES.OTHER)}
                  isUploading={isUploading}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onNext}>
          次へ
        </Button>
      </div>
    </div>
  )
} 