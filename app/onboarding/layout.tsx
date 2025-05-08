import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Frog Members | オンボーディング",
  description: "海外就職の第一歩を踏み出そう",
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50 flex flex-col">{children}</div>
}

