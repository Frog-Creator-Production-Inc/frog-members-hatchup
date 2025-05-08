"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { Input } from "@/components/ui/input"

interface Template {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  category?: string
  gallery_category?: string
  folder?: string
}

interface ApiResponse {
  error?: string
  results?: Template[]
  data?: Template[]
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")

  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    setRawResponse(null)
    
    try {
      const response = await fetch("/api/content-snare/admin/get-templates")
      
      // レスポンスの生データを保存
      const responseText = await response.text()
      setRawResponse(responseText)
      
      // JSONとしてパースを試みる
      let parsedData: ApiResponse | Template[]
      try {
        parsedData = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`レスポンスのJSONパースに失敗しました: ${responseText.substring(0, 100)}...`)
      }
      
      if (!response.ok) {
        const errorMsg = 'error' in parsedData && parsedData.error 
          ? parsedData.error 
          : "テンプレートの取得に失敗しました"
        throw new Error(errorMsg)
      }
      
      // データを適切な形式に変換
      let templateData: Template[] = []
      
      // データが配列かどうか確認
      if (Array.isArray(parsedData)) {
        templateData = parsedData
      } else {
        console.warn("オブジェクト形式のレスポンス:", parsedData)
        
        // Content Snare APIの可能性のある形式をチェック
        if (parsedData.results && Array.isArray(parsedData.results)) {
          templateData = parsedData.results
        } else if (parsedData.data && Array.isArray(parsedData.data)) {
          templateData = parsedData.data
        } else {
          throw new Error(`予期しないレスポンス形式です: ${JSON.stringify(parsedData).substring(0, 100)}...`)
        }
      }

      // テンプレートデータを設定
      setTemplates(templateData)
      setFilteredTemplates(templateData)
      
      if (templateData.length > 0) {
        toast.success(`${templateData.length}件のテンプレートが見つかりました`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "テンプレートの取得中にエラーが発生しました"
      setError(errorMessage)
      toast.error("テンプレート取得エラー: " + errorMessage)
      console.error("テンプレート取得エラー:", err)
    } finally {
      setLoading(false)
    }
  }

  // 検索語変更時のハンドラ
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)
    
    if (!value.trim()) {
      setFilteredTemplates(templates)
      return
    }
    
    const searchLower = value.toLowerCase()
    const filtered = templates.filter(template => 
      template.name.toLowerCase().includes(searchLower) || 
      (template.description && template.description.toLowerCase().includes(searchLower))
    )
    setFilteredTemplates(filtered)
  }

  // 初期ロード
  useEffect(() => {
    fetchTemplates()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Content Snareテンプレート</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchTemplates}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          更新
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>エラーが発生しました</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {rawResponse && (
              <div className="mt-4 p-2 bg-gray-100 rounded-md overflow-auto max-h-48 text-left text-xs">
                <p className="font-semibold mb-1">APIレスポンス:</p>
                <pre>{rawResponse}</pre>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTemplates}
              className="mt-4"
            >
              再試行
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="テンプレート名で検索..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="max-w-sm"
                />
              </div>
              <div className="text-sm text-gray-500">
                {filteredTemplates.length} / {templates.length} テンプレート
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">テンプレートが見つかりません</p>
                {templates.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    検索条件に一致するテンプレートがありません。検索条件を変更してください。
                  </p>
                )}
                {rawResponse && templates.length === 0 && (
                  <div className="mt-4 p-2 bg-gray-100 rounded-md overflow-auto max-h-48 text-left text-xs">
                    <p className="font-semibold mb-1">APIレスポンス:</p>
                    <pre>{rawResponse}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>名前</TableHead>
                      <TableHead>説明</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>更新日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-mono">{template.id}</TableCell>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>{template.description || "-"}</TableCell>
                        <TableCell>{template.gallery_category || template.category || template.folder || "-"}</TableCell>
                        <TableCell>{formatDate(template.created_at)}</TableCell>
                        <TableCell>{formatDate(template.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 