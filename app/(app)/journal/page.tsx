"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { NotebookPen, Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JournalCard } from "@/components/journal/journal-card"
import { SearchBar } from "@/components/journal/search-bar"
import { FilterBar } from "@/components/journal/filter-bar"

type Entry = {
  id: string
  title: string
  entry_date: string
  mood: string | null
  tags: string[] | null
  word_count: number
}

export default function JournalListPage() {
  const [q, setQ] = useState("")
  const [mood, setMood] = useState<string | null>(null)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [tag, setTag] = useState("")

  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [hasError, setHasError] = useState(false)

  const filtersActive = Boolean(q || mood || from || to || tag)

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setHasError(false)
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (mood) params.set("mood", mood)
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      if (tag) params.set("tag", tag)
      const qs = params.toString()
      const url = `/api/entries/search${qs ? `?${qs}` : ""}`

      try {
        const res = await fetch(url, { signal: controller.signal })
        const json = await res.json().catch(() => null)
        if (controller.signal.aborted) return
        if (!res.ok || !json?.success) {
          setHasError(true)
          setEntries([])
        } else {
          setEntries(json.data ?? [])
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return
        setHasError(true)
        setEntries([])
      }
    }

    run()
    return () => controller.abort()
  }, [q, mood, from, to, tag])

  const clearFilters = useCallback(() => {
    setQ("")
    setMood(null)
    setFrom("")
    setTo("")
    setTag("")
  }, [])

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Journal archive</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
            My journal
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Search old entries, trace your moods, and revisit how your writing
            has changed over time.
          </p>
        </div>
        <Button asChild>
          <Link href="/journal/new">
            <NotebookPen className="h-4 w-4" />
            New entry
          </Link>
        </Button>
      </div>

      <div className="mb-5 space-y-3">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search your entries…"
          ariaLabel="Search journal entries"
        />
        <FilterBar
          mood={mood}
          from={from}
          to={to}
          tag={tag}
          onMoodChange={setMood}
          onFromChange={setFrom}
          onToChange={setTo}
          onTagChange={setTag}
        />
      </div>

      {hasError ? (
        <div
          role="alert"
          className="rounded-[22px] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700"
        >
          Could not load entries. Please refresh the page.
        </div>
      ) : entries === null ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading entries">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="compact-card h-20 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 && !filtersActive ? (
        <div className="compact-card py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-secondary text-secondary-foreground">
            <NotebookPen className="h-6 w-6" />
          </div>
          <p className="mb-1 font-display text-[2rem] font-semibold tracking-[-0.05em] text-foreground">
            You haven&apos;t written anything yet.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Write your first journal entry and start your journey!
          </p>
          <Button asChild>
            <Link href="/journal/new">Write First Entry</Link>
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="compact-card py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#fff2e2] text-[#9a5c24]">
            <Search className="h-6 w-6" />
          </div>
          <p className="mb-1 font-display text-[2rem] font-semibold tracking-[-0.05em] text-foreground">
            No entries match your search.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Try different keywords or clear the filters.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            <SlidersHorizontal className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
          <div className="space-y-2">
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
    </>
  )
}
