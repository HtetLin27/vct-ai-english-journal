export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="text-2xl text-green-600" aria-hidden>
          🌿
        </span>
        <span className="text-xl font-semibold text-gray-900">
          AI English Journal
        </span>
      </div>
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  )
}
