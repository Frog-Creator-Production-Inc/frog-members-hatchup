import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"

interface CategoryFilterProps {
  categories: string[]
  selectedCategory?: string
}

export default function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Tag className="h-4 w-4" />
        <span>カテゴリーでフィルター</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button 
          asChild 
          variant={selectedCategory ? "outline" : "default"} 
          size="sm"
          className={selectedCategory ? "bg-gray-100 hover:bg-gray-200" : ""}
        >
          <Link href="/courses">全て</Link>
        </Button>
        {categories.map((category) => (
          <Button 
            key={category} 
            asChild 
            variant={category === selectedCategory ? "default" : "outline"} 
            size="sm"
            className={category !== selectedCategory ? "bg-gray-100 hover:bg-gray-200" : ""}
          >
            <Link href={`/courses?category=${encodeURIComponent(category)}`}>{category}</Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

