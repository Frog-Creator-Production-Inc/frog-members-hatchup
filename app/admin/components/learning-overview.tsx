"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { Play, Users } from "lucide-react"

export function LearningOverview() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalMembers: 0,
    completionRate: 0,
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadStats = async () => {
      const [videosResult, membersResult, progressResult] = await Promise.all([
        supabase
          .from("learning_videos")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_member", true),
        supabase
          .from("video_progress")
          .select("*", { count: "exact", head: true })
          .eq("completed", true),
      ])

      setStats({
        totalVideos: videosResult.count || 0,
        totalMembers: membersResult.count || 0,
        completionRate: progressResult.count ? 
          Math.round((progressResult.count / (videosResult.count || 1)) * 100) : 0,
      })
    }

    loadStats()
  }, [supabase])

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>学習コンテンツ概要</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/learning">管理画面へ</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-4 rounded-lg border">
              <Play className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">総ビデオ数</p>
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 rounded-lg border">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">メンバー数</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border">
            <p className="text-sm font-medium mb-2">平均完了率</p>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-primary/20">
                <div
                  style={{ width: `${stats.completionRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                />
              </div>
              <p className="text-right text-sm mt-1">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}