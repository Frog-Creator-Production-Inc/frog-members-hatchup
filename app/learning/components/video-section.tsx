"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Check } from "lucide-react"
import { VideoPlayer } from "./video-player"
import { ResourceList } from "./resource-list"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
  video_resources: VideoResource[]
}

interface VideoSectionProps {
  title: string
  description: string | null
  videos: Video[]
  userId: string
  progress: Record<string, { progress_seconds: number; completed: boolean }>
}

export function VideoSection({ title, description, videos, userId, progress }: VideoSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const supabase = createClientComponentClient()

  const handleProgressUpdate = async (videoId: string, seconds: number) => {
    try {
      const isCompleted = progress[videoId]?.completed || false
      const { error } = await supabase.from("video_progress").upsert({
        user_id: userId,
        video_id: videoId,
        progress_seconds: seconds,
        completed: isCompleted,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }

  const handleVideoComplete = async (videoId: string) => {
    try {
      const { error } = await supabase.from("video_progress").upsert({
        user_id: userId,
        video_id: videoId,
        progress_seconds: progress[videoId]?.progress_seconds || 0,
        completed: true,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error marking video as complete:", error)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {selectedVideo ? (
            <div className="space-y-6">
              <VideoPlayer
                videoId={selectedVideo.id}
                videoUrl={selectedVideo.storage_path}
                initialProgress={progress[selectedVideo.id]?.progress_seconds || 0}
                onProgressUpdate={(seconds) => handleProgressUpdate(selectedVideo.id, seconds)}
              />
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{selectedVideo.title}</h3>
                  {selectedVideo.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedVideo.description}
                    </p>
                  )}
                </div>

                {/* 関連リソースの表示 */}
                {selectedVideo.video_resources && selectedVideo.video_resources.length > 0 && (
                  <ResourceList resources={selectedVideo.video_resources} />
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVideo(null)}
                  >
                    ビデオ一覧に戻る
                  </Button>
                  <Button
                    onClick={() => handleVideoComplete(selectedVideo.id)}
                    disabled={progress[selectedVideo.id]?.completed}
                  >
                    {progress[selectedVideo.id]?.completed ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        完了済み
                      </>
                    ) : (
                      "完了としてマーク"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <div>
                      <h4 className="font-medium text-sm">{video.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {video.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{video.duration}</Badge>
                    {progress[video.id]?.completed && (
                      <Badge variant="default">
                        <Check className="h-3 w-3 mr-1" />
                        完了
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}