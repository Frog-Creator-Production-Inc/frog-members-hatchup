export function calculateProgress(profile: any): number {
  if (!profile) return 0;

  // 必須フィールドのリスト
  const requiredFields = [
    'migration_goal',
    'english_level',
    'current_occupation',
    'future_occupation',
    'work_experience',
    'abroad_timing',
    'support_needed',
    'age_range',
    'working_holiday'
  ];

  // 入力済みフィールドの数をカウント
  const completedFields = requiredFields.filter(field => 
    profile[field] !== null && 
    profile[field] !== undefined && 
    profile[field] !== ''
  ).length;

  // 進捗率を計算（小数点以下切り捨て）
  return Math.floor((completedFields / requiredFields.length) * 100);
} 