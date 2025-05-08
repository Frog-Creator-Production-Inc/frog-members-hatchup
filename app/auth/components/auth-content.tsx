"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { FaGoogle, FaFacebook } from "react-icons/fa"
import { RiTwitterXFill } from "react-icons/ri"
import toast from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const supabase = createClientComponentClient()

  // エラーメッセージの定義
  const errorMessages: { [key: string]: string } = {
    no_code: "認証コードが見つかりませんでした",
    session_exchange: "セッションの作成に失敗しました",
    no_session: "セッションが見つかりませんでした",
    profile_creation: "プロフィールの作成に失敗しました",
    profile_fetch: "プロフィールの取得に失敗しました",
    onboarding_failed: "オンボーディングの処理に失敗しました",
    callback_failed: "認証コールバックの処理に失敗しました",
    unexpected: "予期せぬエラーが発生しました",
  }

  // エラーメッセージの表示
  useEffect(() => {
    const error = searchParams?.get("error")
    if (error && errorMessages[error]) {
      toast.error(errorMessages[error])
    }
  }, [searchParams, errorMessages])

  // セッションチェック
  useEffect(() => {
    // コードパラメータがある場合はコールバック処理中なのでセッションチェックをスキップ
    const code = searchParams?.get("code")
    if (code) {
      console.log("コールバック処理中: セッションチェックスキップ");
      setIsCheckingSession(false);
      return;
    }
    
    // redirect_toパラメータがある場合もリダイレクト中なのでスキップ
    const redirectTo = searchParams?.get("redirect_to");
    if (redirectTo && redirectTo.includes("/auth/callback")) {
      console.log("認証コールバックへのリダイレクト中: セッションチェックスキップ");
      setIsCheckingSession(false);
      return;
    }

    const checkSession = async () => {
      try {
        console.log("クライアント側セッションチェック開始");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("セッション取得エラー:", error);
          setIsCheckingSession(false);
          return;
        }

        if (session) {
          console.log("セッション検出: プロフィールチェック");
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("onboarding_completed")
              .eq("id", session.user.id)
              .single();

            if (profileError) {
              console.error("プロフィール取得エラー:", profileError);
              // プロフィールが存在しない場合はオンボーディングへ
              if (profileError.code === "PGRST116") {
                console.log("プロフィールなし: オンボーディングへリダイレクト");
                router.push("/onboarding");
                return;
              }
              throw profileError;
            }

            if (!profile || !profile.onboarding_completed) {
              console.log("オンボーディング未完了: オンボーディングへリダイレクト");
              router.push("/onboarding");
            } else {
              console.log("オンボーディング完了: ダッシュボードへリダイレクト");
              router.push("/dashboard");
            }
          } catch (error) {
            console.error("プロフィールチェックエラー:", error);
            toast.error("プロフィール情報の確認中にエラーが発生しました");
            setIsCheckingSession(false);
          }
        } else {
          console.log("セッションなし: ログインページ表示");
          setIsCheckingSession(false);
        }
      } catch (error) {
        console.error("セッションチェックエラー:", error);
        toast.error("セッションの確認中にエラーが発生しました");
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [router, supabase, searchParams]);

  const handleSocialLogin = async (provider: "google" | "twitter" | "facebook") => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      if (data?.url) {
        console.log(`${provider}認証: プロバイダーページへリダイレクト`);
        window.location.href = data.url
      }
    } catch (error) {
      console.error("ログインエラー:", error)
      toast.error("ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // ローディング中の表示
  if (isCheckingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#4FD1C5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // ログインフォームの表示
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ロゴを左上に配置 */}
      <div className="p-6">
        <Link href="/">
          <Image 
            src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png" 
            alt="Frog Logo" 
            width={50} 
            height={50} 
            className="object-contain cursor-pointer"
          />
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* プレリリース版に関する重要なお知らせ */}
        <div className="w-full max-w-[600px] mb-6">
          <Alert className="border-2 border-amber-500 bg-amber-50 text-amber-900 shadow-md">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-800 font-bold text-lg">プレリリース版に関する重要なお知らせ</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">本サービスは現在プレリリース版として提供されており、現在は招待されたユーザーに限定して提供させて頂いております。</p>
              <p className="mb-2">開発中のため、予期せぬ不具合や仕様変更が発生する可能性があり、動作の安定性やセキュリティを含むすべての機能についていかなる保証もいたしかねます。</p>
              <p className="mb-2">また、本サービスの利用によって生じた直接・間接の損害について、当社は一切の責任を負いません。</p>
              <p className="mb-2">本サービスの品質向上のため、ご利用中に問題やご意見がございましたら、ぜひフィードバックをお寄せください。</p>
              <p>ご理解とご協力のほど、よろしくお願いいたします。</p>
            </AlertDescription>
          </Alert>
        </div>

        <Card className="w-[400px] border shadow-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">ようこそFrog Membersへ</CardTitle>
            <CardDescription className="text-center">ソーシャルアカウントでログイン</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                className="w-full bg-[#4FD1C5] hover:bg-[#45B8AE] text-white font-normal h-12"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
              >
                <FaGoogle className="mr-2 h-5 w-5" />
                Googleでログイン
              </Button>
              <Button
                className="w-full bg-[#4FD1C5] hover:bg-[#45B8AE] text-white font-normal h-12"
                onClick={() => handleSocialLogin("twitter")}
                disabled={loading}
              >
                <RiTwitterXFill className="mr-2 h-5 w-5" />
                X(Twitter)でログイン
              </Button>
              <Button
                className="w-full bg-[#4FD1C5] hover:bg-[#45B8AE] text-white font-normal h-12"
                onClick={() => handleSocialLogin("facebook")}
                disabled={loading}
              >
                <FaFacebook className="mr-2 h-5 w-5" />
                Facebookでログイン
              </Button>
              
              <div className="pt-4 border-t border-gray-200">
                <Link href="/contact">
                  <Button
                    className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-normal h-12 mb-3"
                    variant="outline"
                  >
                    問い合わせはこちら
                  </Button>
                </Link>
                <Link href="/business">
                  <Button
                    className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-normal h-12"
                    variant="outline"
                  >
                    企業・学校関係者の方へ
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Frog Members. All rights reserved.
      </div>
    </div>
  )
}
