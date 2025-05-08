"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function StatisticsDisplay() {
  // 注: 実際のデータはサーバーサイドから取得する必要があります
  const stats = {
    totalUsers: 1000,
    activeUsers: 750,
    successfulMigrations: 250,
    averageMigrationTime: "6 months",
  }

  return (
    <div className="container mx-auto py-10">
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800">データ収集中</AlertTitle>
        <AlertDescription className="text-amber-700">
          現在、十分なデータが集まるまでの間は仮のデータを表示しています。表示されている全ての統計情報はサンプルデータであり、実際の値ではありません。
        </AlertDescription>
      </Alert>

      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>統計情報</CardTitle>
            <CardDescription>Frog Membersの利用統計</CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            サンプルデータ
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">総ユーザー数</h3>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">アクティブユーザー</h3>
              <p className="text-3xl font-bold">{stats.activeUsers}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">成功した移住</h3>
              <p className="text-3xl font-bold">{stats.successfulMigrations}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">平均移住期間</h3>
              <p className="text-3xl font-bold">{stats.averageMigrationTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

