export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-[#4FD1C5] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  )
}

