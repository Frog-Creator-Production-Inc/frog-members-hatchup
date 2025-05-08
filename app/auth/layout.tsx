import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Frog Members - ログイン",
  description: "エンジニアの海外就職をサポート",
  icons: {
    icon: [
      {
        url: "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4FD1C5",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
} 