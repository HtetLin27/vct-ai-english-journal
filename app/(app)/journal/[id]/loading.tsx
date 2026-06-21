export default function ViewEntryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading entry">
      <div className="mb-2 h-4 w-28 animate-pulse rounded bg-gray-100" />

      <div className="h-9 w-3/4 animate-pulse rounded bg-gray-100" />

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
      </div>

      <hr className="my-6 border-gray-200" />

      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-10/12 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-9/12 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-8/12 animate-pulse rounded bg-gray-100" />
      </div>

      <hr className="my-6 border-gray-200" />

      <div className="flex flex-wrap gap-3">
        <div className="h-9 w-20 animate-pulse rounded-md bg-gray-100" />
        <div className="h-9 w-24 animate-pulse rounded-md bg-gray-100" />
      </div>
    </div>
  )
}
