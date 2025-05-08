import { Suspense } from "react"
import Layout from "@/app/components/layout"
import { CourseContent } from "./components/course-content"
import { CourseLoading } from "./components/course-loading"
import { Metadata } from "next"

interface CoursePageProps {
  params: {
    id: string
  }
}

// キャッシュの設定
export const dynamic = "force-dynamic" // 動的ルートのため
export const revalidate = 3600 // 1時間ごとに再検証

// generateMetadataも追加してSEO対策
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  return {
    title: "コース詳細 | Frog Members",
    description: "コース詳細ページです。",
  }
}

export default function CoursePage({ params }: CoursePageProps) {
  return (
    <Layout>
      <Suspense fallback={<CourseLoading />}>
        <CourseContent courseId={params.id} />
      </Suspense>
    </Layout>
  )
}
