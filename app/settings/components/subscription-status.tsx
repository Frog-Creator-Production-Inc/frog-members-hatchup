"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface SubscriptionStatusProps {
  isSubscribed: boolean;
  status?: string;
  periodEnd?: string;
}

export function SubscriptionStatus({ 
  isSubscribed, 
  status, 
  periodEnd 
}: SubscriptionStatusProps) {
  if (!isSubscribed) {
    return null;
  }

  const isCanceling = status === "canceling";
  const formattedDate = periodEnd ? formatDate(new Date(periodEnd)) : null;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          サブスクリプション状態
          <Badge variant={isCanceling ? "outline" : "default"}>
            {isCanceling ? "キャンセル予定" : "アクティブ"}
          </Badge>
        </CardTitle>
        <CardDescription>
          現在のサブスクリプション状態と詳細
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCanceling && periodEnd ? (
          <p className="text-sm text-muted-foreground">
            サブスクリプションは<strong>{formattedDate}</strong>にキャンセルされます。
            それまではすべての機能をご利用いただけます。
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            サブスクリプションはアクティブです。
            {formattedDate && ` 次回の更新日は${formattedDate}です。`}
          </p>
        )}
      </CardContent>
    </Card>
  );
} 