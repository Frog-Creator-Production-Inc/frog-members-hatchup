"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaGoogle, FaTwitter, FaFacebook } from "react-icons/fa"

export default function AuthForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleOAuthLogin = async (provider: "google" | "twitter" | "facebook") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ようこそFrog Membersへ</CardTitle>
          <CardDescription>ソーシャルアカウントでサインアップまたはログイン</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full bg-[#40CDB6] text-white hover:bg-[#3BB8A3]"
            onClick={() => handleOAuthLogin("google")}
          >
            <FaGoogle className="mr-2" />
            Googleでログイン
          </Button>
          <Button
            variant="outline"
            className="w-full bg-[#40CDB6] text-white hover:bg-[#3BB8A3]"
            onClick={() => handleOAuthLogin("twitter")}
          >
            <FaTwitter className="mr-2" />
            Twitterでログイン
          </Button>
          <Button
            variant="outline"
            className="w-full bg-[#40CDB6] text-white hover:bg-[#3BB8A3]"
            onClick={() => handleOAuthLogin("facebook")}
          >
            <FaFacebook className="mr-2" />
            Facebookでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

