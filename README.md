# Frog Members

学生と教育機関をつなぐポータルサイト。コース検索、申し込み、ビザ申請サポート、AIチャット機能を提供します。

## 機能

- 学校・コース検索と申し込み
- ビザプランニングと申請サポート
- AIチャットアシスタント
- 学習リソース管理
- 管理者ダッシュボード

## 開発環境のセットアップ

### 前提条件

- Node.js 18.x以上
- npm 9.x以上
- ローカル開発用SSL証明書

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/Frog-Creator-Production-Inc/frog-members-hatchup.git
cd frog-members-hatchup

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local
# .env.localファイルを編集して必要な環境変数を設定、セットアップガイドを参照

# 開発サーバーの起動
npm run dev
```

## デプロイ
このプロジェクトはVercelへのデプロイを想定しています。

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS & shadcn/ui
- Supabase (認証・データベース)
- OpenAI API (AIチャット)
- MicroCMS (コンテンツ管理)
- Stripe (決済処理)

## ライセンス
このプロジェクトはプライベートであり、無断での使用・配布は禁止されています。

## チーム紹介

- Senna: カナダ歴17年、Frog代表。元ブロガー。
- Kazutora Hattori: よろしくお願いいたします！
- Ryo(Ito): 学生@Langara 旅行が趣味です。
- Kanta Nagai: Langara Term2　よろしくお願いします！
- Ryo Suzuki: CCTBに通っています。よろしくお願いします！
- Teru: よろしくお願いします! Nice meeting y'all!
- Natsuko Ogata: Langara WMDDを先日卒業しました！日本一時帰国から戻ってきたので、就職活動を本格的に始めていきたいと思います！
- Nana Okamoto: 業界経験3年のエンジニア。カナダでの就職を目指しています。
- Nagomi:よろしくお願いします；）
- Yui: CICCCの学生。三度の飯より飯が好き。
- Wataru: CCTBに通っております！出身は千葉です！
