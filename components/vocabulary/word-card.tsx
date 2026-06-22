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
    <div className="relative rounded-[24px] border border-white/80 bg-white/78 p-5 shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
      <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
        {word}
      </h3>
      <p className="mt-2 text-sm leading-6 text-foreground">{definition}</p>
      {definitionMy && (
        <p
          lang="my"
          className="mt-1 text-sm leading-relaxed text-muted-foreground"
        >
          {definitionMy}
        </p>
      )}
      <hr className="soft-divider my-4" />
      <p className="pr-8 text-sm italic leading-6 text-muted-foreground">
        &ldquo;{example_sentence}&rdquo;
      </p>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${word}`}
        className="absolute bottom-4 right-4 rounded-full border border-red-100 bg-red-50/80 p-2 text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
