import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Layout from "@/app/components/layout"
import VisaInformation from "./visa-information"
import { ReadOnlyVisaPlanner } from "@/app/visa/components/read-only-visa-planner"
import { InfoIcon, FileText, Layers, ArrowRight, AlertCircle, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { VisaStepProgress } from "./components/visa-step-progress"

export const dynamic = "force-dynamic"

export default async function VisaPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect("/auth")
  }

  // コース申し込み状況を確認
  const { data: courseApplications, error: applicationError } = await supabase
    .from("course_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .neq("status", "draft")
    .limit(1)

  const hasNonDraftApplication = courseApplications && courseApplications.length > 0

  // ビザタイプと要件の取得 - 明示的なリレーションシップを指定
  const { data: visaTypes, error: visaTypesError } = await supabase
    .from("visa_types")
    .select(`
      *,
      requirements:visa_requirements!visa_requirements_visa_type_id_fkey(*)
    `)
    .order("order_index", { ascending: true })

  // 既存のビザプランとレビューの取得
  const { data: visaPlans } = await supabase
    .from("visa_plans")
    .select(`
      *,
      visa_plan_items (
        id,
        visa_type_id,
        order_index,
        notes,
        admin_memo
      ),
      visa_plan_reviews (
        id,
        status,
        admin_comment,
        comment,
        title,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  // 全てのレビューコメントを取得する際にstatusとtitleも取得
  const { data: allReviews } = await supabase
    .from("visa_plan_reviews")
    .select("id, admin_comment, comment, title, created_at, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // ユーザープロフィールの取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // ユーザーのビザステップを判断
  const currentStep = !hasNonDraftApplication ? 1 : 
                        (!visaPlans || visaPlans.length === 0) ? 2 : 3;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">ビザプランナー</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            あなたの留学・就労に最適なビザプランを作成します。ビザの種類や申請条件を確認し、あなたに合ったビザ申請の計画を立てましょう。
          </p>

          {/* 新しいプログレスステップ表示 */}
          <VisaStepProgress currentStep={currentStep} />
        </div>
        
        {!hasNonDraftApplication ? (
          <div className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
            <div className="flex gap-6 relative z-10">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-gray-500" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-xl text-gray-800">カレッジのコースを先に決めましょう</h3>
                <p className="text-gray-600">
                  ビザプランナーを利用するには、まずカレッジのコースを選択し申し込みを行う必要があります。
                  コースが決まると、AIと管理者が自動でビザプランを作成し、あなたに提案します。
                </p>
                <div className="pt-2">
                  <Button asChild className="rounded-full px-6">
                    <Link href="/courses" className="flex items-center gap-2">
                      <span>コースを探す</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 装飾的な背景エフェクト */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mt-20 -mr-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -mb-32 -ml-32 blur-3xl"></div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl p-8 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50">
                <Layers className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">あなたのビザプラン</h2>
                <p className="text-sm text-gray-500">
                  {visaPlans && visaPlans.length > 0 
                    ? `最終更新: ${new Date(visaPlans[0].updated_at).toLocaleDateString('ja-JP')}`
                    : 'ビザプランを作成中です'}
                </p>
              </div>
            </div>
            
            <div className="relative z-10">
              <ReadOnlyVisaPlanner 
                userId={user.id}
                visaTypes={visaTypes || []}
                initialPlan={visaPlans?.[0] || null}
                allReviews={allReviews || []}
                profile={profile || {}}
              />
            </div>
            
            {/* 装飾的な背景エフェクト */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mt-20 -mr-20 blur-3xl"></div>
          </div>
        )}
        
        <div className="mt-12">
          <VisaInformation />
        </div>
      </div>
    </Layout>
  )
}
