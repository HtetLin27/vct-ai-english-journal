import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { JournalCard } from "@/components/journal/journal-card"

type EntryRow = {
  id: string
  title: string
  entry_date: string
  mood: string | null
  tags: string[] | null
  word_count: number
}

export default async function JournalListPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user.id

  let entries: EntryRow[] = []
  let loadError = false

  if (userId) {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, title, entry_date, mood, tags, word_count")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })

    if (error) {
      console.error("[journal.list] query failed", {
        userId,
        error: error.message,
      })
      loadError = true
    } else if (data) {
      entries = data
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">My Journal</h1>
        <Button
          asChild
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Link href="/journal/new">✏ New Entry</Link>
        </Button>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          Could not load entries. Please refresh the page.
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            📓
          </div>
          <p className="mb-1 text-lg font-semibold text-gray-900">
            You haven&apos;t written anything yet.
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Write your first journal entry and start your journey!
          </p>
          <Button
            asChild
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Link href="/journal/new">Write First Entry</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
          <div className="space-y-3">
            {entries.map((e) => (
              <JournalCard
                key={e.id}
                id={e.id}
                title={e.title}
                entry_date={e.entry_date}
                mood={e.mood}
                tags={e.tags ?? []}
                word_count={e.word_count}
              />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
