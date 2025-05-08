import { ReactNode } from "react"
import Layout from "@/app/components/layout"

export default function InterviewsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Layout>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </Layout>
  )
} 