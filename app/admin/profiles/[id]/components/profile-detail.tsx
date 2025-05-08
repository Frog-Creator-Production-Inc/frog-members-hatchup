"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/utils"
import { 
  User, 
  Mail, 
  MapPin, 
  Target, 
  MessageSquare, 
  FileText,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  School,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Globe,
  Settings,
  BarChart2,
  CreditCard,
  BookOpen,
  Clipboard,
  PenTool
} from "lucide-react"
import { UserFiles } from "./user-files"
import { getJobPositions } from "@/lib/supabase/queries"

interface ProfileDetailProps {
  profile: any // TODO: Add proper type
  jobPositions?: any[] // 職業ポジションデータ
  courseApplications?: any[] // コース申請データ
}

export function ProfileDetail({ profile, jobPositions = [], courseApplications = [] }: ProfileDetailProps) {
  // future_occupationに対応するjob_positionを検索
  const getFutureOccupationTitle = () => {
    if (!profile.future_occupation) return "未設定"
    const position = jobPositions.find(pos => pos.id === profile.future_occupation)
    return position ? position.title : profile.future_occupation
  }

  // 申請ステータスに応じたバッジを返す関数
  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">下書き</Badge>
      case "submitted":
        return <Badge variant="secondary">申請済み</Badge>
      case "reviewing":
        return <Badge>レビュー中</Badge>
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">承認済み</Badge>
      case "rejected":
        return <Badge variant="destructive">却下</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {profile.first_name ? profile.first_name[0].toUpperCase() : profile.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.email}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Mail className="h-4 w-4" />
              {profile.email}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/profiles">一覧に戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/profiles/${profile.id}/edit`}>
              <PenTool className="h-4 w-4 mr-2" />
              編集
            </Link>
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左サイドバー - 基本情報 */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-md bg-white">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">オンボーディング</div>
                <Badge variant={profile.onboarding_completed ? "default" : "secondary"} className="w-full justify-center py-1">
                  {profile.onboarding_completed ? "完了" : "未完了"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">現在地</div>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{profile.current_locations?.name || "未設定"}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">目標地</div>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {profile.goal_locations
                        ? `${profile.goal_locations.city}, ${profile.goal_locations.country}`
                        : "未設定"
                      }
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">生年月日</div>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {profile.birth_date ? 
                        (() => {
                          const d = new Date(profile.birth_date);
                          if (isNaN(d.getTime())) return "未設定";
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          return `${year}年${month}月${day}日`;
                        })() 
                        : "未設定"}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">現在の職業</div>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="font-medium">{profile.current_occupation || "未設定"}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">希望職業</div>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium">{getFutureOccupationTitle()}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">渡航目的</div>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <PenTool className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {profile.migration_goal === "overseas_job" ? "海外就職" :
                       profile.migration_goal === "improve_language" ? "語学力向上" :
                       profile.migration_goal === "career_change" ? "キャリアチェンジ" :
                       profile.migration_goal === "find_new_home" ? "移住" :
                       profile.migration_goal || "未設定"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md bg-white">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                ステータス情報
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">英語レベル</div>
                  <Badge variant="outline" className="w-full justify-center py-1">
                    {profile.english_level === "beginner" ? "初心者（日常会話も難しい）" :
                     profile.english_level === "intermediate" ? "中級者（日常会話ができる）" :
                     profile.english_level === "advanced" ? "上級者（ビジネスでも使える）" :
                     profile.english_level === "native" ? "ネイティブレベル" :
                     profile.english_level || "未設定"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">職務経験</div>
                  <Badge variant="outline" className="w-full justify-center py-1">
                    {profile.work_experience === "0-2" ? "0-2年" :
                     profile.work_experience === "3-5" ? "3-5年" :
                     profile.work_experience === "6-10" ? "6-10年" :
                     profile.work_experience === "10+" ? "10年以上" :
                     profile.work_experience || "未設定"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">ワーキングホリデー</div>
                  <Badge variant="outline" className="w-full justify-center py-1">
                    {profile.working_holiday === "yes" ? "検討中" :
                     profile.working_holiday === "no" ? "検討していない" :
                     profile.working_holiday === "already_applied" ? "申請済み" :
                     profile.working_holiday === "not_eligible" ? "対象年齢ではない" :
                     profile.working_holiday || "未設定"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">年齢層</div>
                  <Badge variant="outline" className="w-full justify-center py-1">
                    {profile.age_range === "18-25" ? "18-25歳" :
                     profile.age_range === "26-30" ? "26-30歳" :
                     profile.age_range === "31-35" ? "31-35歳" :
                     profile.age_range === "36-40" ? "36-40歳" :
                     profile.age_range === "40+" ? "40歳以上" :
                     profile.age_range || "未設定"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">渡航時期</div>
                  <Badge variant="outline" className="w-full justify-center py-1">
                    {profile.abroad_timing === "asap" ? "できるだけ早く" :
                     profile.abroad_timing === "within_6_months" ? "6ヶ月以内" :
                     profile.abroad_timing === "within_1_year" ? "1年以内" :
                     profile.abroad_timing === "1_year_plus" ? "1年以上先" :
                     profile.abroad_timing || "未設定"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">作成日時</div>
                  <div className="text-sm bg-muted p-2 rounded-md text-center">
                    {formatDate(profile.created_at)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">必要なサポート</div>
                <div className="flex flex-wrap gap-2">
                  {profile.support_needed ? (
                    profile.support_needed.split(",").map((support: string) => {
                      // 有効なサポート値のリスト
                      const validSupportTypes = ["visa", "job_search", "language_study", "accommodation", "cultural_adjustment"];
                      
                      // 有効なサポート値のみを表示
                      if (validSupportTypes.includes(support.trim())) {
                        return (
                          <Badge key={support} variant="outline">
                            {support === "visa" ? "ビザ申請サポート" :
                             support === "job_search" ? "就職先の紹介" :
                             support === "language_study" ? "語学学習サポート" :
                             support === "accommodation" ? "住居探しサポート" :
                             support === "cultural_adjustment" ? "文化適応サポート" :
                             support}
                          </Badge>
                        );
                      }
                      return null;
                    })
                  ) : (
                    <Badge variant="outline">未設定</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツエリア - 主要アクション */}
        <div className="lg:col-span-2 space-y-6">
          {/* 主要アクションカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* コース申し込み */}
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white">
              <CardHeader className="bg-blue-500 text-white p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  コース申し込み
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  このユーザーが申請したコース一覧を確認できます
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/admin/applications?user_id=${profile.id}`}>
                    <Clipboard className="h-4 w-4 mr-2" />
                    申請一覧を見る
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* ビザプラン */}
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white">
              <CardHeader className="bg-green-500 text-white p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5" />
                  ビザプラン
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  このユーザーのビザプランを作成・確認できます
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button asChild variant="outline">
                    <Link href={`/admin/visa-reviews?user_id=${profile.id}`}>
                      確認
                    </Link>
                  </Button>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href={`/admin/visa-reviews/new?user_id=${profile.id}`}>
                      作成
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* チャット履歴 */}
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white">
              <CardHeader className="bg-purple-500 text-white p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  チャット
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  このユーザーとのチャット履歴を確認できます
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/admin/chats?user_id=${profile.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    チャット履歴を見る
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* 詳細情報タブ */}
          <Card className="overflow-hidden border-none shadow-md bg-white">
            <Tabs defaultValue="courses" className="w-full">
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="courses" className="data-[state=active]:bg-blue-50">
                    <BookOpen className="h-4 w-4 mr-2" />
                    コース申請
                  </TabsTrigger>
                  <TabsTrigger value="visa" className="data-[state=active]:bg-green-50">
                    <Globe className="h-4 w-4 mr-2" />
                    ビザプラン
                  </TabsTrigger>
                  <TabsTrigger value="chats" className="data-[state=active]:bg-purple-50">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    チャット
                  </TabsTrigger>
                  <TabsTrigger value="files" className="data-[state=active]:bg-amber-50">
                    <FileText className="h-4 w-4 mr-2" />
                    ファイル
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-6 bg-white">
                {/* コース申し込みタブ */}
                <TabsContent value="courses" className="mt-0">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">申請したコース</h3>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/applications?user_id=${profile.id}`}>
                        すべての申請を見る
                      </Link>
                    </Button>
                  </div>
                  <ScrollArea className="min-h-[300px] max-h-[500px] overflow-auto">
                    {courseApplications.length > 0 ? (
                      <div className="space-y-4">
                        {courseApplications.map((application) => (
                          <div
                            key={application.id}
                            className="flex items-start gap-3 p-4 rounded-lg border hover:bg-blue-50 transition-colors bg-white"
                          >
                            <School className="h-5 w-5 mt-1 text-blue-500" />
                            <div className="space-y-1 flex-1">
                              <p className="font-medium">{application.course.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {application.course.schools.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  申請日: {formatDate(application.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs">
                                  希望開始時期: {application.preferred_start_date || "未設定"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {getApplicationStatusBadge(application.status)}
                                {application.course.category && (
                                  <Badge variant="outline">
                                    {application.course.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button asChild variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100">
                              <Link href={`/admin/applications/${application.id}`}>
                                <FileText className="h-4 w-4 mr-1" />
                                詳細
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                        <BookOpen className="h-12 w-12 mb-4 text-muted" />
                        <p>申請したコースはありません</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* ビザプランタブ */}
                <TabsContent value="visa" className="mt-0">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">ビザプラン</h3>
                    <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                      <Link href={`/admin/visa-reviews/new?user_id=${profile.id}`}>
                        新規プラン作成
                      </Link>
                    </Button>
                  </div>
                  <ScrollArea className="min-h-[300px] max-h-[500px] overflow-auto">
                    {profile.visa_plans?.length > 0 ? (
                      <div className="space-y-4">
                        {profile.visa_plans.map((plan: any) => (
                          <div
                            key={plan.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-green-50 transition-colors bg-white"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5 text-green-500" />
                                <span className="font-medium">{plan.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                作成日: {formatDate(plan.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                plan.status === "draft" ? "outline" :
                                plan.status === "submitted" ? "secondary" :
                                plan.status === "in_review" ? "default" :
                                "outline"
                              }>
                                {plan.status === "draft" ? "下書き" :
                                 plan.status === "submitted" ? "申請済み" :
                                 plan.status === "in_review" ? "レビュー中" :
                                 "完了"}
                              </Badge>
                              <Button asChild variant="outline" size="sm" className="bg-green-50 hover:bg-green-100">
                                <Link href={`/admin/visa-reviews/${plan.visa_plan_reviews[0]?.id || plan.id}`}>
                                  <FileCheck className="h-4 w-4 mr-1" />
                                  詳細
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                        <Globe className="h-12 w-12 mb-4 text-muted" />
                        <p>ビザプランはありません</p>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                          <Link href={`/admin/visa-reviews/new?user_id=${profile.id}`}>
                            プランを作成する
                          </Link>
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* チャット履歴タブ */}
                <TabsContent value="chats" className="mt-0">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">チャット履歴</h3>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/chats?user_id=${profile.id}`}>
                        すべてのチャットを見る
                      </Link>
                    </Button>
                  </div>
                  <ScrollArea className="min-h-[300px] max-h-[500px] overflow-auto">
                    {profile.chat_sessions?.length > 0 ? (
                      <div className="space-y-4">
                        {profile.chat_sessions.map((session: any) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-purple-50 transition-colors bg-white"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-purple-500" />
                                <span className="font-medium">
                                  メッセージ数: {session.messages[0]?.count || 0}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(session.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                session.status === "unread" ? "destructive" :
                                session.status === "active" ? "secondary" : "outline"
                              }>
                                {session.status === "unread" ? "未読" :
                                 session.status === "active" ? "アクティブ" : "既読"}
                              </Badge>
                              <Button asChild variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100">
                                <Link href={`/admin/chats/${session.id}`}>
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  詳細
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                        <MessageSquare className="h-12 w-12 mb-4 text-muted" />
                        <p>チャット履歴はありません</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* ファイルタブ */}
                <TabsContent value="files" className="mt-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">アップロードファイル</h3>
                  </div>
                  <ScrollArea className="min-h-[300px] max-h-[500px] overflow-auto">
                    {profile.user_files?.length > 0 ? (
                      <div className="space-y-4">
                        {profile.user_files.map((file: any) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-amber-50 transition-colors bg-white"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-500" />
                                <span className="font-medium">{file.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(file.created_at)}
                              </p>
                            </div>
                            <Badge variant={file.downloaded ? "outline" : "default"}>
                              {file.downloaded ? "ダウンロード済み" : "未ダウンロード"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                        <FileText className="h-12 w-12 mb-4 text-muted" />
                        <p>アップロードされたファイルはありません</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ファイル管理コンポーネント */}
      <UserFiles 
        profileId={profile.id} 
        files={profile.user_files} 
      />
    </div>
  )
}