import type { ReactNode } from "react"

interface Props {
  icon: ReactNode
  value: string | number
  label: string
}

export function StatsCard({ icon, value, label }: Props) {
  return (
    <div className="compact-card p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#eef3ef] text-secondary-foreground ring-1 ring-inset ring-white/80"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 font-display text-[1.9rem] font-semibold tracking-[-0.05em] text-foreground">
            {value}
          </div>
        </div>
      </div>
    </div>
  )
}
