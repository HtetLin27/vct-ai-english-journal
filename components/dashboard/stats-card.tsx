import type { ReactNode } from "react"

interface Props {
  icon: ReactNode
  value: string | number
  label: string
}

export function StatsCard({ icon, value, label }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
      <div className="text-2xl" aria-hidden>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  )
}
