"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { School } from "@/types/supabase"

interface SchoolListProps {
  schools: School[]
}

export default function SchoolList({ schools }: SchoolListProps) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">語学学校一覧</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Link href={`/schools/${school.id}`} key={school.id}>
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle>{school.name}</CardTitle>
                <CardDescription>{school.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{school.description.substring(0, 100)}...</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

