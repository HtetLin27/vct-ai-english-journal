"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AiFeedbackPanel,
  type Correction,
  type Suggestion,
} from "@/components/ai/ai-feedback-panel"
import { type ApplyResult } from "@/components/ai/correction-card"
import { type SaveResult } from "@/components/ai/suggestion-card"

interface Props {
  entryId: string
  entryBody: string
}

// Feedback for a saved entry: corrections are persisted to the entry via PUT,
// and vocabulary is saved with the entry as its source.
export function EntryFeedback({ entryId, entryBody }: Props) {
  const router = useRouter()
  // Local copy of the body so applying several corrections in a row operates on
  // the already-updated text. The server-rendered body is kept in sync via
  // router.refresh() after each successful apply.
  const [body, setBody] = useState(entryBody)

  async function handleApplyCorrection(
    correction: Correction
  ): Promise<ApplyResult> {
    if (!body.includes(correction.original)) return "not_found"
    const newBody = body.replace(correction.original, correction.corrected)
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newBody }),
      })
      if (!res.ok) return "error"
      setBody(newBody)
      router.refresh()
      return "applied"
    } catch {
      return "error"
    }
  }

  async function handleSaveWord(suggestion: Suggestion): Promise<SaveResult> {
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: suggestion.suggestion,
          definition: suggestion.definition,
          ...(suggestion.definition_my
            ? { definition_my: suggestion.definition_my }
            : {}),
          example_sentence: suggestion.example_sentence,
          source_entry_id: entryId,
        }),
      })

      if (res.ok) return "saved"

      // Treat the unique-constraint duplicate as success: the user's intent
      // (word in vocabulary book) is already satisfied.
      if (res.status === 400) {
        const json = await res.json().catch(() => null)
        if (json?.error === "This word is already in your vocabulary book") {
          return "saved"
        }
      }
      return "error"
    } catch {
      return "error"
    }
  }

  return (
    <AiFeedbackPanel
      requestPayload={() => ({ entry_id: entryId })}
      onApplyCorrection={handleApplyCorrection}
      onSaveWord={handleSaveWord}
    />
  )
}
