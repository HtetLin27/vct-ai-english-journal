import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { MOOD_META, type MoodValue } from "@/lib/moods"
import { cn } from "@/lib/utils"

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
  const tagsToShow = variant === "full" ? tags.slice(0, 2) : []
  const remainingTagCount = Math.max(tags.length - tagsToShow.length, 0)

  return (
    <Link
      href={`/journal/${id}`}
      className="compact-card group relative block overflow-hidden p-4 transition-transform duration-200 hover:-translate-y-0.5"
    >
      {moodMeta && (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-1.5", moodMeta.accent)}
        />
      )}

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <h3
            className={cn(
              "line-clamp-1 font-display font-semibold tracking-[-0.04em] text-foreground",
              variant === "compact" ? "text-[1.25rem]" : "text-[1.35rem] md:text-[1.45rem]"
            )}
          >
            {title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-[#eef3ef] px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
          {formatEntryDate(entry_date)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 pl-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {moodMeta && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-medium",
                moodMeta.chip
              )}
            >
              <moodMeta.Icon className={`h-3.5 w-3.5 ${moodMeta.tone}`} aria-hidden />
              <span>{moodMeta.label}</span>
            </span>
          )}

          {variant === "full" &&
            tagsToShow.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f8efe5] px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[#9a5c24]"
              >
                {tag}
              </span>
            ))}

          {variant === "full" && remainingTagCount > 0 && (
            <span className="rounded-full bg-[#eef3ef] px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              +{remainingTagCount}
            </span>
          )}

          {variant === "full" && (
            <span className="rounded-full bg-[#eef3ef] px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              {word_count} {word_count === 1 ? "word" : "words"}
            </span>
          )}
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f7f2] text-muted-foreground transition-colors duration-200 group-hover:bg-[#e8a05c]/18 group-hover:text-foreground">
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  )
}
