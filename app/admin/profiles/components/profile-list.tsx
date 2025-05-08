"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  User, 
  Mail, 
  MapPin, 
  Target, 
  MessageSquare, 
  FileText,
  Briefcase,
  GraduationCap
} from "lucide-react"

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  english_level: string | null
  migration_goal: string | null
  current_locations: { name: string } | null
  goal_locations: { city: string; country: string } | null
  avatar_url: string | null
  chat_count: number
  file_count: number
}

interface ProfileListProps {
  profiles: Profile[]
}

export function ProfileList({ profiles: initialProfiles }: ProfileListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [englishFilter, setEnglishFilter] = useState("all")
  const [migrationFilter, setMigrationFilter] = useState("all")

  const filteredProfiles = initialProfiles.filter(profile => {
    const matchesSearch = (
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.first_name && profile.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profile.last_name && profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    const matchesEnglish = englishFilter === "all" || profile.english_level === englishFilter
    const matchesMigration = migrationFilter === "all" || profile.migration_goal === migrationFilter

    return matchesSearch && matchesEnglish && matchesMigration
  })

  const getEnglishLevelBadge = (level: string | null) => {
    if (!level) return <Badge variant="outline">未設定</Badge>
    const variants: { [key: string]: "default" | "secondary" | "outline" } = {
      beginner: "outline",
      intermediate: "secondary",
      advanced: "default"
    }
    return <Badge variant={variants[level] || "outline"}>{level}</Badge>
  }

  const getMigrationGoalBadge = (goal: string | null) => {
    if (!goal) return <Badge variant="outline">未設定</Badge>
    const variants: { [key: string]: "default" | "secondary" | "outline" } = {
      overseas_job: "default",
      improve_language: "secondary",
      career_change: "outline"
    }
    return <Badge variant={variants[goal] || "outline"}>{goal}</Badge>
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>ユーザープロフィール一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="メールアドレスまたは名前で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={englishFilter} onValueChange={setEnglishFilter}>
              <SelectTrigger>
                <SelectValue placeholder="英語レベルで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのレベル</SelectItem>
                <SelectItem value="beginner">初級</SelectItem>
                <SelectItem value="intermediate">中級</SelectItem>
                <SelectItem value="advanced">上級</SelectItem>
              </SelectContent>
            </Select>
            <Select value={migrationFilter} onValueChange={setMigrationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="渡航目的で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての目的</SelectItem>
                <SelectItem value="overseas_job">海外就職</SelectItem>
                <SelectItem value="improve_language">語学力向上</SelectItem>
                <SelectItem value="career_change">キャリアチェンジ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>英語レベル</TableHead>
                <TableHead>渡航目的</TableHead>
                <TableHead>現在地</TableHead>
                <TableHead>目標地</TableHead>
                <TableHead>チャット</TableHead>
                <TableHead>書類</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile.first_name ? profile.first_name[0].toUpperCase() : profile.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {profile.first_name && profile.last_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : profile.email}
                        </div>
                        <div className="text-sm text-muted-foreground">{profile.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getEnglishLevelBadge(profile.english_level)}</TableCell>
                  <TableCell>{getMigrationGoalBadge(profile.migration_goal)}</TableCell>
                  <TableCell>
                    {profile.current_locations?.name || "未設定"}
                  </TableCell>
                  <TableCell>
                    {profile.goal_locations
                      ? `${profile.goal_locations.city}, ${profile.goal_locations.country}`
                      : "未設定"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {profile.chat_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {profile.file_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/profiles/${profile.id}`}>詳細</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/profiles/${profile.id}/edit`}>編集</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProfiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    該当するユーザーがいません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}