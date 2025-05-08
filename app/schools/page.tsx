import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import SchoolSearch from "./components/school-search"
import Layout from "../components/layout"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  // Get all unique categories from schools
  const { data: schools } = await supabase.from("schools").select("categories")
  const allCategories = Array.from(new Set(schools?.flatMap((school) => school.categories || []).filter(Boolean) || []))

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">学校を探す</h1>
          <div className="flex gap-2">
            {allCategories.map((category) => (
              <Badge
                key={category}
                variant={searchParams.category === category ? "default" : "secondary"}
                className="hover:bg-secondary"
                asChild
              >
                <Link href={`/schools${category ? `?category=${encodeURIComponent(category)}` : ""}`}>{category}</Link>
              </Badge>
            ))}
          </div>
        </div>
        <SchoolSearch userId={session.user.id} selectedCategory={searchParams.category} />
      </div>
    </Layout>
  )
}

