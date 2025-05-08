import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-client"

export const dynamic = "force-dynamic"

// 管理者ユーザーのIDリスト（フォールバック用）
const ADMIN_USER_IDS = [
  'ca75f6c9-9b0b-412c-8b8d-c9d8b36559d9', // support@frogagent.com
  // 必要に応じて他の管理者IDを追加
]

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // フォールバックの管理者リストをチェック
    if (ADMIN_USER_IDS.includes(user.id)) {
      console.log(`ハードコードされたリストから管理者を確認: ${user.id}`)
      return NextResponse.json({ 
        isAdmin: true,
        user: { id: user.id, email: user.email }
      })
    }

    // サービスロールを使用して管理者チェック
    try {
      const serviceClient = createServerClient()
      const { data: adminRole, error: roleError } = await serviceClient
        .from('admin_roles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (roleError && roleError.code !== 'PGRST116') {
        console.error('管理者ロールチェックエラー:', roleError)
        // エラーがあってもハードコードリストで管理者の場合は成功を返す
        if (ADMIN_USER_IDS.includes(user.id)) {
          return NextResponse.json({ 
            isAdmin: true, 
            source: 'fallback',
            user: { id: user.id, email: user.email }
          })
        }
        return NextResponse.json({ isAdmin: false, error: "チェック中にエラーが発生しました" }, { status: 500 })
      }
      
      return NextResponse.json({ 
        isAdmin: !!adminRole,
        source: 'database',
        user: { id: user.id, email: user.email }
      })
    } catch (dbError) {
      console.error('DB管理者チェックエラー:', dbError)
      // DBエラーでもハードコードリストで管理者の場合は成功を返す
      if (ADMIN_USER_IDS.includes(user.id)) {
        return NextResponse.json({ 
          isAdmin: true, 
          source: 'fallback',
          user: { id: user.id, email: user.email }
        })
      }
      return NextResponse.json({ isAdmin: false, error: "データベースエラーが発生しました" }, { status: 500 })
    }
  } catch (error) {
    console.error('管理者チェックAPI Error:', error)
    return NextResponse.json({ isAdmin: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
} 