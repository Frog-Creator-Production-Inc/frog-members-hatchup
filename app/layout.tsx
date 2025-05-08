import { Toaster } from "react-hot-toast"
import "./globals.css"
import { Inter } from "next/font/google"
import type { Metadata, Viewport } from "next"
import ServiceWorkerRegister from "@/components/service-worker-register"
import { ThemeProvider } from "@/components/theme-provider"
import { cookies } from "next/headers"
import { ClientCookiesProvider } from '@/components/ClientCookiesProvider'
import { Providers } from "./providers"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Frog Members",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.microcms-assets.io" crossOrigin="anonymous" />
        <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body>
        <ClientCookiesProvider value={cookies().getAll()}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              {children}
              <Toaster />
              <ServiceWorkerRegister />
            </Providers>
          </ThemeProvider>
        </ClientCookiesProvider>
      </body>
    </html>
  )
}