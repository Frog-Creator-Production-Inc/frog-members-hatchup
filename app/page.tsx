"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Briefcase, GraduationCap, Rocket, Home, 
  CheckCircle, FileText, Plane, Building,
  ArrowRight, Globe, Users, BookOpen,
  LightbulbIcon, HomeIcon, AlertTriangle
} from "lucide-react"
import LandingLayout from "./components/LandingLayout"

// ヒーロー画像の配列
const heroImages = [
  "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/bc4ce8d60d96428793a4a4c6a0005f36/top_image_1.jpg",
  "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/b90261fb857e499ead31242fd33bb4d3/top_image_2.jpg",
  "https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/cd5cfbb96c674e37a5b30f9ceb51d8b7/top_image_3.jpg"
]

// 固定の画像を使用（ハイドレーションエラー防止）
const defaultHeroImage = heroImages[0]

export default function HomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [loading, setLoading] = useState(true)
  const [heroImage, setHeroImage] = useState(defaultHeroImage)
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行されるようにする
  useEffect(() => {
    setIsClient(true)
    // クライアントサイドでのみランダムな画像を選択
    const randomIndex = Math.floor(Math.random() * heroImages.length)
    setHeroImage(heroImages[randomIndex])

    // 画像のプリロード（クライアントサイドでのみ実行）
    if (typeof window !== 'undefined') {
      // TypeScriptエラーを回避するためにプリロード方法を変更
      heroImages.forEach(src => {
        const preloadLink = document.createElement('link')
        preloadLink.rel = 'preload'
        preloadLink.as = 'image'
        preloadLink.href = src
        document.head.appendChild(preloadLink)
      })
    }

    const checkAuthAndRedirect = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          // ログインしていない場合はLanding Pageを表示するためにloadingをfalseに設定
          setLoading(false)
          return
        }

        // 一般ユーザーの場合はプロファイルチェック
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select('onboarding_completed')
          .eq("id", user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        // 管理者かどうかチェック
        const { data: adminRole } = await supabase
          .from('admin_roles')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        if (adminRole) {
          router.push("/admin")
          return
        }

        if (!profile) {
          router.push("/auth")
          return
        }

        if (!profile.onboarding_completed) {
          router.push("/onboarding")
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setLoading(false)
      }
    }

    checkAuthAndRedirect()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // Landing Page コンテンツ
  return (
    <LandingLayout>
      {/* ヒーロー画像を表示 */}
      <div className="relative h-[70vh] w-full">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Hero Image"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white p-4 max-w-4xl">
            <h1 className="text-3xl leading-[1.3] md:text-[4rem] md:leading-[1.4] font-bold mb-6">海外留学・就職を目指す人の<br />AI + コミュニティサービス</h1>
            <p className="text-xl md:text-2xl mb-8">あなたの夢を実現するための第一歩をサポートします</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/auth">無料会員登録</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white/10 text-white border-white hover:bg-white/20">
                <Link href="/contact">お問い合わせ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* プレリリース版に関する重要なお知らせ */}
      <section className="py-6 bg-amber-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto border border-amber-500 rounded-lg p-6 bg-white shadow-md">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-amber-500 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-amber-800 mb-3">プレリリース版に関する重要なお知らせ</h2>
                <div className="text-amber-700 space-y-2">
                  <p>本サービスは現在プレリリース版として提供されており、現在は招待されたユーザーに限定して提供させて頂いております。</p>
                  <p>開発中のため、予期せぬ不具合や仕様変更が発生する可能性があり、動作の安定性やセキュリティを含むすべての機能についていかなる保証もいたしかねます。</p>
                  <p>また、本サービスの利用によって生じた直接・間接の損害について、当社は一切の責任を負いません。</p>
                  <p>本サービスの品質向上のため、ご利用中に問題やご意見がございましたら、ぜひフィードバックをお寄せください。</p>
                  <p>ご理解とご協力のほど、よろしくお願いいたします。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">どんな人でも海外挑戦の第一歩を踏み出せる</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              海外挑戦に必要な情報とサポートを一つのプラットフォームに集約。
              あなたの目標に合わせた最適な道筋を提案します。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">情報の均一化</h3>
              <p className="text-gray-600">
                海外挑戦に関する質の高い情報を集約し、誰でもアクセスできる環境を提供します。
                先輩たちの体験談や専門家のアドバイスを参考に、自分の道を見つけましょう。
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">プロからのアドバイス</h3>
              <p className="text-gray-600">
                ビザの提案や確認、学校選びなど、海外挑戦の重要な局面で
                専門家からのアドバイスを受けられます。あなたの不安を解消します。
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Rocket className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AIによる最適提案</h3>
              <p className="text-gray-600">
                あなたの職業と渡航目的から、最適なカレッジやコースをAIが提案。
                膨大な選択肢の中から、あなたに最適な道を見つけ出します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4ステップセクション */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">海外挑戦を実現する4つのステップ</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Frog Membersでは、海外挑戦を4つのステップに分けてサポート。
              一歩ずつ着実に、あなたの夢への道を進んでいきましょう。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div className="mb-4 h-48 relative overflow-hidden rounded-lg">
                {isClient && (
                  <img
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/cb241a2106af443f822864f2b1761f38/image_cardpic_1.jpg"
                    alt="情報収集"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-4">
                    <LightbulbIcon className="h-6 w-6 text-white mb-2" />
                    <h3 className="text-xl font-bold text-white">情報収集</h3>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                先輩たちの渡航事例を読んで、自分の未来像をイメージしましょう。
                様々な可能性を知ることで、具体的な目標設定ができます。
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="mb-4 h-48 relative overflow-hidden rounded-lg">
                {isClient && (
                  <img
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/754bd84c3fba4623a12634a73e21df34/image_cardpic_2.jpg"
                    alt="学校選び"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-4">
                    <Building className="h-6 w-6 text-white mb-2" />
                    <h3 className="text-xl font-bold text-white">学校選び</h3>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                あなたの目標と希望に合ったカレッジとビザの組み合わせを見つけましょう。
                AIが最適な選択肢を提案します。
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div className="mb-4 h-48 relative overflow-hidden rounded-lg">
                {isClient && (
                  <img
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/1a20d7df9fbb438cba89990f6317c790/image_cardpic_3.jpg"
                    alt="ビザプランニング"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-4">
                    <FileText className="h-6 w-6 text-white mb-2" />
                    <h3 className="text-xl font-bold text-white">ビザプランニング</h3>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                申請書類を準備し、ビザ申請の計画をたてましょう。
                専門家のサポートを受けながら、確実に進めていきます。
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div className="mb-4 h-48 relative overflow-hidden rounded-lg">
                {isClient && (
                  <img
                    src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/597d3554a877490c8c9c0bb8a636b1e6/image_cardpic_4.jpg"
                    alt="準備と学習"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-4">
                    <Plane className="h-6 w-6 text-white mb-2" />
                    <h3 className="text-xl font-bold text-white">準備と学習</h3>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                申請状況を確認しながら、渡航準備と事前学習を進めましょう。
                出発までの不安を解消し、自信を持って海外へ踏み出せます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AIアシスタントセクション */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9f2666669a514381abe11cd2f12568c0/image-pic-pr.jpg"
                alt="AIアシスタントイメージ"
                className="rounded-2xl shadow-xl w-full"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-white p-4 rounded-xl shadow-lg hidden md:block">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  <span className="font-bold">数百名の渡航実績データを活用</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">AIが導く、あなただけの<br />最適な留学プラン</h2>
              <div className="space-y-6">
                <p className="text-lg text-gray-600">
                  過去10年間、本気で北米キャリアを望む人々のサポートとインタビューを続けた弊社だからこそ提供できる価値。
                  数百名の渡航者データを分析し、あなたの目標や条件に最適なプランを提案します。
                  経験豊富な専門家の知見をAIに集約することで、効率的で的確なアドバイスを提供します。
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <LightbulbIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">パーソナライズされた提案</h3>
                      <p className="text-gray-600">あなたの経歴、目標、予算に合わせて最適な留学プランを提案</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">実績データに基づく提案</h3>
                      <p className="text-gray-600">
                        <Link href="https://frogagent.com/category/interview/" target="_blank" className="text-primary hover:underline">
                          成功者インタビュー
                        </Link>
                        をはじめとする数百名の実績データを分析し、成功確率の高いプランを提示
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">24時間365日のサポート</h3>
                      <p className="text-gray-600">いつでもどこでも、AIアシスタントに相談可能</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">あなただけの留学プランを見つけよう</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            まずはログインして、あなたに最適な海外挑戦の道を探してみませんか？
            無料で始められます。
          </p>
          <Button size="lg" variant="secondary" asChild className="px-8">
            <Link href="/auth">
              今すぐ始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 料金セクション */}
      <section id="price" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">料金プラン</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Frogは基本機能をすべて<span className="font-bold text-primary">無料</span>で提供しています。
              あなたの海外挑戦を始めるために、余計な費用は必要ありません。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-primary">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-primary">無料プラン</h3>
                  <p className="text-gray-500 mt-1">基本機能すべて利用可能</p>
                </div>
                <div className="text-3xl font-bold">¥0</div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>プラットフォーム上の学習コンテンツ閲覧（ほとんどが無料）</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>ビザプランの策定と管理</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>AIによるカレッジ・コース提案</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>渡航準備のためのタスク管理</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>先輩たちの体験談・インタビュー閲覧</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/auth">
                  無料で始める
                </Link>
              </Button>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">有料サービス</h3>
                  <p className="text-gray-500 mt-1">必要な時だけ利用可能</p>
                </div>
                <div className="text-base font-medium text-gray-600">オプション</div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>ビザ申請前のドキュメントチェック</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>専門家による個別相談</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>プレミアム学習コンテンツ</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>優先サポート</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mb-4">
                ※ 有料サービスは必要な時だけ個別に購入できます。基本機能の利用に追加料金は発生しません。
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth">
                  詳細を見る
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}