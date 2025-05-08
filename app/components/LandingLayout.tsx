import { ReactNode } from "react"
import LandingHeader from "./LandingHeader"
import LandingFooter from "./LandingFooter"

interface LandingLayoutProps {
  children: ReactNode
  className?: string
}

export default function LandingLayout({ children, className = "" }: LandingLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      <LandingHeader />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <LandingFooter />
    </div>
  )
} 