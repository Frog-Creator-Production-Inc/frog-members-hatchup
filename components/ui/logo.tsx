"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  src?: string
  alt?: string
  size?: number | string
  className?: string
  priority?: boolean
  withContainer?: boolean
  containerClassName?: string
}

/**
 * ロゴを表示するコンポーネント
 */
export function Logo({
  src = "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png",
  alt = "Logo",
  size = 40,
  className,
  priority = false,
  withContainer = false,
  containerClassName
}: LogoProps) {
  // サイズをピクセル単位に変換
  const sizeValue = typeof size === 'number' ? `${size}px` : size

  const logoImage = (
    <div className={cn("relative", className)} style={{ width: sizeValue, height: sizeValue }}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-contain"
      />
    </div>
  )

  if (withContainer) {
    return (
      <div className={cn("logo-container relative", containerClassName)}>
        <div className="wave-container absolute inset-0 rounded-full overflow-hidden bg-white/80">
          <div className="wave-effect">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
          {logoImage}
        </div>
      </div>
    )
  }

  return logoImage
} 