"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export type SaveResult = "saved" | "error"

interface Props {
  type: "vocabulary" | "expression"
  original: string
  suggestion: string
  reason: string
  reasonMy?: string
  definition: string
  example_sentence: string
  onSave?: () => Promise<SaveResult>
}

type SaveState = "idle" | "saving" | "saved" | "error"

export function SuggestionCard({
  type,
  original,
  suggestion,
  reason,
  reasonMy,
  definition,
  onSave,
}: Props) {
  const [saveState, setSaveState] = useState<SaveState>("idle")

  async function handleClick() {
    if (!onSave || saveState === "saving" || saveState === "saved") return
    setSaveState("saving")
    const result = await onSave()
    setSaveState(result === "saved" ? "saved" : "error")
  }

  return (
    <article className="rounded-lg border border-suggestion-border bg-suggestion-bg p-4">
      <header className="mb-3 flex items-center gap-2">
        <span aria-hidden className="text-mint">
          💡
        </span>
        <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-mint">
          Suggestion
        </span>
      </header>

      <p className="text-sm leading-relaxed">
        <span className="text-text-tertiary line-through decoration-text-tertiary/60">
          {original}
        </span>
        <span aria-hidden className="mx-2 text-coral">
          →
        </span>
        <span className="font-medium text-mint">{suggestion}</span>
      </p>

      <p className="mt-2 text-sm leading-relaxed text-text-body">{definition}</p>
      <p className="mt-2 text-sm leading-relaxed text-text-body">{reason}</p>
      {reasonMy && (
        <p
          lang="my"
          className="mt-1 text-sm leading-relaxed text-myanmar-text"
        >
          {reasonMy}
        </p>
      )}

      {type === "vocabulary" && (
        <div className="mt-3 flex flex-col items-end gap-1">
          {saveState === "saved" ? (
            <Button
              size="sm"
              disabled
              className="border border-suggestion-border bg-mood-bg text-mint hover:bg-mood-bg disabled:opacity-100"
            >
              ✓ Saved
            </Button>
          ) : saveState === "saving" ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-border bg-surface text-text-secondary"
            >
              Saving…
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClick}
              className="border-border bg-surface text-text-primary hover:bg-surface-elevated hover:text-mint"
            >
              + Save &ldquo;{suggestion}&rdquo;
            </Button>
          )}
          {saveState === "error" && (
            <p className="text-xs text-coral-light">
              Couldn&apos;t save. Tap to try again.
            </p>
          )}
        </div>
      )}
    </article>
  )
}
