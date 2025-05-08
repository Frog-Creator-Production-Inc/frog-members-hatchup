"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SectionEditor } from "./section-editor"
import { VideoEditor } from "./video-editor"
import { ResourceEditor } from "./resource-editor"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"

interface VideoResource {
  id: string
  video_id: string
  title: string
  description: string | null
  url: string
  type: string
  created_at: string
  updated_at: string
}

interface Video {
  id: string
  section_id: string
  title: string
  description: string | null
  duration: string
  storage_path: string
  thumbnail_url: string | null
  order_index: number
  created_at: string
  updated_at: string
  video_resources?: VideoResource[]
}

interface Section {
  id: string
  title: string
  description: string | null
  order_index: number
  videos?: Video[]
}

interface LearningManagementProps {
  initialSections: Section[]
}

export function LearningManagement({ initialSections }: LearningManagementProps) {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section)
    setSelectedVideo(null)
  }

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleBack = () => {
    if (selectedVideo) {
      setSelectedVideo(null)
    } else if (selectedSection) {
      setSelectedSection(null)
    }
  }

  const handleSectionUpdate = (updatedSection: Section) => {
    setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s))
    setSelectedSection(null)
  }

  const handleVideoUpdate = (updatedVideo: Video) => {
    const updatedSections = sections.map(section => {
      if (section.id === selectedSection?.id) {
        return {
          ...section,
          videos: section.videos?.map(v => 
            v.id === updatedVideo.id ? updatedVideo : v
          )
        }
      }
      return section
    })
    setSections(updatedSections)
    setSelectedVideo(null)
  }

  const handleAddSection = async () => {
    try {
      setLoading(true)
      const newOrderIndex = sections.length

      const { data: newSection, error } = await supabase
        .from("video_sections")
        .insert({
          title: "新しいセクション",
          description: "",
          order_index: newOrderIndex,
        })
        .select()
        .single()

      if (error) throw error

      setSections([...sections, { ...newSection, videos: [] }])
      toast.success("新しいセクションを追加しました")
    } catch (error) {
      console.error("Error adding section:", error)
      toast.error("セクションの追加に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleAddVideo = async (sectionId: string) => {
    try {
      setLoading(true)
      const section = sections.find(s => s.id === sectionId)
      if (!section) return

      const newOrderIndex = section.videos?.length || 0

      const { data: newVideo, error } = await supabase
        .from("learning_videos")
        .insert({
          section_id: sectionId,
          title: "新しいビデオ",
          description: "",
          duration: "00:00",
          storage_path: "",
          order_index: newOrderIndex,
        })
        .select()
        .single()

      if (error) throw error

      const updatedSections = sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            videos: [...(s.videos || []), { ...newVideo, video_resources: [] }],
          }
        }
        return s
      })

      setSections(updatedSections)
      toast.success("新しいビデオを追加しました")
    } catch (error) {
      console.error("Error adding video:", error)
      toast.error("ビデオの追加に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {selectedVideo ? (
        <VideoEditor
          video={selectedVideo}
          onBack={handleBack}
          onUpdate={handleVideoUpdate}
        />
      ) : selectedSection ? (
        <SectionEditor
          section={selectedSection}
          onBack={handleBack}
          onUpdate={handleSectionUpdate}
        />
      ) : (
        <div className="grid gap-6">
          <Button 
            className="w-fit"
            onClick={handleAddSection}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            新しいセクションを追加
          </Button>
          {sections.map((section) => (
            <Card key={section.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.description && (
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleSectionSelect(section)}>
                      セクションを編集
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleAddVideo(section.id)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      ビデオを追加
                    </Button>
                  </div>
                  {section.videos && section.videos.length > 0 && (
                    <div className="grid gap-2 mt-4">
                      {section.videos.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <h4 className="font-medium">{video.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {video.duration}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleVideoSelect(video)}
                          >
                            編集
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}