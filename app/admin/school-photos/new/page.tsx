import { SchoolPhotoUpload } from "../components/school-photo-upload"

export default async function NewSchoolPhotoPage() {
  // middlewareで認証済みなのでチェック不要
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">学校写真のアップロード</h1>
      <SchoolPhotoUpload />
    </div>
  )
}

