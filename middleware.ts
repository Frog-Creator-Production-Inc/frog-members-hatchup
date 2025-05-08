import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// パブリックルート（認証不要）のリスト
const PUBLIC_ROUTES = [
  '/auth', 
  '/auth/callback', 
  '/', 
  '/legal', 
  '/legal/privacy-policy', 
  '/legal/terms',
  '/contact',
  '/contact/business',
  '/unauthorized' // 未認可ページを追加
]

// 静的アセットのパターン
const STATIC_ASSET_PATTERNS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

// APIパターン（ログ出力に関する特別な処理が必要なもの）
const SPECIAL_API_PATTERNS = [
  '/api/slack',   // Slack関連エンドポイント
  '/api/content-snare',  // ContentSnare関連エンドポイント
]

// 管理画面申請詳細ページのURLパターン
const ADMIN_APPLICATION_DETAIL_REGEX = /^\/admin\/applications\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// 学校編集ページのURLパターン (with token)
const SCHOOL_EDITOR_TOKEN_REGEX = /^\/schools\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/editor$/i;

// ベースURLを取得
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// 管理者専用のパスかどうかをチェック
const isAdminPath = (pathname: string) => {
  return pathname.startsWith('/admin')
}

// 認証が必要なパスかどうかをチェック
const isAuthRequired = (pathname: string) => {
  const publicPaths = ['/', '/auth', '/privacy', '/terms', '/contact']
  const publicPrefixes = ['/blog/'] // コースは認証が必要なため除外
  
  // 完全一致のパスをチェック
  if (publicPaths.includes(pathname)) return false
  
  // プレフィックスをチェック
  if (publicPrefixes.some(prefix => pathname.startsWith(prefix))) return false
  
  // トークン付き学校編集ページはパブリックルート扱い
  if (SCHOOL_EDITOR_TOKEN_REGEX.test(pathname)) return false
  
  // その他のパスは認証が必要
  return true
}

