"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface CourseApplication {
  id: string
  status: string
  preferred_start_date: string
  purpose: string
  payment_method: string
  created_at: string
  submitted_at: string | null
  completed_at: string | null
  course: {
    id: string
    name: string
    school: {
      id: string
      name: string
    }
  }
}

export function CourseApplications({ userId }: { userId: string }) {
  const [applications, setApplications] = useState<CourseApplication[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("course_applications")
        .select(`
          *,
          course:course_id (
            id,
            name,
            school:school_id (
              id,
              name
            )
          )
        `)
        .eq("user_id", userId)
        .neq("status", "draft")
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // デバッグ情報
      console.log("=== CourseApplications Component Debug ===")
      console.log("Total applications:", data?.length || 0)
      if (data && data.length > 0) {
        console.log("Application statuses:", data.map(app => app.status))
      } else {
        console.log("No applications found")
      }
      
      setApplications(data)
    } catch (error) {
      console.error("Error loading applications:", error)
      toast.error("申請の読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">下書き</Badge>
      case "submitted":
        return <Badge variant="secondary">申請済み</Badge>
      case "reviewing":
        return <Badge>レビュー中</Badge>
      case "approved":
        return <Badge className="bg-green-500">承認済み</Badge>
      case "rejected":
        return <Badge variant="destructive">却下</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <div className="py-4">読み込み中...</div>
  }

  if (applications.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">コース申請状況</h2>
      {applications.map((application) => (
        <Card key={application.id} className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-5 pt-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg mb-2">{application.course.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {application.course.school.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(application.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-6">
              {/* 申請情報 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium mb-1">希望開始時期</p>
                  <p className="text-sm text-muted-foreground">
                    {application.preferred_start_date || "未設定"}
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium mb-1">申請目的</p>
                  <p className="text-sm text-muted-foreground">
                    {application.purpose || "未設定"}
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium mb-1">支払い方法</p>
                  <p className="text-sm text-muted-foreground">
                    {application.payment_method || "未設定"}
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium mb-1">申請日時</p>
                  <p className="text-sm text-muted-foreground">
                    {application.status !== 'draft'
                      ? formatDate(application.created_at)
                      : "未申請"}
                  </p>
                </div>
              </div>

              {/* リンクボタン */}
              <div className="flex justify-end pt-2">
                <Link href="/course-application" passHref>
                  <Button size="lg" className="px-6">
                    申請状況の詳細を確認
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}