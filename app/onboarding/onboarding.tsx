"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { updateProfile } from "@/lib/supabase/queries"

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const fullName = formData.get("fullName") as string
    const migrationGoal = formData.get("migrationGoal") as string

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No user found")

      const { error } = await updateProfile({
        id: user.id,
        full_name: fullName,
        migration_goal: migrationGoal,
      })

      if (error) throw error

      toast({
        title: "プロフィールが更新されました",
        description: "オンボーディングが完了しました。",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "エラーが発生しました",
        description: "プロフィールの更新中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>オンボーディング</CardTitle>
          <CardDescription>あなたのプロフィールを設定しましょう</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="fullName">フルネーム</Label>
                <Input id="fullName" name="fullName" placeholder="山田 太郎" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="migrationGoal">移住の目標</Label>
                <Input id="migrationGoal" name="migrationGoal" placeholder="キャリアアップ" required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "送信中..." : "送信"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

