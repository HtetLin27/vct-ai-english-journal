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

  if (deleted) return null

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
    <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{word}</h3>
      <p className="mt-1 text-sm text-gray-600">{definition}</p>
      {definitionMy && (
        <p
          lang="my"
          className="mt-0.5 text-sm leading-relaxed text-gray-500"
        >
          {definitionMy}
        </p>
      )}
      <hr className="my-3 border-gray-200" />
      <p className="pr-8 text-sm italic text-gray-500">
        &ldquo;{example_sentence}&rdquo;
      </p>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${word}`}
        className="absolute bottom-3 right-3 text-red-400 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
