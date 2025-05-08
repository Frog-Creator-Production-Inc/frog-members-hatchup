"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import Image from "next/image"

export function SchoolOverview() {
  const [recentSchools, setRecentSchools] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRecentSchools = async () => {
      const { data } = await supabase
        .from("schools")
        .select(`
          id,
          name,
          logo_url,
          courses (count)
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      setRecentSchools(data || [])
    }

    fetchRecentSchools()
  }, [supabase])

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>学校・コース概要</CardTitle>
        <div className="space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/schools">学校一覧</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/courses">コース一覧</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentSchools.map((school) => (
            <div
              key={school.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10">
                  <Image
                    src={school.logo_url || "/placeholder-logo.png"}
                    alt={school.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="text-sm text-muted-foreground">
                    コース数: {school.courses?.[0]?.count || 0}
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href={`/admin/schools/${school.id}`}>
                  詳細
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}