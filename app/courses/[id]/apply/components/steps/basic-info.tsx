import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CourseApplication } from "@/types/application"
import { toast } from "react-hot-toast"
import { PAYMENT_METHODS, PURPOSE_TYPES, type PaymentMethod, type PurposeType } from "@/types/application"

interface BasicInfoProps {
  application: CourseApplication
  onSubmit: (data: Partial<CourseApplication>) => void
}

export function BasicInfo({ application, onSubmit }: BasicInfoProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // フォームデータの詳細をデバッグ
    console.log('=== Form Data Debug ===')
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }

    // payment_methodの値を型安全に取得
    const paymentMethod = formData.get("payment_method")?.toString()
    
    // payment_methodの値が有効な値かチェック
    if (paymentMethod && !Object.values(PAYMENT_METHODS).includes(paymentMethod as PaymentMethod)) {
      console.error('Invalid payment method:', paymentMethod)
      toast.error("無効な支払い方法が選択されています")
      return
    }

    const updateData: Partial<CourseApplication> = {
      preferred_start_date: formData.get("preferred_start_date")?.toString() || "",
      purpose: (formData.get("purpose")?.toString() || "") as PurposeType,
      payment_method: paymentMethod as PaymentMethod || null,
    }

    // バリデーション
    if (!updateData.preferred_start_date || !updateData.purpose || !updateData.payment_method) {
      console.log('Validation Failed:', {
        preferred_start_date: !updateData.preferred_start_date,
        purpose: !updateData.purpose,
        payment_method: !updateData.payment_method
      })
      toast.error("すべての項目を入力してください")
      return
    }

    console.log('=== Submit Data ===')
    console.log('Current Application:', application)
    console.log('Data to Submit:', updateData)

    onSubmit(updateData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="preferred_start_date">希望開始時期</Label>
          <Input
            id="preferred_start_date"
            name="preferred_start_date"
            type="month"
            defaultValue={application.preferred_start_date || ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>申請目的</Label>
          <RadioGroup
            name="purpose"
            defaultValue={application.purpose || PURPOSE_TYPES.OVERSEAS_JOB}
            required
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PURPOSE_TYPES.OVERSEAS_JOB} id="overseas_job" />
              <Label htmlFor="overseas_job">海外就職</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PURPOSE_TYPES.CAREER_CHANGE} id="career_change" />
              <Label htmlFor="career_change">キャリアチェンジ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PURPOSE_TYPES.LANGUAGE} id="language" />
              <Label htmlFor="language">語学力向上</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>支払い方法</Label>
          <RadioGroup
            name="payment_method"
            defaultValue={application.payment_method || PAYMENT_METHODS.JAPAN_BANK}
            required
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PAYMENT_METHODS.JAPAN_BANK} id="japan_bank" />
              <Label htmlFor="japan_bank">日本の銀行送金</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PAYMENT_METHODS.CREDIT_CARD} id="credit_card" />
              <Label htmlFor="credit_card">クレジットカード</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PAYMENT_METHODS.CANADA_BANK} id="canada_bank" />
              <Label htmlFor="canada_bank">カナダの銀行送金</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">
          次へ
        </Button>
      </div>
    </form>
  )
} 