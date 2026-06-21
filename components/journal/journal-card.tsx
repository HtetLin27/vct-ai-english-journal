import Link from "next/link"

const MOOD_META: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "happy" },
  sad: { emoji: "😢", label: "sad" },
  neutral: { emoji: "😐", label: "neutral" },
  excited: { emoji: "🤩", label: "excited" },
  tired: { emoji: "😴", label: "tired" },
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function formatEntryDate(iso: string) {
  const [, m, d] = iso.split("-")
  return `${MONTH_ABBR[Number(m) - 1]} ${Number(d)}`
}

interface Props {
  id: string
  title: string
  entry_date: string
  mood: string | null
  tags: string[]
  word_count: number
  variant?: "full" | "compact"
}

export function JournalCard({
  id,
  title,
  entry_date,
  mood,
  tags,
  word_count,
  variant = "full",
}: Props) {
  const moodMeta = mood ? MOOD_META[mood] ?? null : null

  return (
    <Link
      href={`/journal/${id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:border-green-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <span className="shrink-0 text-sm text-gray-500">
          {formatEntryDate(entry_date)}
        </span>
      </div>

      {variant === "full" && (
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {moodMeta && (
              <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                <span aria-hidden>{moodMeta.emoji}</span>
                <span>{moodMeta.label}</span>
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs text-gray-500">
              {word_count} {word_count === 1 ? "word" : "words"}
            </span>
          </div>
          <span aria-hidden className="shrink-0 text-gray-400">
            →
          </span>
        </div>
      )}

      {variant === "compact" && moodMeta && (
        <div className="mt-2 inline-flex items-center gap-1 text-sm text-gray-600">
          <span aria-hidden>{moodMeta.emoji}</span>
          <span>{moodMeta.label}</span>
        </div>
      )}
    </Link>
  )
}
