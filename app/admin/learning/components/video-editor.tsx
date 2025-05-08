"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Trash2, Plus, Video as VideoIcon } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { ResourceEditor } from "./resource-editor"

interface VideoResource {
  id: string
  title: string
  description: string | null
  url: string
  type: "document" | "link" | "tool"
}

interface Video {
  id: string
  title: string
  description: string | null
  duration: string
  storage_path: string
  thumbnail_url: string | null
  order_index: number
  video_resources: VideoResource[]
}

interface VideoEditorProps {
  video: Video
  onBack: () => void
  onUpdate: (video: Video) => void
}

const MAX_FILE_SIZE = 1000 * 1024 * 1024 // 1000MB

export function VideoEditor({ video, onBack, onUpdate }: VideoEditorProps) {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description || "")
  const [duration, setDuration] = useState(video.duration)
  const [resources, setResources] = useState<VideoResource[]>(video.video_resources || [])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoPath, setVideoPath] = useState(video.storage_path)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update video details
      const { error: videoError } = await supabase
        .from("learning_videos")
        .update({
          title,
          description,
          duration,
          updated_at: new Date().toISOString(),
        })
        .eq("id", video.id)

      if (videoError) throw videoError

      // Update resources
      for (const resource of resources) {
        const { error: resourceError } = await supabase
          .from("video_resources")
          .upsert({
            id: resource.id,
            video_id: video.id,
            title: resource.title,
            description: resource.description,
            url: resource.url,
            type: resource.type,
          })

        if (resourceError) throw resourceError
      }

      onUpdate({
        ...video,
        title,
        description,
        duration,
        storage_path: videoPath,
        video_resources: resources,
      })
      
      toast.success("ビデオを更新しました")
    } catch (error) {
      console.error("Error updating video:", error)
      toast.error("ビデオの更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("このビデオを削除してもよろしいですか？")) {
      return
    }

    try {
      setLoading(true)

      // Delete video file from storage if exists
      if (videoPath) {
        const filePath = videoPath.split("/").pop()
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from("learning-videos")
            .remove([filePath])

          if (storageError) throw storageError
        }
      }

      // Delete video record from database
      const { error } = await supabase
        .from("learning_videos")
        .delete()
        .eq("id", video.id)

      if (error) throw error

      toast.success("ビデオを削除しました")
      onBack()
    } catch (error) {
      console.error("Error deleting video:", error)
      toast.error("ビデオの削除に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    try {
      const file = e.target.files[0]

      // ファイルサイズチェック
      if (file.size > MAX_FILE_SIZE) {
        toast.error("ファイルサイズは500MB以下にしてください")
        return
      }

      // ファイル形式チェック
      if (!file.type.startsWith("video/")) {
        toast.error("動画ファイルを選択してください")
        return
      }

      setUploading(true)
      const fileExt = file.name.split(".").pop()
      const filePath = `${video.id}-${Math.random()}.${fileExt}`

      // Delete old video if exists
      if (videoPath) {
        const oldPath = videoPath.split("/").pop()
        if (oldPath) {
          await supabase.storage
            .from("learning-videos")
            .remove([oldPath])
        }
      }

      // Upload new video
      const { error: uploadError } = await supabase.storage
        .from("learning-videos")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("learning-videos")
        .getPublicUrl(filePath)

      // Update video record
      const { error: updateError } = await supabase
        .from("learning_videos")
        .update({ storage_path: publicUrl })
        .eq("id", video.id)

      if (updateError) throw updateError

      setVideoPath(publicUrl)
      toast.success("動画をアップロードしました")
    } catch (error) {
      console.error("Error uploading video:", error)
      toast.error("動画のアップロードに失敗しました")
    } finally {
      setUploading(false)
    }
  }

  const handleAddResource = async () => {
    try {
      const { data, error } = await supabase
        .from("video_resources")
        .insert({
          video_id: video.id,
          title: "新しいリソース",
          description: "",
          url: "",
          type: "link",
        })
        .select()
        .single()

      if (error) throw error

      setResources([...resources, data])
      toast.success("リソースを追加しました")
    } catch (error) {
      console.error("Error adding resource:", error)
      toast.error("リソースの追加に失敗しました")
    }
  }

  const handleUpdateResource = async (updatedResource: VideoResource) => {
    try {
      const { error } = await supabase
        .from("video_resources")
        .update({
          title: updatedResource.title,
          description: updatedResource.description,
          url: updatedResource.url,
          type: updatedResource.type,
        })
        .eq("id", updatedResource.id)

      if (error) throw error

      setResources(resources.map(r => 
        r.id === updatedResource.id ? updatedResource : r
      ))
      toast.success("リソースを更新しました")
    } catch (error) {
      console.error("Error updating resource:", error)
      toast.error("リソースの更新に失敗しました")
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from("video_resources")
        .delete()
        .eq("id", resourceId)

      if (error) throw error

      setResources(resources.filter(r => r.id !== resourceId))
      toast.success("リソースを削除しました")
    } catch (error) {
      console.error("Error deleting resource:", error)
      toast.error("リソースの削除に失敗しました")
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>ビデオの編集</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">長さ</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="例: 10:30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video">動画ファイル</Label>
              <div className="space-y-2">
                {videoPath ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <VideoIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">アップロード済み</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
                    <VideoIcon className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">未アップロード</span>
                  </div>
                )}
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                />
                <p className="text-sm text-muted-foreground">
                  1000MB以下の動画ファイルをアップロードしてください
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">関連リソース</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddResource}
              >
                <Plus className="h-4 w-4 mr-2" />
                リソースを追加
              </Button>
            </div>
            <div className="space-y-4">
              {resources.map((resource) => (
                <ResourceEditor
                  key={resource.id}
                  resource={resource}
                  onUpdate={handleUpdateResource}
                  onDelete={handleDeleteResource}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "更新中..." : "更新"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}