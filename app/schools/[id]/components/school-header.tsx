import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, GraduationCap, ArrowLeft, School, Briefcase, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { GoalLocation } from "@/types/database.types"
import type { SchoolPhoto } from "@/types/database.types"

interface SchoolHeaderProps {
  name: string
  logo: string | null
  website: string | null
  location: GoalLocation | null | undefined
  categories: string[]
  jobPositionsByIndustry: Map<string, string[]>
}

export default function SchoolHeader({
  name,
  logo,
  website,
  location,
  categories,
  jobPositionsByIndustry,
}: SchoolHeaderProps) {
  // Map型をオブジェクトに変換して扱いやすくする
  const industryGroups = Array.from(jobPositionsByIndustry.entries()).map(([industry, titles]) => ({
    industry,
    titles
  }));

  return (
    <div className="space-y-6">
      {/* ナビゲーションリンク */}
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="gap-1 pl-0 hover:pl-1 transition-all">
          <Link href="/schools">
            <ArrowLeft className="h-4 w-4" />
            学校一覧に戻る
          </Link>
        </Button>
      </div>
      
      {/* 学校ヘッダーカード */}
      <Card className="overflow-hidden">
        {/* 学校ロゴと名前を上部に配置 */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b bg-white">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 relative flex-shrink-0">
              {logo ? (
                <Image
                  src={logo}
                  alt={`${name} logo`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
              
              {/* カテゴリーバッジ - 学校名の直下に表示 */}
              <div className="flex flex-wrap gap-2 mt-2">
                {categories && categories.length > 0 ? categories.map((category) => (
                  <Badge key={category} variant="default" className="bg-primary/90">{category}</Badge>
                )) : (
                  <span className="text-sm text-muted-foreground">カテゴリーなし</span>
                )}
              </div>
            </div>
          </div>
          
          {website && (
            <Button variant="outline" asChild className="mt-2 md:mt-0">
              <a href={website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                学校のウェブサイト
              </a>
            </Button>
          )}
        </div>
        
        <div className="relative w-full bg-gray-100 p-6">
          <div>
            {/* 学校名と場所 */}
            <div>
              {location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                  <span>
                    {location.city}, {location.country}
                  </span>
                </div>
              )}
            </div>
            
            {/* 職種情報 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                この学校で学べる職種
              </h2>
              
              {industryGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {industryGroups.map(group => (
                    <div key={group.industry} className="bg-white rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-primary mb-2">{group.industry}</h3>
                      <ul className="space-y-1">
                        {group.titles.map(title => (
                          <li key={title} className="flex items-center gap-2 text-sm">
                            <Users className="h-3 w-3 text-gray-400" />
                            {title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">職種情報はありません</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

