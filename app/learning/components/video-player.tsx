"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, FastForward, Rewind } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface VideoPlayerProps {
  videoId: string
  videoUrl: string
  onProgressUpdate?: (seconds: number) => void
  initialProgress?: number
}

export function VideoPlayer({ videoId, videoUrl, onProgressUpdate, initialProgress = 0 }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialProgress)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(video.currentTime))
      onProgressUpdate?.(Math.floor(video.currentTime))
    }

    const handleLoadedMetadata = () => {
      setDuration(Math.floor(video.duration))
      video.currentTime = initialProgress
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [initialProgress, onProgressUpdate])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
    }
  }

  const handleFastForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
    }
  }

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full cursor-pointer"
          src={videoUrl}
          playsInline
          onClick={togglePlay}
        />
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value)
              if (videoRef.current) {
                videoRef.current.currentTime = time
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRewind}>
            <Rewind className="h-4 w-4" />
          </Button>
          <Button onClick={togglePlay} size="icon">
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFastForward}>
            <FastForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
