"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "react-hot-toast"
import { Check, FileText } from "lucide-react"
import { FileUpload } from "@/app/dashboard/components/file-upload"
import { Badge } from "@/components/ui/badge"

interface CourseApplicationFormProps {
  courseId: string
  applicationId: string
  userId: string
  onComplete: () => void
}

const REQUIRED_DOCUMENTS = [
  { type: "passport", name: "パスポート", description: "有効期限が6週間以上あるもの" },
  { type: "english_certificate", name: "英語力証明書", description: "TOEIC, IELTS等のスコア" },
  { type: "education", name: "最終学歴証明書", description: "卒業証書または成績証明書" },
  { type: "resume", name: "経歴書", description: "英文履歴書" },
]

const steps = [
  {
    title: "必要書類の確認",
    description: "申し込みに必要な書類を確認してください",
  },
  {
    title: "入学希望時期",
    description: "希望する入学時期を選択してください",
  },
  {
    title: "入学目的",
    description: "このコースを受講する目的を選択してください",
  },
  {
    title: "お支払い方法",
    description: "学費のお支払い方法を選択してください",
  },
  {
    title: "書類のアップロード",
    description: "必要書類をアップロードしてください",
  },
]

export function CourseApplicationForm({ courseId, applicationId, userId, onComplete }: CourseApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    preferred_start_date: "",
    purpose: "",
    payment_method: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})
  const supabase = createClientComponentClient()

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      try {
        // Check if all required documents are uploaded
        const allDocumentsUploaded = REQUIRED_DOCUMENTS.every(
          doc => uploadedFiles[doc.type]
        )

        if (!allDocumentsUploaded) {
          toast.error("すべての必要書類をアップロードしてください")
          return
        }

        const { error } = await supabase
          .from("course_applications")
          .update({
            ...formData,
            status: "submitted",
            submitted_at: new Date().toISOString(),
          })
          .eq("id", applicationId)

        if (error) throw error

        toast.success("申し込みが完了しました")
        onComplete()
      } catch (error) {
        console.error("Error submitting application:", error)
        toast.error("申し込みの送信に失敗しました")
      }
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleFileUpload = async (fileId: string, documentType: string) => {
    try {
      const { error } = await supabase
        .from("course_application_documents")
        .insert({
          application_id: applicationId,
          file_id: fileId,
          document_type: documentType,
        })

      if (error) throw error

      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: fileId
      }))

      toast.success(`${REQUIRED_DOCUMENTS.find(d => d.type === documentType)?.name}がアップロードされました`)
    } catch (error) {
      console.error("Error saving document:", error)
      toast.error("書類の保存に失敗しました")
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              {REQUIRED_DOCUMENTS.map((doc) => (
                <div key={doc.type} className="flex items-start gap-3 p-4 rounded-lg border">
                  <FileText className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <h4 className="font-medium">{doc.name}</h4>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="preferred_start_date">希望入学時期</Label>
            <Input
              id="preferred_start_date"
              type="month"
              value={formData.preferred_start_date}
              onChange={(e) => setFormData({ ...formData, preferred_start_date: e.target.value })}
              required
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Label>入学目的</Label>
            <RadioGroup
              value={formData.purpose}
              onValueChange={(value) => setFormData({ ...formData, purpose: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overseas_job" id="overseas_job" />
                <Label htmlFor="overseas_job">海外就職</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="career_change" id="career_change" />
                <Label htmlFor="career_change">キャリアチェンジ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="language" id="language" />
                <Label htmlFor="language">語学習得</Label>
              </div>
            </RadioGroup>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <Label>お支払い方法</Label>
            <RadioGroup
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="japan_bank" id="japan_bank" />
                <Label htmlFor="japan_bank">日本の銀行から送金</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card">クレジットカード払い</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="canada_bank" id="canada_bank" />
                <Label htmlFor="canada_bank">カナダの銀行から送金</Label>
              </div>
            </RadioGroup>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Label>必要書類のアップロード</Label>
            <FileUpload
              userId={userId}
              onUploadComplete={(fileId, fileName) => {
                // ファイル名から書類タイプを推測
                const documentType = REQUIRED_DOCUMENTS.find(
                  doc => fileName.toLowerCase().includes(doc.type)
                )?.type

                if (documentType) {
                  handleFileUpload(fileId, documentType)
                } else {
                  toast.error("ファイル名から書類タイプを特定できませんでした")
                }
              }}
              acceptedFileTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">アップロード状況</h4>
              <div className="space-y-2">
                {REQUIRED_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.type}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <span className="text-sm">{doc.name}</span>
                    {uploadedFiles[doc.type] ? (
                      <Badge className="bg-green-500">
                        <Check className="h-4 w-4 mr-1" />
                        アップロード済み
                      </Badge>
                    ) : (
                      <Badge variant="outline">未アップロード</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !formData.preferred_start_date
      case 2:
        return !formData.purpose
      case 3:
        return !formData.payment_method
      case 4:
        return !REQUIRED_DOCUMENTS.every(doc => uploadedFiles[doc.type])
      default:
        return false
    }
  }

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto">
      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 h-0.5 w-full bg-muted -translate-y-1/2" />
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
        <div className="relative z-10 flex justify-between">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                index <= currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-background"
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
        <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
      </div>

      {/* Step Content */}
      <div className="min-h-[200px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          戻る
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled()}
        >
          {currentStep === steps.length - 1 ? "申し込みを完了" : "次へ"}
        </Button>
      </div>
    </div>
  )
}