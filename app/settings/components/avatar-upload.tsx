"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { Trash2 } from "lucide-react"

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  firstName?: string | null
  email: string
  onAvatarChange?: (url: string | null) => void
}

export function AvatarUpload({ userId, avatarUrl, firstName, email, onAvatarChange }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    setCurrentAvatarUrl(avatarUrl)
  }, [avatarUrl])

  const deleteAvatar = async () => {
    try {
      setUploading(true)

      if (!currentAvatarUrl) return

      // Delete from storage
      const oldPath = currentAvatarUrl.split("/").pop()
      if (oldPath) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([`${userId}/${oldPath}`])

        if (deleteError) throw deleteError
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId)

      if (updateError) throw updateError

      setCurrentAvatarUrl(null)
      if (onAvatarChange) {
        onAvatarChange(null)
      }
      toast.success("アバターを削除しました")
    } catch (error) {
      toast.error("アバターの削除に失敗しました")
    } finally {
      setUploading(false)
    }
  }

  const uploadAvatar = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setUploading(true)

        if (!event.target.files || event.target.files.length === 0) {
          throw new Error("アバター画像を選択してください")
        }

        const file = event.target.files[0]
        const fileExt = file.name.split(".").pop()
        const filePath = `${userId}/${Math.random()}.${fileExt}`

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error("ファイルサイズは2MB以下にしてください")
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("画像ファイルを選択してください")
        }

        // Delete old avatar if exists
        if (currentAvatarUrl) {
          const oldPath = currentAvatarUrl.split("/").pop()
          if (oldPath) {
            await supabase.storage
              .from("avatars")
              .remove([`${userId}/${oldPath}`])
          }
        }

        // Upload new file
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        // Update profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", userId)

        if (updateError) throw updateError

        setCurrentAvatarUrl(publicUrl)
        if (onAvatarChange) {
          onAvatarChange(publicUrl)
        }
        toast.success("アバターを更新しました")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "アバターの更新に失敗しました")
      } finally {
        setUploading(false)
      }
    },
    [userId, currentAvatarUrl, supabase, onAvatarChange]
  )

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={currentAvatarUrl || ""} />
        <AvatarFallback className="text-lg">
          {firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-4">
        <div>
          <Label htmlFor="avatar" className="text-sm font-medium">
            プロフィール画像
          </Label>
          <p className="text-sm text-muted-foreground">
            JPG, PNG, GIF形式。2MB以下。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="relative"
            disabled={uploading}
          >
            {uploading ? "アップロード中..." : "画像を変更"}
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={uploadAvatar}
              disabled={uploading}
            />
          </Button>
          {currentAvatarUrl && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteAvatar}
              disabled={uploading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}