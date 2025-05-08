import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日付フォーマット関数
export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '未設定';
  
  try {
    const d = new Date(date);
    
    // 無効な日付かチェック
    if (isNaN(d.getTime())) {
      return '無効な日付';
    }
    
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch (error) {
    // console.error('Date formatting error:', error);
    return '無効な日付';
  }
}

// ファイルサイズをフォーマットする関数
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// formatFileSizeはformatBytesと同様の機能なので、formatBytesを使用するようにリダイレクト
export function formatFileSize(bytes: number) {
  return formatBytes(bytes, 2)
}