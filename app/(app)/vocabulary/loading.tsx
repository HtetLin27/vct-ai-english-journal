export default function VocabularyLoading() {
  return (
    <div aria-busy="true" aria-label="Loading vocabulary book">
      <div className="h-9 w-64 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-100" />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-1 h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            <hr className="my-3 border-gray-200" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
