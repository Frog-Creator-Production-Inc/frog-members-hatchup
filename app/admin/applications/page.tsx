import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ApplicationList } from "./components/application-list"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0 // 毎回データを再取得

export default async function AdminApplicationsPage() {
  const supabase = createServerComponentClient({ cookies })

  // ユーザーセッションの取得
  const { data: { session } } = await supabase.auth.getSession()
  
  // セッションがない場合はログインページにリダイレクト
  if (!session) {
    redirect('/auth/login?redirect=/admin/applications')
  }
  
  // 管理者権限の確認
  const { data: adminRole, error: adminError } = await supabase
    .from('admin_roles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  
  // デバッグログ
  console.log("管理者権限チェック:", { adminRole, adminError })
  
  // 管理者権限がない場合は権限エラーページへリダイレクト
  if (!adminRole || adminError) {
    console.error("管理者権限がありません:", adminError)
    redirect('/unauthorized')
  }

  console.log("コース申し込み一覧を取得開始")
  
  // コース申し込み一覧を取得
  const { data: applications, error } = await supabase
    .from("course_applications")
    .select(`
      *,
      course:course_id (
        id,
        name,
        content_snare_template_id,
        schools (
          id,
          name
        )
      ),
      user:user_id (
        id,
        email,
        first_name,
        last_name,
        avatar_url
      ),
      course_application_documents (
        id,
        document_type,
        status,
        created_at,
        updated_at,
        user_files (
          id,
          name,
          size,
          type,
          downloaded,
          path
        )
      ),
      course_application_comments (
        id,
        comment,
        created_at,
        user_id
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("コース申し込み一覧取得エラー:", error);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">コース申し込み一覧</h1>
          <div className="text-sm text-red-600">
            データ取得エラー：{error.message}
          </div>
        </div>
      </div>
    )
  }

  // データ取得結果のデバッグログ
  console.log(`コース申し込み一覧取得: ${applications?.length || 0}件`);
  if (applications?.length === 0) {
    console.log("取得したデータが0件です。RLSポリシーの可能性があります。")
    
    // サービスロールで取得してみる
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (serviceRoleKey && supabaseUrl) {
        console.log("サービスロールを使用して直接データ取得を試みます")
        
        const response = await fetch(`${supabaseUrl}/rest/v1/course_applications?select=id&limit=5`, {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        })
        
        if (response.ok) {
          const testData = await response.json()
          console.log("サービスロールでのテスト取得結果:", testData.length, "件")
        } else {
          console.error("サービスロールでのテスト取得エラー:", response.status)
        }
      }
    } catch (testError) {
      console.error("サービスロール取得テストエラー:", testError)
    }
  }

  // Content Snare リクエスト一覧を取得
  console.log("Content Snare リクエスト一覧取得開始");
  let contentSnareRequestsMap = new Map();
  
  try {
    // APIエンドポイントを呼び出し
    const contentSnareResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/content-snare/admin/list-requests`, {
      cache: 'no-store',
      headers: {
        // クッキーを含めて認証情報を送信
        'cookie': cookies().toString()
      }
    });
    
    if (contentSnareResponse.ok) {
      const snareRequests = await contentSnareResponse.json();
      console.log(`Content Snare リクエスト一覧取得成功: ${snareRequests.length}件`);
      
      // マップに格納
      snareRequests.forEach((request: any) => {
        contentSnareRequestsMap.set(request.id, request);
      });
      
      // デバッグ用：マップの内容をログ出力
      console.log("Content Snareマップに格納されたID一覧:", Array.from(contentSnareRequestsMap.keys()));
    } else {
      console.warn(`Content Snare リクエスト一覧取得エラー: ステータス ${contentSnareResponse.status}`);
    }
  } catch (error) {
    console.error("Content Snare リクエスト一覧取得エラー:", error);
  }

  // ユーザー情報（プロファイル）を個別に取得
  const enhancedApplications = [];
  if (applications) {
    // すべてのアプリケーションに対して処理
    for (const app of applications) {
      const enhancedApp = { ...app };
      
      try {
        // ユーザーのプロフィール情報を取得（ネストされたプロフィールではなく直接取得）
        if (app.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, phone, country, city")
            .eq("id", app.user_id)
            .single();
          
          if (profileData) {
            // user.profilesの代わりに、profiles配列に追加
            enhancedApp.user.profiles = [profileData];
          }
        }
        
        // コメント作成者の情報を取得
        if (app.course_application_comments && app.course_application_comments.length > 0) {
          for (const comment of app.course_application_comments) {
            if (comment.user_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name, email, avatar_url")
                .eq("id", comment.user_id)
                .single();
              
              if (profile) {
                comment.profile = profile;
              }
            }
          }
        }

        // Content Snare情報を取得（request_idが存在する場合のみ）
        if (app.content_snare_request_id) {
          // マップからデータを取得（完全一致のみ）
          const snareData = contentSnareRequestsMap.get(app.content_snare_request_id);
          
          if (snareData) {
            // 簡略化したContent Snare情報を追加（一覧ページでは最小限の情報のみ）
            enhancedApp.content_snare_result = {
              id: snareData.id,
              name: snareData.name,
              status: snareData.status,
              share_link: snareData.share_link,
              due: snareData.due,
              created_at: snareData.created_at,
              updated_at: snareData.updated_at,
              last_activity_at: snareData.last_activity_at,
              client_name: snareData.client_name,
              client_email: snareData.client_email,
              sections_count: snareData.sections_count,
              pages_count: snareData.pages_count
            };
          } else {
            // 完全一致するIDがない場合はContent Snare情報なしとして扱う
            console.log(`Content Snare情報が見つかりません: ID=${app.content_snare_request_id}`);
          }
        }
      } catch (err) {
        console.error(`申請データ処理エラー (ID: ${app.id}):`, err);
      }
      
      enhancedApplications.push(enhancedApp);
    }
  }

  // デバッグログを追加
  console.log(`申請データ取得完了: ${enhancedApplications.length}件`);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">コース申し込み一覧</h1>
        <div className="text-sm text-muted-foreground">
          {enhancedApplications.length}件の申請
        </div>
      </div>
      <ApplicationList applications={enhancedApplications} />
    </div>
  )
}