import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { MOOD_META, type MoodValue } from "@/lib/moods"

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
  const moodMeta = mood ? MOOD_META[mood as MoodValue] ?? null : null

  return (
    <Link
      href={`/journal/${id}`}
      className="block rounded-[24px] border border-white/80 bg-white/80 p-5 shadow-[0_18px_48px_-34px_rgba(23,50,77,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-34px_rgba(23,50,77,0.52)]"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="line-clamp-1 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h3>
        <span className="shrink-0 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {formatEntryDate(entry_date)}
        </span>
      </div>

      {variant === "full" && (
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {moodMeta && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-sm text-secondary-foreground">
                <moodMeta.Icon className={`h-4 w-4 ${moodMeta.tone}`} aria-hidden />
                <span>{moodMeta.label}</span>
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f8efe5] px-2.5 py-1 text-xs text-[#9a5c24]"
              >
                {tag}
              </span>
            ))}
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {word_count} {word_count === 1 ? "word" : "words"}
            </span>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
      )}

      {variant === "compact" && moodMeta && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-sm text-secondary-foreground">
          <moodMeta.Icon className={`h-4 w-4 ${moodMeta.tone}`} aria-hidden />
          <span>{moodMeta.label}</span>
        </div>
      )}
    </Link>
  )
}
