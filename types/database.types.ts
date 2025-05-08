export type School = {
  id: string
  name: string
  location_id: string
  website: string | null
  description: string | null
  created_at: string
  logo_url: string | null
  updated_at: string
  categories: string[]
  photos?: SchoolPhoto[]
  school_photos?: SchoolPhoto[]
  goal_location?: GoalLocation
}

export type SchoolPhoto = {
  id: string
  school_id: string
  url: string
  description: string | null
  created_at: string
  updated_at: string
}

export type GoalLocation = {
  id: string
  city: string
  country: string
}

export type Course = {
  id: string
  name: string
  school_id: string
  description: string | null
  category: string | null
  mode: string | null
  total_weeks: number | null
  lecture_weeks: number | null
  work_permit_weeks: number | null
  start_date: string | null
  tuition_and_others: number | null
  migration_goals: string[] | null
  created_at: string
  updated_at: string
}

