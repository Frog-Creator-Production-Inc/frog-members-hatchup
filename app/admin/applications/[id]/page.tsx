import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { ApplicationDetail } from "../components/application-detail"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0 // 毎回データを再取得

interface AdminApplicationDetailPageProps {
  params: {
    id: string
  }
}

export default async function AdminApplicationDetailPage({ params }: AdminApplicationDetailPageProps) {
  const supabase = createServerComponentClient({ cookies })
  const { id } = params

  // IDのデバッグログ
  console.log("申請詳細ページアクセス - 指定されたID:", id);
  console.log("対象URL:", `/admin/applications/${id}`);

  // 現在の認証ユーザーを取得
  const { data: { session } } = await supabase.auth.getSession()
  
  // セッションがない場合はログインページにリダイレクト
  if (!session) {
    console.log("セッションなし - ログインページへリダイレクト");
    redirect(`/auth/login?redirect=/admin/applications/${id}`)
  }
  
  const currentUserId = session.user.id
  console.log("ログインユーザーID:", currentUserId);

  // 管理者権限の確認
  const { data: adminRole, error: adminError } = await supabase
    .from("admin_roles")
    .select("*")
    .eq("user_id", currentUserId)
    .single()
  
  // デバッグログ
  console.log("管理者権限チェック:", { adminRole, adminError })
  
  // 管理者権限がない場合は権限エラーページへリダイレクト
  if (!adminRole || adminError) {
    console.error("管理者権限がありません:", adminError)
    redirect('/unauthorized')
  }

  // 管理者IDのリストを取得
  const { data: adminUsers } = await supabase
    .from("admin_roles")
    .select("user_id")

  const adminUserIds = adminUsers?.map(admin => admin.user_id) || []
  console.log(`管理者ユーザー数: ${adminUserIds.length}`);

  // 申請詳細を取得
  console.log(`申請詳細データ取得開始 - ID: ${id}`);
  try {
    // まず基本情報のみを取得して存在確認
    const { data: applicationBasic, error: basicError } = await supabase
    .from("course_applications")
    .select(`
        id, 
        user_id, 
        course_id, 
        status, 
        content_snare_request_id,
        created_at,
      course:course_id (
        id,
        name,
        schools (
          id,
          name
        )
        )
      `)
      .eq("id", id)
      .single();
    
    if (!applicationBasic) {
      console.error(`申請基本データが見つかりません - ID: ${id}`);
      console.error("取得エラー詳細:", basicError);
      notFound();
    }
    
    console.log(`申請基本データ取得成功 - ID: ${id}`);
    
    // 詳細データを取得
    let { data: application, error } = await supabase
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
          path,
            downloaded,
            created_at
        )
      ),
      course_application_comments (
        id,
        comment,
        created_at,
        user_id
      )
    `)
    .eq("id", id)
    .single()

    // 申請データが取得できたかのデバッグログ
    if (application) {
      console.log(`申請詳細データ取得成功 - ID: ${id}`);
      console.log("申請データ概要:", {
        申請ID: application.id,
        コースID: application.course_id,
        ユーザーID: application.user_id,
        ステータス: application.status,
        コンテントスネアID: application.content_snare_request_id
      });
    } else {
      console.error(`申請詳細データの取得中にエラーが発生しました - ID: ${id}`);
      console.error("取得エラー詳細:", error);
      
      // エラーの種類を詳細に記録
      if (error) {
        if (error.code === "PGRST116") {
          console.error("データが見つかりません (404エラー)");
        } else if (error.code === "42501") {
          console.error("アクセス権限がありません (RLSエラー)");
        } else {
          console.error(`不明なエラー: ${error.code} - ${error.message}`);
        }
      }
      
      // 基本情報は取得できているので、エラーページではなく基本情報だけで表示
      console.log("基本情報のみで表示を続行します");
      application = applicationBasic;
    }

    // ユーザープロフィール情報を別に取得する
    let userProfile = null;
    if (application?.user_id) {
      console.log(`ユーザープロフィール情報取得開始 - ユーザーID: ${application.user_id}`);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          phone,
          country,
          city,
          occupation,
          purpose
        `)
        .eq("id", application.user_id)
        .single();
      
      if (profile) {
        console.log(`ユーザープロフィール情報取得成功 - ユーザーID: ${application.user_id}`);
        userProfile = profile;
      } else {
        console.error(`ユーザープロフィール情報取得エラー - ユーザーID: ${application.user_id}`);
        console.error("プロフィールエラー:", profileError);
      }
    }

    // Content Snare情報を取得（詳細ページでのみ詳細なデータを取得）
    let contentSnareData = null;
    let contentSnarePages = null;
    
    if (application && application.content_snare_request_id) {
      console.log(`詳細ページ: Content Snare詳細情報取得開始 (ID: ${application.content_snare_request_id})`);
      try {
        // 絶対URLを使用
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const contentSnareApiUrl = `${baseUrl}/api/content-snare/admin/get-request-status?request_id=${application.content_snare_request_id}&verbose=true`;
        
        console.log(`Content Snare API呼び出し: ${contentSnareApiUrl}`);
        
        // 認証情報を含めるためのヘッダーを設定
        const snareResponse = await fetch(contentSnareApiUrl, { 
          cache: 'no-store',
          headers: {
            'cookie': cookies().toString()
          }
        });
        
        if (snareResponse.ok) {
          contentSnareData = await snareResponse.json();
          console.log(`Content Snare詳細情報取得成功 (ID: ${application.content_snare_request_id})`);
          console.log("API直接レスポンス値:", {
            fields_count: contentSnareData.fields_count,
            done_fields_count: contentSnareData.done_fields_count,
            completion_percentage: contentSnareData.completion_percentage
          });
          
          // ページ情報はメインのデータから直接取得
          if (contentSnareData.pages) {
            console.log(`Content Snareページ情報: ${contentSnareData.pages.length || 0}ページ`);
            contentSnarePages = contentSnareData.pages;
            
            // ページデータからprogressデータを計算して追加
            if (contentSnarePages && contentSnarePages.length > 0) {
              let totalFields = 0;
              let doneTotalFields = 0;
              let completedSections = 0;
              let totalSections = contentSnareData.sections?.length || 0;
              
              // セクション数をカウント
              if (contentSnareData.sections) {
                completedSections = contentSnareData.sections.filter(
                  (section: any) => section.status === 'complete'
                ).length;
              }
              
              // APIから直接取得したフィールド数を優先的に使用
              if (contentSnareData.fields_count !== undefined && contentSnareData.done_fields_count !== undefined) {
                totalFields = Number(contentSnareData.fields_count);
                doneTotalFields = Number(contentSnareData.done_fields_count);
                
                console.log("APIから直接取得した値を使用:", {
                  totalFields,
                  doneTotalFields
                });
              } else {
                // APIから取得できない場合は各ページの合計を計算
                console.log("各ページの合計からフィールド数を計算します");
                
                // フィールドの完了状況を計算
                contentSnarePages.forEach((page: any) => {
                  // fields_countがnullまたはundefinedの場合は0として扱う
                  const pageFieldsCount = page.fields_count !== undefined && page.fields_count !== null
                    ? Number(page.fields_count) 
                    : 0;
                    
                  // done_fields_countがnullまたはundefinedの場合は0として扱う
                  const pageDoneFieldsCount = page.done_fields_count !== undefined && page.done_fields_count !== null
                    ? Number(page.done_fields_count)
                    : 0;
                  
                  totalFields += pageFieldsCount;
                  doneTotalFields += pageDoneFieldsCount;
                  
                  // 各ページの処理をログに出力
                  console.log(`ページフィールド加算: ${page.name || 'No Name'}`, {
                    original_fields_count: page.fields_count,
                    original_done_fields_count: page.done_fields_count,
                    processed_fields_count: pageFieldsCount,
                    processed_done_fields_count: pageDoneFieldsCount,
                    running_total_fields: totalFields,
                    running_done_fields: doneTotalFields
                  });
                });
              }
              
              // progressオブジェクトを作成
              // APIから直接completion_percentageが取得できれば、それを使用
              let percent = 0;
              if (contentSnareData.completion_percentage !== undefined) {
                percent = Number(contentSnareData.completion_percentage);
                console.log(`APIから直接取得した完了率を使用: ${percent}%`);
              } else if (totalFields > 0) {
                percent = Math.round((doneTotalFields / totalFields) * 100);
                console.log(`計算した完了率を使用: ${percent}%`);
              }
              
              // デバッグログを追加
              console.log('フィールド集計結果:', {
                totalFields,
                doneTotalFields,
                percent,
                completedSections,
                totalSections,
                pagesCount: contentSnarePages.length
              });
              
              // 各ページのフィールド情報をログに出力
              contentSnarePages.forEach((page: any, index: number) => {
                console.log(`ページ ${index + 1} (${page.name}):`, {
                  fields_count: page.fields_count || 0,
                  done_fields_count: page.done_fields_count || 0,
                  status: page.status,
                  page_obj: page
                });
              });
              
              // contentSnareDataにprogressオブジェクトを追加
              contentSnareData.progress = {
                total_fields: totalFields,
                done_fields: doneTotalFields,
                percent: percent,
                completed_sections: completedSections,
                total_sections: totalSections
              };
            } else if (contentSnareData.fields_count !== undefined && contentSnareData.done_fields_count !== undefined) {
              // ページデータがない場合でも、APIから直接取得したフィールド数からprogressオブジェクトを作成
              const totalFields = Number(contentSnareData.fields_count);
              const doneTotalFields = Number(contentSnareData.done_fields_count);
              let percent = 0;
              
              if (contentSnareData.completion_percentage !== undefined) {
                percent = Number(contentSnareData.completion_percentage);
              } else if (totalFields > 0) {
                percent = Math.round((doneTotalFields / totalFields) * 100);
              }
              
              console.log('ページデータなしでAPIから直接取得した値から進捗率を計算:', {
                totalFields,
                doneTotalFields,
                percent
              });
              
              contentSnareData.progress = {
                total_fields: totalFields,
                done_fields: doneTotalFields,
                percent: percent,
                completed_sections: 0,
                total_sections: contentSnareData.sections?.length || 0
              };
            }
          }
        } else {
          console.error(`Content Snare詳細情報取得エラー: ステータス ${snareResponse.status}`);
          const errorText = await snareResponse.text();
          console.error(`エラー詳細: ${errorText}`);
        }
      } catch (error) {
        console.error("Content Snare情報取得エラー:", error);
      }
    }

    // ユーザー情報取得（詳細クエリでユーザー情報が取得できなかった場合）
    if (application && !application.user && application.user_id) {
      try {
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, avatar_url")
          .eq("id", application.user_id)
          .single();
        
        if (userData) {
          application.user = userData;
        } else {
          console.error("ユーザー情報取得エラー:", userError);
        }
      } catch (error) {
        console.error("ユーザー情報取得中の予期せぬエラー:", error);
      }
    }

    // コメント情報取得（詳細クエリでコメント情報が取得できなかった場合）
    if (application && !application.course_application_comments) {
      try {
        const { data: comments, error: commentsError } = await supabase
          .from("course_application_comments")
          .select("id, comment, created_at, user_id")
          .eq("application_id", id)
          .order("created_at", { ascending: false });
        
        if (comments) {
          application.course_application_comments = comments;
          console.log(`コメント情報を別途取得: ${comments.length}件`);
        } else {
          console.error("コメント情報取得エラー:", commentsError);
          application.course_application_comments = [];
        }
      } catch (error) {
        console.error("コメント情報取得中の予期せぬエラー:", error);
        application.course_application_comments = [];
      }
    }

    // コメントのユーザー情報を取得
    if (application && application.course_application_comments && application.course_application_comments.length > 0) {
      console.log(`コメント数: ${application.course_application_comments.length}`);
      for (const comment of application.course_application_comments) {
        console.log(`コメントユーザー情報取得 - ユーザーID: ${comment.user_id}`);
        const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, avatar_url")
        .eq("id", comment.user_id)
        .single();
      
        if (profile) {
      comment.profile = profile;
        } else {
          console.error(`コメントユーザー情報取得エラー - ユーザーID: ${comment.user_id}`);
          console.error("エラー:", profileError);
        }
      }
    }

    // ドキュメント情報取得（詳細クエリでドキュメント情報が取得できなかった場合）
    if (application && !application.course_application_documents) {
      try {
        const { data: documents, error: documentsError } = await supabase
          .from("course_application_documents")
          .select(`
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
              path,
              downloaded,
              created_at
            )
          `)
          .eq("application_id", id);
        
        if (documents) {
          application.course_application_documents = documents;
          console.log(`ドキュメント情報を別途取得: ${documents.length}件`);
        } else {
          console.error("ドキュメント情報取得エラー:", documentsError);
          application.course_application_documents = [];
        }
      } catch (error) {
        console.error("ドキュメント情報取得中の予期せぬエラー:", error);
        application.course_application_documents = [];
      }
    }

    // ユーザープロフィール情報をアプリケーションオブジェクトに追加
    if (userProfile && application.user) {
      application.user.profile = userProfile;
  }

  // ユーザースケジュール情報を取得
  let schedules = [];
  if (application?.id) {
    console.log(`ユーザースケジュール情報取得開始 - 申請ID: ${application.id}`);
    const { data: schedulesData, error: schedulesError } = await supabase
      .from("user_schedules")
      .select('*')
      .eq("course_application_id", application.id)
      .order('year', { ascending: true })
      .order('month', { ascending: true })
      .order('day', { ascending: true })
      .order('sort_order', { ascending: true });
    
    if (schedulesData) {
      console.log(`ユーザースケジュール情報取得成功 - ${schedulesData.length}件`);
      schedules = schedulesData;
    } else {
      console.error(`ユーザースケジュール情報取得エラー - 申請ID: ${application.id}`);
      console.error("スケジュールエラー:", schedulesError);
      schedules = [];
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">申請詳細</h1>
        <Button asChild variant="outline">
          <Link href="/admin/applications">
            戻る
          </Link>
        </Button>
      </div>
      
      <ApplicationDetail 
        application={application} 
        adminUserIds={adminUserIds} 
        currentUserId={currentUserId}
        contentSnareData={contentSnareData}
        contentSnarePages={contentSnarePages}
        schedules={schedules}
      />
    </div>
  )
  } catch (generalError) {
    // 予期せぬエラーをキャッチしてログに記録
    console.error("予期せぬエラーが発生しました:", generalError);
    console.error("スタックトレース:", (generalError as Error).stack);
    
    // エラーページにリダイレクト
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-red-600">エラーが発生しました</h1>
        <p>申請データの取得中にエラーが発生しました。管理者にお問い合わせください。</p>
        <p>エラー詳細: {(generalError as Error).message}</p>
        <p>申請ID: {id}</p>
      </div>
    );
  }
}