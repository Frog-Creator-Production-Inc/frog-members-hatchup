import Stripe from "stripe";

// Stripeクライアントのシングルトンインスタンス
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

// Stripe関連の共通型定義
export interface StripeCustomer {
  id: string;
  email: string;
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_end: number;
}

// Stripe関連の共通ユーティリティ関数
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  // 実装...
  return "";
} 