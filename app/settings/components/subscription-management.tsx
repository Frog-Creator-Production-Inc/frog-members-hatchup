"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Loader2 } from "lucide-react";

interface SubscriptionManagementProps {
  isSubscribed: boolean;
  hasStripeCustomer: boolean;
}

export function SubscriptionManagement({ 
  isSubscribed, 
  hasStripeCustomer 
}: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === "Stripe customer portal not configured") {
          toast({
            title: "Stripeの設定が必要です",
            description: "Stripeダッシュボードでカスタマーポータルの設定を行ってください。",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(data.message || data.error || "Something went wrong");
      }
      
      // Stripeカスタマーポータルにリダイレクト
      window.location.href = data.url;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "エラーが発生しました",
        description: "サブスクリプション管理ページを開けませんでした。後でもう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSubscribed || !hasStripeCustomer) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">サブスクリプション管理</h3>
      <p className="text-sm text-muted-foreground">
        支払い方法の更新、プランの変更、またはサブスクリプションのキャンセルを行うには、Stripeの顧客ポータルをご利用ください。
      </p>
      <Button
        onClick={handleManageSubscription}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            読み込み中...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Stripeで購読を管理
          </>
        )}
      </Button>
    </div>
  );
} 