"use client"

import { useEffect, useState } from "react"
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
      <h1 className="text-3xl font-bold text-gray-900">My Vocabulary Book</h1>
      <p className="mt-1 text-sm text-gray-500">
        {words === null
          ? "Loading…"
          : `${words.length} ${words.length === 1 ? "word" : "words"} saved`}
      </p>

      <div className="mt-6">
        <SearchBar value={q} onChange={setQ} placeholder="Search words…" />
      </div>

      {hasError ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
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
              className="h-36 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : words.length === 0 && !searching ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            📖
          </div>
          <p className="mb-1 text-lg font-semibold text-gray-900">
            Your vocabulary book is empty.
          </p>
          <p className="text-sm text-gray-500">
            When you check your English, you can save new words here to study
            later.
          </p>
        </div>
      ) : words.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            🔍
          </div>
          <p className="mb-1 text-lg font-semibold text-gray-900">
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
