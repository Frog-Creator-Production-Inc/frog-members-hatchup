import { redirect } from "next/navigation"

export const metadata = {
  title: "コース申請履歴",
  description: "あなたのコース申請状況を確認できます",
}

export default async function ApplicationsPage() {
  // Content Snare連携のコース申請ページにリダイレクト
  redirect("/course-application")
} 