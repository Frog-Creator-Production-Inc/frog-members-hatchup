'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/lib/microcms'
import type { MicroCMSImage } from 'microcms-js-sdk'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string | MicroCMSImage | undefined
  alt: string
  width?: number
  height?: number
  priority?: boolean
  quality?: number
  className?: string
  sizes?: string
  fill?: boolean
  loading?: 'eager' | 'lazy'
  placeholder?: 'blur' | 'empty'
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width = 800,
  height,
  priority = false,
  quality = 80,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  loading,
  placeholder,
  style,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setHasError(true)
      return
    }

    try {
      // MicroCMSの画像オブジェクトの場合
      if (typeof src === 'object' && src.url) {
        setImageUrl(getOptimizedImageUrl(src.url, width, 'webp', quality))
      } 
      // 文字列の場合
      else if (typeof src === 'string') {
        // MicroCMSの画像URLかどうかをチェック
        if (src.includes('images.microcms-assets.io')) {
          setImageUrl(getOptimizedImageUrl(src, width, 'webp', quality))
        } else {
          setImageUrl(src)
        }
      }
    } catch (error) {
      setHasError(true)
    }
  }, [src, width, quality])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  // 画像URLがない場合やエラーの場合はプレースホルダーを表示
  if (!imageUrl || hasError) {
    return (
      <div 
        className={cn(
          'bg-gray-200 flex items-center justify-center text-gray-400',
          className
        )}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height || 'auto',
          ...style
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} style={style}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <svg 
            className="w-8 h-8 text-gray-300" 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="12" x2="12" y1="2" y2="6" />
            <line x1="12" x2="12" y1="18" y2="22" />
            <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
            <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
            <line x1="2" x2="6" y1="12" y2="12" />
            <line x1="18" x2="22" y1="12" y2="12" />
            <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
            <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
          </svg>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        quality={quality}
        sizes={sizes}
        fill={fill}
        loading={loading || (priority ? 'eager' : 'lazy')}
        placeholder={placeholder}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  )
} 