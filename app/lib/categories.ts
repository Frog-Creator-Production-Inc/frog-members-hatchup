/**
 * カテゴリ設定ファイル
 * 
 * このファイルでは、コミュニティカテゴリの設定を管理します。
 * 新しいカテゴリを追加する場合は、以下の手順に従ってください：
 * 
 * 1. COMMUNITY_CATEGORIESに新しいカテゴリを追加
 * 2. CATEGORY_CHANNEL_MAPに新しいカテゴリのチャンネルIDを設定
 * 3. app/lib/slack.tsのCATEGORY_POSITIONSに代表的な職種を追加
 * 
 * 注意: チャンネルIDはSlackワークスペースの管理画面から取得できます。
 * チャンネルを右クリック→「リンクをコピー」を選択すると、URLの末尾にチャンネルIDが表示されます。
 * 例: https://frog-events.slack.com/archives/C02PZPZR9HY
 *                                                 ↑
 *                                          これがチャンネルID
 */

// カテゴリ名の定義
export const COMMUNITY_CATEGORIES = {
  TECH: 'Tech',
  BUSINESS: 'Business',
  HOSPITALITY: 'Hospitality',
  HEALTHCARE: 'Healthcare',
  CREATIVE: 'Creative',
  // 新しいカテゴリを追加する場合は、ここに追加してください
  // 例: FINANCE: 'Finance',
};

/**
 * カテゴリごとのチャンネルIDマッピング
 * 
 * 各カテゴリに対応するSlackチャンネルのIDを設定します。
 * 複数のチャンネルを設定する場合は、配列に追加してください。
 * 最初のチャンネルIDがメインチャンネルとして使用されます。
 * 
 * 現在の設定:
 * - Tech: C02PZPZR9HY (実際のFrog Slackの技術カテゴリチャンネル)
 * - その他のカテゴリ: 仮のID（実際のチャンネルIDに置き換えてください）
 */
export const CATEGORY_CHANNEL_MAP: Record<string, string[]> = {
  [COMMUNITY_CATEGORIES.TECH]: ['C02PZPZR9HY'], // Techカテゴリのチャンネル
  [COMMUNITY_CATEGORIES.BUSINESS]: ['C02PZPZR9HZ'], // ビジネスカテゴリのチャンネル（仮のID）
  [COMMUNITY_CATEGORIES.HOSPITALITY]: ['C02PZPZR9I0'], // ホスピタリティカテゴリのチャンネル（仮のID）
  [COMMUNITY_CATEGORIES.HEALTHCARE]: ['C02PZPZR9I1'], // ヘルスケアカテゴリのチャンネル（仮のID）
  [COMMUNITY_CATEGORIES.CREATIVE]: ['C02PZPZR9I2'], // クリエイティブカテゴリのチャンネル（仮のID）
  // 新しいカテゴリを追加する場合は、ここにチャンネルIDを設定してください
  // 例: [COMMUNITY_CATEGORIES.FINANCE]: ['C02PZPZR9I3'],
};

/**
 * カテゴリ名からチャンネルIDを取得する関数
 * @param category カテゴリ名
 * @returns チャンネルID（存在しない場合はnull）
 */
export function getCategoryChannelId(category: string): string | null {
  const channelIds = CATEGORY_CHANNEL_MAP[category];
  if (!channelIds || channelIds.length === 0) {
    return null;
  }
  return channelIds[0]; // 最初のチャンネルIDを返す
}

/**
 * カテゴリ名が有効かどうかを確認する関数
 * @param category カテゴリ名
 * @returns 有効な場合はtrue、無効な場合はfalse
 */
export function isValidCategory(category: string): boolean {
  return Object.values(COMMUNITY_CATEGORIES).includes(category);
}

/**
 * すべてのカテゴリ名を取得する関数
 * @returns カテゴリ名の配列
 */
export function getAllCategories(): string[] {
  return Object.values(COMMUNITY_CATEGORIES);
} 