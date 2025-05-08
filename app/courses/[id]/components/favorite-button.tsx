"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  courseId: string
  initialIsFavorite: boolean
}

export function FavoriteButton({ courseId, initialIsFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const supabase = createClientComponentClient()

  const toggleFavorite = async () => {
    try {
      setIsLoading(true)
      setIsAnimating(true)
      
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (!user || userError) {
        // ログインが必要な場合の処理
        return
      }

      if (isFavorite) {
        // お気に入りから削除
        await supabase
          .from("favorite_courses")
          .delete()
          .eq("user_id", user.id)
          .eq("course_id", courseId)
      } else {
        // お気に入りに追加
        await supabase.from("favorite_courses").insert({
          user_id: user.id,
          course_id: courseId,
        })
      }

      setIsFavorite(!isFavorite)
      
      // アニメーション終了後にアニメーション状態をリセット
      setTimeout(() => {
        setIsAnimating(false)
      }, 600)
    } catch (error) {
      console.error("Error toggling favorite:", error)
      setIsAnimating(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      size="default"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={cn(
        "transition-all duration-300",
        isFavorite && "bg-pink-600 hover:bg-pink-700 text-white"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 mr-2 transition-all duration-300",
          isAnimating && "animate-heartbeat",
          isFavorite ? "fill-white" : "fill-none"
        )}
      />
      {isFavorite ? "お気に入り済み" : "お気に入りに追加"}
    </Button>
  )
}
