import { ReactNode } from "react"
import LandingLayout from "../components/LandingLayout"

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <LandingLayout className="bg-gray-50">
      {/* メインコンテンツ */}
      {children}
    </LandingLayout>
  )
} 