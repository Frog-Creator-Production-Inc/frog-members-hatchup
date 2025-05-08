"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { formatDate } from "@/lib/utils"
import { DOCUMENT_TYPES, PURPOSE_TYPES } from "@/types/application"
import type { CourseApplication } from "@/types/application"
import { useState, useEffect } from "react"

interface ConfirmationProps {
  application: CourseApplication
  onSubmit: () => void
  onBack: () => void
}

export function Confirmation({ application, onSubmit, onBack }: ConfirmationProps) {
  const supabase = createClientComponentClient()
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("course_application_documents")
          .select(`
            id,
            document_type,
            user_files (
              id,
              name,
              size
            )
          `)
          .eq("application_id", application.id)

        if (error) throw error
        setDocuments(data || [])
      } catch (error) {
        console.error("Error fetching documents:", error)
        toast.error("書類の取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [application.id])

  const getPurposeText = (purpose: string) => {
    switch (purpose) {
      case PURPOSE_TYPES.OVERSEAS_JOB: return '海外就職'
      case PURPOSE_TYPES.CAREER_CHANGE: return 'キャリアチェンジ'
      case PURPOSE_TYPES.LANGUAGE: return '語学力向上'
      default: return purpose
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'japan_bank': return '日本の銀行送金'
      case 'credit_card': return 'クレジットカード'
      case 'canada_bank': return 'カナダの銀行送金'
      default: return method
    }
  }

  const getDocumentTypeText = (type: string) => {
    switch (type) {
      case DOCUMENT_TYPES.PASSPORT: return "パスポート"
      case DOCUMENT_TYPES.RESUME: return "履歴書"
      case DOCUMENT_TYPES.CERTIFICATE: return "証明書"
      case DOCUMENT_TYPES.OTHER: return "その他の書類"
      default: return type
    }
  }

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">申請内容の確認</h2>
      <p className="text-muted-foreground">
        以下の内容で申請を完了します。内容をご確認ください。
      </p>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">希望開始時期</p>
              <p className="font-medium">{application.preferred_start_date || "未設定"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">支払い方法</p>
              <p className="font-medium">
                {application.payment_method ? getPaymentMethodText(application.payment_method) : "未設定"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">申請目的</p>
            <p className="font-medium">
              {application.purpose ? getPurposeText(application.purpose) : "未設定"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">アップロード済み書類</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{getDocumentTypeText(doc.document_type)}</p>
                    <p className="text-sm text-muted-foreground">{doc.user_files.name}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">アップロードされた書類はありません</p>
          )}
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
        <p className="text-sm text-yellow-800">
          申請を完了すると、管理者による審査が開始されます。審査中は申請内容の変更ができません。
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onSubmit}>
          申請を完了する
        </Button>
      </div>
    </div>
  )
} 