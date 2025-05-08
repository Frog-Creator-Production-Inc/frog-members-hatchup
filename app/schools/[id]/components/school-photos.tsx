import { Camera } from "lucide-react"
import Image from "next/image"
import type { SchoolPhoto } from "@/types/database.types"

interface SchoolPhotosProps {
  photos: SchoolPhoto[] | any[]
}

export default function SchoolPhotos({ photos }: SchoolPhotosProps) {
  if (!photos || photos.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">写真はありません</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="space-y-4">
        {photos.map((photo, index) => {
          return (
            <div 
              key={photo.id || index} 
              className="relative aspect-[16/9] rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <Image
                src={photo.url}
                alt={photo.description || `学校の写真 ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index < 4}
              />
              {photo.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-sm">
                  {photo.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}

