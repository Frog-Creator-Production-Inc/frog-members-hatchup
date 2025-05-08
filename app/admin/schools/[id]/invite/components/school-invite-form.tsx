"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { ClipboardCopy, Mail, Send } from "lucide-react"

interface SchoolInviteFormProps {
  schoolId: string
  schoolName: string
}

export function SchoolInviteForm({ schoolId, schoolName }: SchoolInviteFormProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes("@")) {
      toast.error("有効なメールアドレスを入力してください")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/schools/${schoolId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "招待の作成に失敗しました")
      }
      
      setGeneratedUrl(data.accessUrl)
      setExpiresAt(data.expiresAt)
      toast.success(`${email}に招待を作成しました`)
      
      // フォームをリセット
      setEmail("")
    } catch (error) {
      console.error("Error inviting school staff:", error)
      toast.error("招待の作成中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }
  
  const copyToClipboard = async () => {
    if (generatedUrl) {
      try {
        await navigator.clipboard.writeText(generatedUrl)
        toast.success("リンクをクリップボードにコピーしました")
      } catch (error) {
        console.error("Failed to copy", error)
        toast.error("コピーに失敗しました")
      }
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          学校担当者を招待
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="例: school-staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              入力したメールアドレスに一時的なアクセスリンクが生成されます。
            </p>
          </div>
          
          {generatedUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border">
              <h3 className="font-medium mb-2">生成されたアクセスリンク</h3>
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-l-md text-sm bg-white"
                  value={generatedUrl}
                  readOnly
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-l-none"
                  onClick={copyToClipboard}
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-amber-600">
                このリンクを担当者に送信してください。リンクの有効期限: {expiresAt ? new Date(expiresAt).toLocaleDateString() : "30日間"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>処理中...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                招待を作成
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 