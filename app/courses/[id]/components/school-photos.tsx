"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Photo {
  id: string;
  url: string;
  description: string | null;
  // 必要に応じてオプションプロパティとして追加
  school_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface SchoolPhotosProps {
  schoolName: string;
  photos: Photo[];
  className?: string;
}

export function SchoolPhotos({ schoolName, photos, className }: SchoolPhotosProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
    setIsDialogOpen(true)
  }

  const handleClose = () => {
    setIsDialogOpen(false)
  }

  const handleNext = () => {
    if (selectedPhotoIndex !== null && photos.length > 0) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length)
    }
  }

  const handlePrevious = () => {
    if (selectedPhotoIndex !== null && photos.length > 0) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length)
    }
  }

  if (!photos || photos.length === 0) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>
        写真はまだありません
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2 p-4">
        {photos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="relative aspect-[4/3] rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handlePhotoClick(index)}
          >
            <Image
              src={photo.url}
              alt={photo.description || `${schoolName}の写真 ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-0">
          {selectedPhotoIndex !== null && (
            <div className="relative">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={photos[selectedPhotoIndex].url}
                  alt={photos[selectedPhotoIndex].description || `${schoolName}の写真 ${selectedPhotoIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
              
              {photos[selectedPhotoIndex].description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-sm">
                  {photos[selectedPhotoIndex].description}
                </div>
              )}
              
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center"
              >
                ←
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center"
              >
                →
              </button>
              
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 