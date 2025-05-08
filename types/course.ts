export interface Course {
  id: string
  title: string
  description: string
  lessons_count?: number
  created_at: string
  updated_at: string
  category: string
  total_weeks: number
  lecture_weeks: number
  work_permit_weeks: number
  start_date: string
  tuition_and_others: string
  schools: {
    id: string
    name: string
    location_id: string
    website: string
    description: string
    average_english_level: string
    goal_location: {
      id: string
      city: string
      country: string
    }
  }
  course_subjects: Array<{
    id: string
    course_id: string
    title: string
    description: string | null
    created_at: string | null
    updated_at: string | null
  }>
} 