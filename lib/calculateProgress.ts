import type { Profile } from "@/types/supabase"

export function calculateProgress(profile: Profile): number {
  const totalSteps = 7 // 全ステップ数（migration_goalを含む）
  let completedSteps = 0

  if (profile.migration_goal) completedSteps++
  if (profile.english_level) completedSteps++
  if (profile.work_experience) completedSteps++
  if (profile.working_holiday) completedSteps++
  if (profile.age_range) completedSteps++
  if (profile.abroad_timing) completedSteps++
  if (profile.support_needed) completedSteps++

  return Math.round((completedSteps / totalSteps) * 100)
}

