export const DOCUMENT_TYPES = {
  PASSPORT: "passport",
  RESUME: "resume",
  CERTIFICATE: "certificate",
  OTHER: "other",
} as const

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES]

export const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWING: "reviewing",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS]

export const DOCUMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

export type DocumentStatus = typeof DOCUMENT_STATUS[keyof typeof DOCUMENT_STATUS]

export const PAYMENT_METHODS = {
  JAPAN_BANK: 'japan_bank',
  CREDIT_CARD: 'credit_card',
  CANADA_BANK: 'canada_bank',
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]

export const PURPOSE_TYPES = {
  OVERSEAS_JOB: 'overseas_job',
  CAREER_CHANGE: 'career_change',
  LANGUAGE: 'language',
} as const

export type PurposeType = typeof PURPOSE_TYPES[keyof typeof PURPOSE_TYPES]

export interface CourseApplication {
  id: string
  user_id: string
  course_id: string
  status: ApplicationStatus
  preferred_start_date: string | null
  purpose: PurposeType | null
  payment_method: PaymentMethod | null
  created_at: string
  updated_at: string
  admin_notes: string | null
  content_snare_request_id?: string
  content_snare_id?: string
  intake_date?: IntakeDate
}

export interface IntakeDate {
  id: string
  course_id: string
  start_date?: string
  application_deadline?: string | null
  month?: number
  day?: number | null
  year?: number | null
  is_tentative?: boolean
  notes?: string | null
}

export interface ApplicationDocument {
  id: string
  application_id: string
  file_id: string
  document_type: DocumentType
  created_at: string
  updated_at: string
  status: DocumentStatus
}

export interface UserSchedule {
  id: string
  course_application_id: string
  title: string
  description: string | null
  year: number
  month: number
  day: number | null
  is_completed: boolean
  is_admin_locked: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ContentSnareData {
  id: string
  request_id: string
  status: string
  progress: number
  created_at: string
  updated_at: string
  pages?: ContentSnarePage[]
}

export interface ContentSnarePage {
  id: string
  request_id: string
  page_number: number
  status: string
  content: string | null
  created_at: string
  updated_at: string
} 