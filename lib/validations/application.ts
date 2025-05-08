import * as z from 'zod'
import { 
  DOCUMENT_TYPES, 
  APPLICATION_STATUS, 
  DOCUMENT_STATUS, 
  PAYMENT_METHODS, 
  PURPOSE_TYPES 
} from '@/types/application'

// スケジュールフォームのバリデーションスキーマ
export const scheduleFormSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  year: z.coerce.number().min(2000, "正しい年を入力してください").max(2100, "正しい年を入力してください"),
  month: z.coerce.number().min(1, "1-12の数値を入力してください").max(12, "1-12の数値を入力してください"),
  day: z.coerce.number().min(1, "1-31の数値を入力してください").max(31, "1-31の数値を入力してください").optional().nullable(),
  is_completed: z.boolean().default(false),
  is_admin_locked: z.boolean().default(false),
  sort_order: z.coerce.number().default(0)
})

// スケジュール日付フォームのバリデーションスキーマ
export const scheduleDateFormSchema = z.object({
  year: z.coerce.number().min(2000, "正しい年を入力してください").max(2100, "正しい年を入力してください"),
  month: z.coerce.number().min(1, "1-12の数値を入力してください").max(12, "1-12の数値を入力してください"),
  day: z.coerce.number().min(1, "1-31の数値を入力してください").max(31, "1-31の数値を入力してください").optional().nullable()
})

// 申請フォームのバリデーションスキーマ
export const applicationFormSchema = z.object({
  course_id: z.string().min(1, "コースを選択してください"),
  preferred_start_date: z.string().optional().nullable(),
  purpose: z.enum([PURPOSE_TYPES.OVERSEAS_JOB, PURPOSE_TYPES.CAREER_CHANGE, PURPOSE_TYPES.LANGUAGE]).optional().nullable(),
  payment_method: z.enum([PAYMENT_METHODS.JAPAN_BANK, PAYMENT_METHODS.CREDIT_CARD, PAYMENT_METHODS.CANADA_BANK]).optional().nullable(),
  admin_notes: z.string().optional().nullable()
})

// ドキュメントフォームのバリデーションスキーマ
export const documentFormSchema = z.object({
  document_type: z.enum([DOCUMENT_TYPES.PASSPORT, DOCUMENT_TYPES.RESUME, DOCUMENT_TYPES.CERTIFICATE, DOCUMENT_TYPES.OTHER]),
  file_id: z.string().min(1, "ファイルをアップロードしてください"),
  status: z.enum([DOCUMENT_STATUS.PENDING, DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.REJECTED]).default(DOCUMENT_STATUS.PENDING)
})

// 型の定義
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>
export type ScheduleDateFormData = z.infer<typeof scheduleDateFormSchema>
export type ApplicationFormData = z.infer<typeof applicationFormSchema>
export type DocumentFormData = z.infer<typeof documentFormSchema> 