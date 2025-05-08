/**
 * Content Snare APIとの連携用ユーティリティ関数
 */

// クライアントプロファイル作成
export async function createContentSnareClient(
  firstName: string,
  lastName: string,
  email: string
): Promise<{ client_id: string; success?: boolean; already_exists?: boolean }> {
  const response = await fetch("/api/content-snare/create-client", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `クライアント作成に失敗しました: ${
        errorData.error || response.statusText
      }`
    );
  }

  return response.json();
}

// 申請書提出作成
export async function createSubmission(
  clientId: string,
  courseId: string
): Promise<{ id: string; url: string }> {
  const response = await fetch("/api/content-snare/create-submission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      courseId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `提出作成に失敗しました: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}

// 申請ステータス確認
export async function checkSubmissionStatus(submissionId: string): Promise<{
  status: string;
  contentSnareStatus: string;
  details: any;
}> {
  const response = await fetch(
    `/api/content-snare/check-status?submission_id=${submissionId}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `ステータス確認に失敗しました: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}

// アプリケーションタイプ
export interface CourseApplication {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  submission_id?: string;
  submission_url?: string;
  created_at: string;
  updated_at: string;
}

// コースタイプ
export interface Course {
  id: string;
  name: string;
  description?: string;
  content_snare_template_id?: string;
}

// 提出ステータスを表示用にフォーマット
export function formatApplicationStatus(status: string): {
  label: string;
  color: string;
} {
  switch (status) {
    case "draft":
      return { label: "下書き", color: "gray" };
    case "pending":
      return { label: "処理中", color: "blue" };
    case "submitted":
      return { label: "提出済み", color: "green" };
    case "reviewing":
      return { label: "審査中", color: "yellow" };
    case "approved":
      return { label: "承認済み", color: "green" };
    case "rejected":
      return { label: "却下", color: "red" };
    default:
      return { label: "不明", color: "gray" };
  }
} 