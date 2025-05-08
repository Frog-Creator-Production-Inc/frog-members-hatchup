"use client"

import { Course } from "@/types/course"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Link from "next/link"

interface CourseListProps {
  courses: Course[]
  isSubscribed: boolean
}

export function CourseList({ courses, isSubscribed }: CourseListProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">利用可能なコース</h2>
      
      {courses.length === 0 ? (
        <p className="text-muted-foreground">現在利用可能なコースはありません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {course.lessons_count || 0}レッスン
                </p>
              </CardContent>
              <CardFooter>
                {isSubscribed ? (
                  <Button asChild className="w-full">
                    <Link href={`/learning/courses/${course.id}`}>
                      コースを見る
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    <Lock className="mr-2 h-4 w-4" />
                    メンバーシップが必要です
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 