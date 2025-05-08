"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface CancelSubscriptionButtonProps {
  userId: string
}

export function CancelSubscriptionButton({ userId }: CancelSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleCancelSubscription = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error response:", data)
        throw new Error(data.error || data.details || "サブスクリプションのキャンセルに失敗しました")
      }

      toast.success("メンバーシップを解約しました")
      setOpen(false)
      router.push("/learning/cancel-success")
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast.error(error instanceof Error ? error.message : "サブスクリプションのキャンセルに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
          メンバーシップを解約
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white border border-gray-200 shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 text-xl">メンバーシップを解約しますか？</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            解約すると、即座に学習コンテンツにアクセスできなくなります。
            再度アクセスするには、メンバーシップに再登録する必要があります。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300">
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelSubscription}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {loading ? "処理中..." : "解約する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 