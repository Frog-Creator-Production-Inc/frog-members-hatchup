"use client"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, AlertCircle, Clock, Info } from "lucide-react"

// ステータスバッジ用のバリアント定義
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        success: "bg-green-100 text-green-800 border border-green-200",
        error: "bg-red-100 text-red-800 border border-red-200",
        warning: "bg-amber-100 text-amber-800 border border-amber-200",
        info: "bg-blue-100 text-blue-800 border border-blue-200",
        pending: "bg-purple-100 text-purple-800 border border-purple-200",
        default: "bg-gray-100 text-gray-800 border border-gray-200",
      },
      size: {
        sm: "text-xs py-0.5 px-2",
        md: "text-xs py-1 px-2.5",
        lg: "text-sm py-1 px-3",
      },
    },
    defaultVariants: {
      status: "default",
      size: "md",
    },
  }
)

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof statusBadgeVariants> {
  showIcon?: boolean
  label?: string
}

export function StatusBadge({
  className,
  status,
  size,
  showIcon = true,
  label,
  children,
  ...props
}: StatusBadgeProps) {
  // ステータスに応じたアイコンを表示
  const getStatusIcon = () => {
    if (!showIcon) return null

    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3" />
      case "error":
        return <XCircle className="h-3 w-3" />
      case "warning":
        return <AlertCircle className="h-3 w-3" />
      case "info":
        return <Info className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      default:
        return null
    }
  }

  // ステータスに応じたラベルテキスト (label が渡されない場合)
  const getStatusLabel = () => {
    if (label) return label
    if (children) return children
    
    switch (status) {
      case "success":
        return "完了"
      case "error":
        return "エラー"
      case "warning":
        return "警告"
      case "info":
        return "情報"
      case "pending":
        return "処理中"
      default:
        return "ステータス"
    }
  }

  return (
    <div
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {getStatusIcon()}
      {getStatusLabel()}
    </div>
  )
} 