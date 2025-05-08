import { Metadata } from 'next';
import CommunityHeader from '@/app/community/components/community-header';
import CommunityCategories from '@/app/community/components/community-categories';
import { getAllCategoryInfo } from '@/app/lib/slack';
import { COMMUNITY_CATEGORIES } from '@/app/lib/categories';

export const metadata: Metadata = {
  title: 'Frogコミュニティ | 職種別Slackコミュニティ',
  description: 'Frogが運営する職種別Slackコミュニティの情報。Tech、Business、Hospitality、Healthcare、Creativeなど各分野のコミュニティ情報、参加人数、新規参加者数、代表的な職種などを確認できます。',
};

// 1時間ごとにデータを再検証
export const revalidate = 3600;

/**
 * 各カテゴリの代表的な職種を手動で設定
 * 必要に応じて編集してください
 */
const CATEGORY_POSITIONS_MANUAL: Record<string, string[]> = {
  [COMMUNITY_CATEGORIES.TECH]: [
    'ソフトウェアエンジニア',
    'プロダクトマネージャー',
    'データサイエンティスト'
  ],
  [COMMUNITY_CATEGORIES.BUSINESS]: [
    'マーケティングマネージャー',
    'ビジネスアナリスト',
    'セールスディレクター'
  ],
  [COMMUNITY_CATEGORIES.HOSPITALITY]: [
    'ホテルマネージャー',
    'レストランオーナー',
    'ツアーコーディネーター'
  ],
  [COMMUNITY_CATEGORIES.HEALTHCARE]: [
    '医師',
    '看護師',
    '医療研究者'
  ],
  [COMMUNITY_CATEGORIES.CREATIVE]: [
    'グラフィックデザイナー',
    'UX/UIデザイナー',
    'コンテンツクリエイター'
  ],
};

export default async function CommunityPage() {
  console.log('=== コミュニティページの読み込み開始 ===');
  
  try {
    // 直接関数を呼び出してカテゴリ情報を取得（APIを経由せず）
    console.log('カテゴリ情報の取得を開始');
    const categories = await getAllCategoryInfo(true);
    console.log('カテゴリ情報の取得完了:', JSON.stringify(categories, null, 2));

    // 手動で設定した職種情報を適用
    const categoriesWithCustomPositions = categories.map(category => ({
      ...category,
      positions: CATEGORY_POSITIONS_MANUAL[category.name] || category.positions
    }));

    return (
      <div className="w-full">
        <CommunityHeader />
        <CommunityCategories categories={categoriesWithCustomPositions} />
      </div>
    );
  } catch (error) {
    console.error('コミュニティページの読み込み中にエラーが発生:', error);
    
    // エラーが発生した場合でもUIを表示
    return (
      <div className="w-full">
        <CommunityHeader />
        <div className="p-4 my-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">データの読み込み中にエラーが発生しました</h3>
          <p className="mt-2 text-sm text-red-700">
            コミュニティ情報の取得中に問題が発生しました。しばらく経ってからもう一度お試しください。
          </p>
        </div>
      </div>
    );
  }
} 