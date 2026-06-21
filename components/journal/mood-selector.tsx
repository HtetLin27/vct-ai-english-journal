"use client"

const MOODS = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "excited", emoji: "🤩", label: "Excited" },
  { value: "tired", emoji: "😴", label: "Tired" },
] as const

export type MoodValue = (typeof MOODS)[number]["value"]

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
                ? "inline-flex items-center gap-1.5 rounded-full border-2 border-green-600 bg-green-100 px-4 py-2 text-sm font-medium text-green-800"
                : "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:border-gray-400"
            }
          >
            {selected && (
              <span aria-hidden className="text-green-700">
                ✓
              </span>
            )}
            <span aria-hidden>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
