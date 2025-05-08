# Stripe API統合

このドキュメントでは、アプリケーションのStripe API統合について説明します。

## エンドポイント

### サブスクリプション作成
- エンドポイント: `/api/stripe/create-subscription`
- メソッド: POST
- ボディ: `{ userId: string }`
- 説明: ユーザーのStripeチェックアウトセッションを作成します

### サブスクリプションキャンセル
- エンドポイント: `/api/stripe/cancel-subscription`
- メソッド: POST
- ボディ: `{ userId: string }`
- 説明: ユーザーのStripeサブスクリプションをキャンセルします

### カスタマーポータルセッション作成
- エンドポイント: `/api/stripe/create-customer-portal-session`
- メソッド: POST
- ボディ: `{ customerId: string }`
- 説明: ユーザーのStripeカスタマーポータルセッションを作成します

## Webhook
- エンドポイント: `/api/stripe/webhook`
- メソッド: POST
- 説明: Stripeからのwebhookイベントを処理します 