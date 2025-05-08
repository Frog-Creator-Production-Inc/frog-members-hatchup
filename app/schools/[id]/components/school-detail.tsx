"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Globe, GraduationCap, Clock } from "lucide-react"
import SchoolPhotos from "./school-photos"
import SchoolCourses from "./school-courses"
import type { School } from "@/types/supabase"

interface SchoolDetailProps {
  school: School
}

export default function SchoolDetail({ school }: SchoolDetailProps) {
  const [activeTab, setActiveTab] = useState("photos")

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 学校の基本情報 */}
        <div className="md:col-span-2">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center gap-4">
              {school.logo_url && (
                <Image
                  src={school.logo_url || "/placeholder.svg"}
                  alt={school.name}
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
              )}
              <div>
                <CardTitle className="text-2xl">{school.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {school.goal_location?.city}, {school.goal_location?.country}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">ウェブサイト</p>
                    <a
                      href={school.website || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      公式サイトへ
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">カテゴリー</p>
                    <p className="text-sm">{school.category || "一般英語"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">平均経験年数</p>
                    <p className="text-sm">{school.average_years_experience || 0}年</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">学校について</h3>
                <p className="text-sm text-gray-600">{school.description}</p>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photos">写真</TabsTrigger>
              <TabsTrigger value="courses">コース情報</TabsTrigger>
            </TabsList>
            <TabsContent value="photos">
              <SchoolPhotos photos={school.photos || []} />
            </TabsContent>
            <TabsContent value="courses">
              <SchoolCourses courses={school.courses || []} />
            </TabsContent>
          </Tabs>
        </div>

        {/* サイドバー：お問い合わせフォームなど */}
        <div>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>お申し込み・お見積もり</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                資料請求（無料）
              </Button>
              <Button className="w-full">お申込み（手続き有り）</Button>
              <p className="text-xs text-center text-muted-foreground">スクールウィズから無料相談可能！</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

