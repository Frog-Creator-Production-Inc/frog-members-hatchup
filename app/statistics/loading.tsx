export default function StatisticsLoading() {
  return (
    <div className="space-y-8">
      <div className="h-[400px] bg-white rounded-lg shadow-sm p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4 mb-4" />
        <div className="h-[300px] bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

