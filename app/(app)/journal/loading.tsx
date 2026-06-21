export default function JournalListLoading() {
  return (
    <div aria-busy="true" aria-label="Loading journal entries">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="h-9 w-40 animate-pulse rounded bg-gray-100" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-gray-100" />
      </div>

      <div className="mb-6 space-y-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 w-[150px] animate-pulse rounded-md bg-gray-100"
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </div>
  )
}
