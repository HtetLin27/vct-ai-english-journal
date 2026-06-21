import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { DeleteEntryButton } from "@/components/journal/delete-entry-button"
import { EntryReadingView } from "@/components/journal/entry-reading-view"

const MOOD_META: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "happy" },
  sad: { emoji: "😢", label: "sad" },
  neutral: { emoji: "😐", label: "neutral" },
  excited: { emoji: "🤩", label: "excited" },
  tired: { emoji: "😴", label: "tired" },
}

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
        className="rounded-md border border-coral bg-mistake-bg px-4 py-3 text-sm text-coral-light"
      >
        <p>Could not load this entry.</p>
        <a
          href={`/journal/${params.id}`}
          className="mt-2 inline-block text-sm font-medium text-coral hover:underline"
        >
          ↻ Try again
        </a>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 font-display text-lg font-semibold text-text-primary">
          Entry not found.
        </p>
        <Link
          href="/journal"
          className="text-sm font-medium text-mint hover:underline"
        >
          ← Back to My Journal
        </Link>
      </div>
    )
  }

  const moodMeta = entry.mood ? MOOD_META[entry.mood] ?? null : null
  const tags = entry.tags ?? []

  return (
    <article>
      <div className="mb-2">
        <Link
          href="/journal"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          ← My Journal
        </Link>
      </div>

      <h1 className="font-display text-3xl font-semibold text-text-primary">
        {entry.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
        <span>{formatLongDate(entry.entry_date)}</span>
        {moodMeta && (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-mood-bg px-2 py-0.5 text-xs text-mint">
              <span aria-hidden>{moodMeta.emoji}</span>
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
              className="rounded-full bg-mood-bg px-2 py-0.5 text-xs text-mint"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <hr className="my-6 border-border" />

      <EntryReadingView entryId={entry.id} body={entry.body} />

      <hr className="my-6 border-border" />

      <div className="flex flex-wrap gap-3">
        <Button
          asChild
          variant="outline"
          className="border-border bg-surface text-text-primary hover:bg-surface-elevated hover:text-mint"
        >
          <Link href={`/journal/${entry.id}/edit`}>✏ Edit</Link>
        </Button>
        <DeleteEntryButton entryId={entry.id} />
      </div>
    </article>
  )
}
