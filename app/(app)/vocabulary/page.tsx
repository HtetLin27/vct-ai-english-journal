"use client"

import { useEffect, useState } from "react"
import { BookMarked, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/journal/search-bar"
import { WordCard } from "@/components/vocabulary/word-card"

type SavedWord = {
  id: string
  word: string
  definition: string
  definition_my: string | null
  example_sentence: string
}

export default function VocabularyPage() {
  const [q, setQ] = useState("")
  const [words, setWords] = useState<SavedWord[] | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setHasError(false)
      const url = q
        ? `/api/vocabulary?q=${encodeURIComponent(q)}`
        : "/api/vocabulary"
      try {
        const res = await fetch(url, { signal: controller.signal })
        const json = await res.json().catch(() => null)
        if (controller.signal.aborted) return
        if (!res.ok || !json?.success) {
          setHasError(true)
          setWords([])
        } else {
          setWords((json.data ?? []) as SavedWord[])
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return
        setHasError(true)
        setWords([])
      }
    }

    run()
    return () => controller.abort()
  }, [q])

  const searching = q.trim().length > 0

  return (
    <>
      <p className="page-eyebrow">Saved language</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
        My vocabulary book
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
        {words === null
          ? "Loading…"
          : `${words.length} ${words.length === 1 ? "word" : "words"} saved`}
      </p>

      <div className="mt-6">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search words…"
          ariaLabel="Search vocabulary words"
        />
      </div>

      {hasError ? (
        <div
          role="alert"
          className="mt-6 rounded-[22px] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700"
        >
          Could not load your vocabulary book. Please refresh the page.
        </div>
      ) : words === null ? (
        <div
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
          aria-busy="true"
          aria-label="Loading vocabulary"
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-[24px] border border-white/80 bg-white/70"
            />
          ))}
        </div>
      ) : words.length === 0 && !searching ? (
        <div className="rounded-[28px] border border-white/80 bg-white/78 py-16 text-center shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary text-secondary-foreground">
            <BookMarked className="h-7 w-7" />
          </div>
          <p className="mb-1 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Your vocabulary book is empty.
          </p>
          <p className="text-sm text-muted-foreground">
            When you check your English, you can save new words here to study
            later.
          </p>
        </div>
      ) : words.length === 0 ? (
        <div className="rounded-[28px] border border-white/80 bg-white/78 py-16 text-center shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#fff2e2] text-[#9a5c24]">
            <Search className="h-7 w-7" />
          </div>
          <p className="mb-1 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            No words match your search.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => setQ("")}>
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {words.map((w) => (
            <WordCard
              key={w.id}
              id={w.id}
              word={w.word}
              definition={w.definition}
              definitionMy={w.definition_my ?? undefined}
              example_sentence={w.example_sentence}
            />
          ))}
        </div>
      )}
    </>
  )
}
