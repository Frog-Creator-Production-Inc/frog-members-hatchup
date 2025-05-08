// 既存のimportとコードは省略...

// 通貨フォーマット関数を追加
export function formatCurrency(amount: number, currency: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
} 

/**
 * ファイルサイズをわかりやすい形式にフォーマットする
 * @param bytes ファイルサイズ（バイト）
 * @returns フォーマットされたファイルサイズ文字列
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 日付を日本語形式にフォーマットする
 * @param date フォーマットする日付（文字列またはDate）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 無効な日付の場合は空文字を返す
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}年${month}月${day}日`;
} 

/**
 * 生年月日専用のフォーマット関数（時間を含めない）
 * @param date フォーマットする日付（文字列またはDate）
 * @returns フォーマットされた日付文字列（yyyy年MM月dd日）
 */
export function formatBirthDate(date: string | Date): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 無効な日付の場合は空文字を返す
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}年${month}月${day}日`;
} 