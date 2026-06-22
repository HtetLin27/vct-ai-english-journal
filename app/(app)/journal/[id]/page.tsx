import Link from "next/link"
import { ChevronLeft, PencilLine, RefreshCw } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { DeleteEntryButton } from "@/components/journal/delete-entry-button"
import { AiFeedbackPanel } from "@/components/ai/ai-feedback-panel"
import { MOOD_META, type MoodValue } from "@/lib/moods"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function formatLongDate(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`
}

interface PageProps {
  params: { id: string }
}

export default async function ViewEntryPage({ params }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user.id

  let entry: {
    id: string
    title: string
    body: string
    entry_date: string
    mood: string | null
    tags: string[] | null
    word_count: number
  } | null = null
  let loadError = false

  if (userId) {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, title, body, entry_date, mood, tags, word_count")
      .eq("id", params.id)
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("[journal.view] query failed", {
        userId,
        entryId: params.id,
        error: error.message,
      })
      loadError = true
    } else {
      entry = data
    }
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="rounded-[22px] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700"
      >
        <p>Could not load this entry.</p>
        <a
          href={`/journal/${params.id}`}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-800 hover:underline"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </a>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="rounded-[28px] border border-white/80 bg-white/78 py-16 text-center shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
        <p className="mb-4 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
          Entry not found.
        </p>
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to My Journal
        </Link>
      </div>
    )
  }

  const moodMeta = entry.mood ? MOOD_META[entry.mood as MoodValue] ?? null : null
  const tags = entry.tags ?? []

  return (
    <>
      <div className="mb-2">
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          My Journal
        </Link>
      </div>

      <p className="page-eyebrow">Entry detail</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
        {entry.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted-foreground">
        <span>{formatLongDate(entry.entry_date)}</span>
        {moodMeta && (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
              <moodMeta.Icon className={`h-4 w-4 ${moodMeta.tone}`} aria-hidden />
              <span>{moodMeta.label}</span>
            </span>
          </>
        )}
        <span aria-hidden>·</span>
        <span>
          {entry.word_count} {entry.word_count === 1 ? "word" : "words"}
        </span>
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#f8efe5] px-2.5 py-1 text-xs text-[#9a5c24]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <hr className="soft-divider my-6" />

      <div className="rounded-[28px] border border-white/80 bg-white/76 p-6 text-base leading-8 text-foreground shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)] whitespace-pre-wrap">
        {entry.body}
      </div>

      <hr className="soft-divider my-6" />

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/journal/${entry.id}/edit`}>
            <PencilLine className="h-4 w-4" />
            Edit
          </Link>
        </Button>
        <DeleteEntryButton entryId={entry.id} />
      </div>

      <AiFeedbackPanel entryId={entry.id} />
    </>
  )
}
