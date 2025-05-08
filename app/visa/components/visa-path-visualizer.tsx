"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, FileText, ArrowRight } from "lucide-react"
import { getVisaTypes, getVisaPaths } from "@/lib/supabase/queries"
import type { VisaType, VisaPath } from "@/types/supabase"

interface VisaPathVisualizerProps {
  userId: string
}

export default function VisaPathVisualizer({ userId }: VisaPathVisualizerProps) {
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
  const [visaPaths, setVisaPaths] = useState<VisaPath[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVisaId, setSelectedVisaId] = useState<string | null>(null)

  useEffect(() => {
    const loadVisaData = async () => {
      try {
        const [typesData, pathsData] = await Promise.all([getVisaTypes(), getVisaPaths()])
        setVisaTypes(typesData)
        setVisaPaths(pathsData)
      } catch (error) {
        // エラー時の処理
      } finally {
        setLoading(false)
      }
    }

    loadVisaData()
  }, [])

  const getNextVisas = (currentVisaId: string) => {
    return visaPaths
      .filter((path) => path.from_visa_id === currentVisaId)
      .map((path) => ({
        path,
        visa: visaTypes.find((v) => v.id === path.to_visa_id),
      }))
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="space-y-8">
      {/* ビザタイプの選択 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visaTypes.map((visa) => (
          <Card
            key={visa.id}
            className={`cursor-pointer transition-colors ${selectedVisaId === visa.id ? "border-primary" : ""}`}
            onClick={() => setSelectedVisaId(visa.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{visa.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">{visa.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>処理時間: {visa.average_processing_time}日</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>必要書類: {visa.requirements ? Object.keys(visa.requirements).join(", ") : "情報なし"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ビザパスの表示 */}
      {selectedVisaId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">次のステップ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getNextVisas(selectedVisaId).map(({ path, visa }) => (
              <div key={path.id} className="relative">
                <ArrowRight className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">{visa?.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">{path.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>移行時間: {path.average_transition_time}日</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>
                          必要書類:{" "}
                          {path.required_documents ? Object.keys(path.required_documents).join(", ") : "情報なし"}
                        </span>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => setSelectedVisaId(visa?.id ?? null)}>
                        詳細を見る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

