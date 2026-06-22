import type { ReactNode } from "react"

interface Props {
  icon: ReactNode
  value: string | number
  label: string
}

export function StatsCard({ icon, value, label }: Props) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_48px_-34px_rgba(23,50,77,0.55)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">
            {value}
          </div>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
