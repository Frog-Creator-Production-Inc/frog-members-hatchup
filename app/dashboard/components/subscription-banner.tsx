"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { CreditCard, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface SubscriptionBannerProps {
  isSubscribed: boolean;
  status?: string;
  periodEnd?: string;
}

export function SubscriptionBanner({ 
  isSubscribed, 
  status, 
  periodEnd 
}: SubscriptionBannerProps) {
  if (!isSubscribed) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
            サブスクリプションが必要です
          </CardTitle>
          <CardDescription>
            すべての機能を利用するには、サブスクリプションにご登録ください。
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/pricing">
              プランを見る
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const isCanceling = status === "canceling";
  const formattedDate = periodEnd ? formatDate(new Date(periodEnd)) : null;

  if (isCanceling) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-700">
            <AlertTriangle className="mr-2 h-5 w-5" />
            サブスクリプションはキャンセル予定です
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            サブスクリプションは<strong>{formattedDate}</strong>にキャンセルされます。
            それまではすべての機能をご利用いただけます。
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/settings">
              <CreditCard className="mr-2 h-4 w-4" />
              サブスクリプションを管理
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
} 