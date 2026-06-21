export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-8">
        <div className="h-9 w-56 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-gray-100" />
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
          >
            <div className="mx-auto h-7 w-7 animate-pulse rounded bg-gray-100" />
            <div className="mx-auto mt-2 h-9 w-20 animate-pulse rounded bg-gray-100" />
            <div className="mx-auto mt-2 h-4 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </section>

      <div className="mt-8">
        <div className="h-9 w-full animate-pulse rounded-md bg-gray-100 md:w-56" />
      </div>

      <section className="mt-10">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
