"use client"

import { Check } from "lucide-react"
import { MOODS, type MoodValue } from "@/lib/moods"

interface Props {
  value: MoodValue | null
  onChange: (mood: MoodValue | null) => void
}

export function MoodSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((m) => {
        const selected = value === m.value
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(selected ? null : m.value)}
            aria-pressed={selected}
            className={
              selected
                ? "inline-flex items-center gap-2 rounded-full border border-[#17324d]/15 bg-[#17324d] px-4 py-2.5 text-sm font-medium text-white shadow-[0_18px_36px_-24px_rgba(23,50,77,0.8)]"
                : "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2.5 text-sm text-muted-foreground shadow-[0_12px_30px_-26px_rgba(23,50,77,0.4)] transition-all hover:-translate-y-0.5 hover:text-foreground"
            }
          >
            {selected && (
              <Check className="h-4 w-4" aria-hidden />
            )}
            <m.Icon className="h-4 w-4" aria-hidden />
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
