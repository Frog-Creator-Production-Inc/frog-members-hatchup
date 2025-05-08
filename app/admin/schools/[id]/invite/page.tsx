import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SchoolInviteForm } from "./components/school-invite-form"

export const dynamic = "force-dynamic"

interface SchoolInvitePageProps {
  params: {
    id: string
  }
}

export default async function SchoolInvitePage({ params }: SchoolInvitePageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  // 管理者認証確認
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect("/auth")
  }
  
  // 管理者権限確認
  const { data: isAdmin } = await supabase
    .from("admin_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .single()
  
  if (!isAdmin) {
    redirect("/dashboard")
  }
  
  // 学校情報の取得
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", params.id)
    .single()
  
  if (schoolError || !school) {
    redirect("/admin/schools")
  }
  
  // 既存のアクセストークン（有効なもののみ）を取得
  const now = new Date().toISOString()
  const { data: existingTokens } = await supabase
    .from("school_access_tokens")
    .select(`
      id,
      email,
      created_at,
      expires_at,
      used_at
    `)
    .eq("school_id", params.id)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">学校担当者の招待: {school.name}</h1>
      <p className="text-gray-600">
        メールアドレスを入力して、学校担当者にコース編集用の一時的なアクセスリンクを送信します。
      </p>
      
      <SchoolInviteForm schoolId={params.id} schoolName={school.name} />
      
      {existingTokens && existingTokens.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">アクティブな招待</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    有効期限
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終使用日時
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingTokens.map((token) => (
                  <tr key={token.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {token.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(token.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(token.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {token.used_at ? new Date(token.used_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 