export async function middleware(req: NextRequest) {
  // 静的ファイルやAPIルートはスキップ
  const pathname = req.nextUrl.pathname
  const searchParams = req.nextUrl.searchParams
  
  // ミドルウェアのデバッグ情報をログに出力
  console.log("===== ミドルウェア実行 =====");
  console.log(`リクエストURL: ${req.url}`);
  console.log(`パス: ${pathname}`);
  console.log(`URLパラメータ: ${JSON.stringify(Object.fromEntries(req.nextUrl.searchParams))}`);
  console.log(`アプリURL: ${getBaseUrl()}`);
  
  // 特別な処理が必要なAPIパターンかどうか確認
  const isSpecialApiPattern = SPECIAL_API_PATTERNS.some(pattern => pathname.startsWith(pattern));
  
  // APIリクエストでも特別なパターンの場合は詳細ログを出力
  if (isSpecialApiPattern) {
    console.log(`特別なAPIリクエスト検出: ${pathname}`);
    console.log(`メソッド: ${req.method}`);
    console.log(`ヘッダー: ${JSON.stringify(Object.fromEntries(req.headers))}`);
    
    // Slack通知関連のエンドポイントの場合
    if (pathname.startsWith('/api/slack')) {
      console.log(`=== Slack通知APIリクエスト ===`);
      console.log(`時刻: ${new Date().toISOString()}`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`Webhook設定: ${process.env.SLACK_ADMIN_WEBHOOK_URL ? '設定あり' : '未設定'}`);
    }
  }
  
  // トークン付き学校編集ページへのアクセスをチェック
  if (SCHOOL_EDITOR_TOKEN_REGEX.test(pathname) && searchParams.has('token')) {
    console.log("トークン付き学校編集ページへのアクセス: スキップ");
    return NextResponse.next();
  }
  
  // 管理画面の詳細ページへのアクセスをより詳細にログ
  const applicationDetailMatch = pathname.match(ADMIN_APPLICATION_DETAIL_REGEX);
  if (applicationDetailMatch) {
    const applicationId = applicationDetailMatch[1];
    console.log("======================================");
    console.log("管理画面申請詳細ページアクセス検出");
    console.log(`ID: ${applicationId}`);
    console.log(`完全なURL: ${req.url}`);
    console.log(`リファラー: ${req.headers.get('referer') || 'なし'}`);
    console.log(`User-Agent: ${req.headers.get('user-agent') || 'なし'}`);
    console.log(`Host: ${req.headers.get('host') || 'なし'}`);
    console.log(`アクセス時刻: ${new Date().toISOString()}`);
    console.log("======================================");
  }
  
  // 静的アセットへのリクエストはスキップ
  if (
    (STATIC_ASSET_PATTERNS.some(pattern => pathname.startsWith(pattern)) ||
    pathname.includes('.')) &&
    !isSpecialApiPattern // 特別なAPIパターンは静的アセットとして扱わない
  ) {
    console.log("静的アセットへのリクエスト: スキップ");
    return NextResponse.next()
  }

  // API関連のリクエストは認証チェックをスキップ
  if (pathname.startsWith('/api') && !isSpecialApiPattern) {
    console.log("APIリクエスト: 認証チェックスキップ");
    return NextResponse.next()
  }

  // パブリックルートのチェック
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || 
                        pathname.startsWith('/legal/') || 
                        pathname.startsWith('/contact/') ||
                        pathname.startsWith('/blog/')
  
  console.log(`パブリックルート: ${isPublicRoute}`);
  
  const res = NextResponse.next()

  // ヘッダーの転送
  req.headers.forEach((value, key) => {
    res.headers.set(key, value)
  })

  // APIキーをヘッダーに追加
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  res.headers.set('apikey', supabaseKey);
  res.headers.set('Authorization', `Bearer ${supabaseKey}`);

  const supabase = createMiddlewareClient({ 
    req, 
    res,
  })

  // コールバック処理中の場合は優先的に処理
  if (pathname === '/auth/callback' || 
     (pathname === '/auth' && searchParams.has('code'))) {
    console.log("認証コールバック処理中: 通過");
    return res;
  }

  // セッションを取得
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // 認証エラーがある場合はログ出力
  if (sessionError) {
    console.error("認証エラー:", sessionError);
  }
  
  // 認証状態をログ出力
  console.log(`認証状態: ${session ? '認証済み' : '未認証'}`);
  
  // 認証が必要なパスかつセッションがない場合はログインページにリダイレクト
  if (!session && isAuthRequired(pathname)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    // 現在のURLをredirect_toに設定
    redirectUrl.searchParams.set('redirect_to', pathname)
    console.log(`認証必要: ${pathname} から /auth へリダイレクト`);
    return NextResponse.redirect(redirectUrl)
  }
  
  // 以下、認証済みユーザーの処理
  if (session) {
    console.log(`認証済みユーザー情報: ID=${session.user.id}, Email=${session.user.email}`);
    
    // 管理者かどうかをチェックする関数
    const checkIsAdmin = async () => {
      try {
        console.log(`管理者チェック開始: ユーザーID ${session.user.id}`);
        // ServiceRoleを使用して管理者チェック
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        
        if (!serviceKey || !supabaseUrl) {
          console.error("管理者チェック: サービスキーまたはURL未設定");
          return false;
        }
        
        const adminCheckURL = `${supabaseUrl}/rest/v1/admin_roles?user_id=eq.${session.user.id}&select=user_id`;
        console.log(`管理者DBチェックURL: ${adminCheckURL}`);
        
        const adminCheckResponse = await fetch(adminCheckURL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Cache-Control': 'no-cache',
            'Prefer': 'return=representation'
          }
        });
        
        if (!adminCheckResponse.ok) {
          console.error(`管理者チェックAPIエラー: ${adminCheckResponse.status}`);
          return false;
        }
        
        const adminRoleData = await adminCheckResponse.json();
        console.log(`管理者DBレスポンス: ${JSON.stringify(adminRoleData)}`);
        
        if (adminRoleData && Array.isArray(adminRoleData) && adminRoleData.length > 0) {
          console.log(`管理者権限確認: 成功 (ユーザーID=${session.user.id})`);
          return true;
        } else {
          console.log(`管理者権限なし: 一般ユーザー (ユーザーID=${session.user.id})`);
          return false;
        }
      } catch (error) {
        console.error("管理者チェックエラー:", error);
        return false;
      }
    };
    
    // 管理者ユーザーが/dashboardにアクセスしようとした場合、/adminにリダイレクト
    if (pathname.startsWith('/dashboard')) {
      const isAdmin = await checkIsAdmin();
      
      if (isAdmin) {
        console.log("管理者ユーザーがダッシュボードにアクセス: 管理画面へリダイレクト");
        const baseUrl = getBaseUrl();
        return NextResponse.redirect(new URL('/admin', baseUrl));
      } else {
        console.log("一般ユーザーのダッシュボードアクセス: 許可");
      }
    }
    
    // 管理者専用のパスへのアクセスをチェック
    if (isAdminPath(pathname)) {
      const isAdmin = await checkIsAdmin();
      
      if (isAdmin) {
        console.log("管理者権限確認: 成功");
        return res;
      } else {
        // 管理者権限がない場合はダッシュボードにリダイレクト
        console.log("管理者ロールなし: ダッシュボードにリダイレクト");
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // 招待ユーザーチェック（プレリリース用機能）
    if (session.user.email) {
      const invitedEmails = process.env.NEXT_PUBLIC_INVITED_EMAILS?.split(',') || []
      if (!invitedEmails.includes(session.user.email) && pathname !== '/unauthorized') {
        console.log(`未招待ユーザー: ${session.user.email} - 未認可ページへリダイレクト`);
        const baseUrl = getBaseUrl();
        return NextResponse.redirect(new URL('/unauthorized', baseUrl));
      }
    }
    
    // パブリックルートへのアクセスは認証済みユーザーをリダイレクト
    if (isPublicRoute) {
      // 未認可ページの場合はそのまま表示
      if (pathname === '/unauthorized') {
        console.log("未認可ページへのアクセス: 表示許可");
        return res
      }
      
      // 管理者ユーザーかどうかを確認
      const isAdmin = await checkIsAdmin();
      
      if (isAdmin) {
        console.log("管理者ユーザー + パブリックルート: 管理画面へリダイレクト");
        const baseUrl = getBaseUrl();
        return NextResponse.redirect(new URL('/admin', baseUrl));
      }
      
      // プロファイルチェック
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error("プロファイル取得エラー:", profileError);
          
          // プロファイルが存在しない場合
          if (profileError.code === 'PGRST116') {
            console.log("プロフィール状態: 未作成");
            
            // オンボーディングページアクセスの場合は許可
            if (pathname === '/onboarding') {
              console.log("オンボーディング未完了: オンボーディングページへアクセス許可");
              return res;
            }
            
            // それ以外のパスの場合はオンボーディングへリダイレクト
            console.log("プロフィールなし: オンボーディングへリダイレクト");
            const baseUrl = getBaseUrl();
            return NextResponse.redirect(new URL('/onboarding', baseUrl));
          }
        }
        
        // プロファイルが存在する場合
        if (profile) {
          console.log(`プロファイル状態: オンボーディング${profile.onboarding_completed ? '完了' : '未完了'}`);
          
          // オンボーディングが未完了の場合
          if (!profile.onboarding_completed) {
            // オンボーディングページアクセスの場合は許可
            if (pathname === '/onboarding') {
              console.log("オンボーディング未完了: オンボーディングページへアクセス許可");
              return res;
            }
            
            // それ以外のパスの場合はオンボーディングへリダイレクト
            console.log("オンボーディング未完了: オンボーディングページへリダイレクト");
            const baseUrl = getBaseUrl();
            return NextResponse.redirect(new URL('/onboarding', baseUrl));
          }
          
          // オンボーディング完了済みの場合、ダッシュボードへリダイレクト（パブリックルートの場合）
          console.log("一般ユーザー + パブリックルート: ダッシュボードへリダイレクト");
          const baseUrl = getBaseUrl();
          return NextResponse.redirect(new URL('/dashboard', baseUrl));
        }
      } catch (error) {
        console.error("プロファイルチェック例外:", error);
      }
    }
    
    // プロファイルチェック（認証済みユーザーの追加チェック）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error("プロファイル取得エラー:", profileError);
      
      // プロファイルが存在しない場合はオンボーディングへ
      if (profileError.code === 'PGRST116') {
        console.log("プロフィール状態: 未作成");
        
        // オンボーディングページ以外へのアクセスはリダイレクト
        if (pathname !== '/onboarding') {
          console.log("プロフィールなし: オンボーディングへリダイレクト");
          const baseUrl = getBaseUrl();
          return NextResponse.redirect(new URL('/onboarding', baseUrl));
        }
        
        console.log("オンボーディング未完了: オンボーディングページへアクセス許可");
        return res;
      }
    }
    
    console.log(`プロファイル状態: ${profile ? `オンボーディング${profile.onboarding_completed ? '完了' : '未完了'}` : '未作成'}`);

    // オンボーディングページへのアクセスチェック
    if (pathname === '/onboarding') {
      // プロファイルが存在し、オンボーディング完了している場合はダッシュボードへ
      if (profile?.onboarding_completed) {
        console.log("オンボーディング完了済み: ダッシュボードへリダイレクト");
        const baseUrl = getBaseUrl();
        return NextResponse.redirect(new URL('/dashboard', baseUrl));
      }
      console.log("オンボーディング未完了: オンボーディングページへアクセス許可");
      return res;
    }

    // プロファイルが存在しない、またはオンボーディング未完了の場合
    if (!profile || !profile.onboarding_completed) {
      // オンボーディングページ以外へのアクセスはリダイレクト
      if (pathname !== '/onboarding') {
        console.log("オンボーディング未完了: オンボーディングページへリダイレクト");
        const baseUrl = getBaseUrl();
        return NextResponse.redirect(new URL('/onboarding', baseUrl));
      }
    }
    
    console.log("通常アクセス: 許可");
    return res;
  }
  
  // 未認証ユーザーの処理
  if (!session) {
    // パブリックルートまたはトークン付き学校編集ページの場合はそのまま処理
    if (isPublicRoute || (SCHOOL_EDITOR_TOKEN_REGEX.test(pathname) && searchParams.has('token'))) {
      console.log("未認証ユーザー + パブリックルート: 通過");
      return res;
    }
    
    // それ以外はランディングページへリダイレクト
    const baseUrl = getBaseUrl();
    const redirectUrl = new URL('/', baseUrl);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    console.log(`未認証ユーザー: リダイレクト先 ${redirectUrl.toString()}`);
    return NextResponse.redirect(redirectUrl);
  }

  // デフォルトの挙動
  console.log("デフォルト処理: 通過");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}