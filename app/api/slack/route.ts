import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { 
  getAllCategoryInfo, 
  getNewMembersCount, 
  getGeneralChannelMemberCount 
} from '@/app/lib/slack';
import { 
  getCategoryChannelId, 
  isValidCategory, 
  COMMUNITY_CATEGORIES 
} from '@/app/lib/categories';

// キャッシュ設定
export const revalidate = 3600; // 1時間ごとにデータを再検証

// グローバルキャッシュ用のオブジェクト
const CACHE = {
  newMembersCount: {} as Record<string, { count: number, timestamp: number }>,
  memberCount: {} as Record<string, { count: number, timestamp: number }>,
};

// キャッシュの有効期限（1時間 = 3600000ミリ秒）
const CACHE_TTL = 3600000;

/**
 * Slack API関連のエンドポイント
 * 
 * 対応するエンドポイント:
 * - /api/slack - すべてのカテゴリ情報を取得
 * - /api/slack?action=new-members-count&category=Tech - 特定カテゴリの新規メンバー数を取得
 * - /api/slack?action=member-count&category=Tech - 特定カテゴリのメンバー数を取得
 * - /api/slack?action=general-member-count - generalチャンネルのメンバー数を取得
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const category = searchParams.get('category');

    // アクションに基づいて処理を分岐
    switch (action) {
      case 'new-members-count':
        return handleNewMembersCount(category);
      
      case 'member-count':
        return handleMemberCount(category);
      
      case 'general-member-count':
        return handleGeneralMemberCount();
      
      default:
        // アクションが指定されていない場合は、すべてのカテゴリ情報を返す
        return handleAllCategoryInfo();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * すべてのカテゴリ情報を取得するハンドラー
 */
async function handleAllCategoryInfo() {
  try {
    // すべてのカテゴリ情報を取得
    const categories = await getAllCategoryInfo();
    
    return NextResponse.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'コミュニティデータの取得に失敗しました' 
      },
      { status: 500 }
    );
  }
}

/**
 * 特定カテゴリの新規メンバー数を取得するハンドラー
 */
async function handleNewMembersCount(category: string | null) {
  if (!category) {
    return NextResponse.json(
      { error: 'Category parameter is required' },
      { status: 400 }
    );
  }

  // カテゴリに対応するチャンネルIDを取得
  const channelId = getCategoryChannelId(category);
  
  if (!channelId) {
    return NextResponse.json(
      { error: `Invalid category: ${category}` },
      { status: 400 }
    );
  }

  // キャッシュをチェック
  const cacheKey = `${category}`;
  const cachedData = CACHE.newMembersCount[cacheKey];
  const now = Date.now();

  // キャッシュが有効な場合はキャッシュから返す
  if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
    return NextResponse.json({
      category,
      newMembersCount: cachedData.count,
      cached: true
    });
  }

  // 新規参加者数を取得
  const newMembersCount = await getNewMembersCount(channelId);
  
  // キャッシュを更新
  CACHE.newMembersCount[cacheKey] = {
    count: newMembersCount,
    timestamp: now
  };

  return NextResponse.json({
    category,
    newMembersCount,
    cached: false
  });
}

/**
 * 特定カテゴリのメンバー数を取得するハンドラー
 */
async function handleMemberCount(category: string | null) {
  if (!category) {
    return NextResponse.json(
      { error: 'Category parameter is required' },
      { status: 400 }
    );
  }

  if (!isValidCategory(category)) {
    return NextResponse.json(
      { error: `Invalid category: ${category}` },
      { status: 400 }
    );
  }

  // キャッシュをチェック
  const cacheKey = `${category}`;
  const cachedData = CACHE.memberCount[cacheKey];
  const now = Date.now();

  // キャッシュが有効な場合はキャッシュから返す
  if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
    return NextResponse.json({
      category,
      memberCount: cachedData.count,
      cached: true
    });
  }

  // カテゴリに対応するチャンネルIDを取得
  const channelId = getCategoryChannelId(category);
  
  if (!channelId) {
    return NextResponse.json({
      category,
      memberCount: 150, // デフォルト値
      source: 'default'
    });
  }

  // Techカテゴリの場合はgeneralチャンネルのメンバー数を取得
  let memberCount = 150; // デフォルト値
  
  if (category === COMMUNITY_CATEGORIES.TECH) {
    memberCount = await getGeneralChannelMemberCount();
  } else {
    // 他のカテゴリの場合は、対応するチャンネルのメンバー数を取得する処理を実装予定
    // 現在はデフォルト値を返す
    memberCount = 150;
  }

  // キャッシュを更新
  CACHE.memberCount[cacheKey] = {
    count: memberCount,
    timestamp: now
  };

  return NextResponse.json({
    category,
    memberCount,
    cached: false
  });
}

/**
 * generalチャンネルのメンバー数を取得するハンドラー
 */
async function handleGeneralMemberCount() {
  try {
    // XAPPトークンの確認
    const xappToken = process.env.SLACK_XAPP_TOKEN;
    
    if (!xappToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'XAPPトークンが設定されていません',
          memberCount: 150 // フォールバック値
        }
      );
    }

    // メンバー数を取得
    const memberCount = await getGeneralChannelMemberCount();
    
    return NextResponse.json({
      success: true,
      memberCount,
      source: 'slack_api'
    });
  } catch (error) {
    
    return NextResponse.json({
      success: false,
      memberCount: 150, // フォールバック値
      source: 'error',
      error: String(error)
    });
  }
} 