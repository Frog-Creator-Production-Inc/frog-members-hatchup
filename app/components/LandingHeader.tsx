import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingHeader() {
  return (
    <header className="bg-white shadow-sm py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <Image 
              src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png" 
              alt="Frog Members Logo" 
              width={150} 
              height={40} 
              unoptimized
              className="h-14 w-auto"
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/auth">ログイン</Link>
          </Button>
          <Button asChild>
            <Link href="/auth">新規登録</Link>
          </Button>
        </div>
      </div>
    </header>
  )
} 