"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

interface Props {
  id: string
  word: string
  definition: string
  definitionMy?: string
  example_sentence: string
}

export function WordCard({
  id,
  word,
  definition,
  definitionMy,
  example_sentence,
}: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (deleted) {
    return (
      <span className="sr-only" role="status" aria-live="polite">
        Deleted &ldquo;{word}&rdquo; from your vocabulary book.
      </span>
    )
  }

  async function handleDelete() {
    if (deleting) return
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch(`/api/vocabulary/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setError(json?.error || "Could not delete this word. Please try again.")
        setDeleting(false)
        return
      }
      setDeleted(true)
      router.refresh()
    } catch {
      setError("Could not delete this word. Please try again.")
      setDeleting(false)
    }
  }

  return (
    <div className="compact-card flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
            Saved word
          </p>
          <h3 className="mt-2 font-display text-[1.85rem] font-semibold tracking-[-0.05em] text-foreground">
            {word}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${word}`}
          className="rounded-full border border-red-100 bg-red-50/85 p-1.5 text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        <p className="text-sm leading-6 text-foreground">{definition}</p>
        {definitionMy && (
          <p
            lang="my"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {definitionMy}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-[16px] bg-[#f7f4ef] px-3 py-3">
        <p className="line-clamp-3 text-sm italic leading-6 text-[#6f7681]">
          &ldquo;{example_sentence}&rdquo;
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
