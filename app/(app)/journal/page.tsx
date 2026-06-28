"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Pencil } from "lucide-react"
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">My Journal</h1>
        <Button asChild className="bg-green-600 text-white hover:bg-green-700">
          <Link href="/journal/new">
            <Pencil className="h-4 w-4" aria-hidden />
            New Entry
          </Link>
        </Button>
      </div>

      <div className="mb-6 space-y-3">
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
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          Could not load entries. Please refresh the page.
        </div>
      ) : entries === null ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading entries">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : entries.length === 0 && !filtersActive ? (
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
      ) : entries.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            🔍
          </div>
          <p className="mb-1 text-lg font-semibold text-gray-900">
            No entries match your search.
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Try different keywords or clear the filters.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
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
    </>
  )
}
