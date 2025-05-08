"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"

interface VideoResource {
  id: string
  title: string
  description: string | null
  url: string
  type: "document" | "link" | "tool"
}

interface ResourceEditorProps {
  resource: VideoResource
  onUpdate: (resource: VideoResource) => void
  onDelete: (id: string) => void
}

export function ResourceEditor({ resource, onUpdate, onDelete }: ResourceEditorProps) {
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description || "")
  const [url, setUrl] = useState(resource.url)
  const [type, setType] = useState<"document" | "link" | "tool">(resource.type)

  const handleSave = () => {
    onUpdate({
      ...resource,
      title,
      description,
      url,
      type,
    })
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`title-${resource.id}`}>タイトル</Label>
              <Input
                id={`title-${resource.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`type-${resource.id}`}>タイプ</Label>
              <Select value={type} onValueChange={(value: "document" | "link" | "tool") => setType(value)}>
                <SelectTrigger id={`type-${resource.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">ドキュメント</SelectItem>
                  <SelectItem value="link">リンク</SelectItem>
                  <SelectItem value="tool">ツール</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`url-${resource.id}`}>URL</Label>
            <Input
              id={`url-${resource.id}`}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${resource.id}`}>説明</Label>
            <Textarea
              id={`description-${resource.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(resource.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              更新
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}