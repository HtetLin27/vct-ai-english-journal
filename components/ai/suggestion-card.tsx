"use client"

import { useState } from "react"
import { Check, Plus } from "lucide-react"
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-700">
        <span className="text-red-500 line-through">{original}</span>
        <span aria-hidden className="mx-2 text-gray-400">
          →
        </span>
        <span className="font-medium text-green-700">{suggestion}</span>
      </p>
      <p className="mt-2 text-sm text-gray-600">{definition}</p>
      <p className="mt-1 text-sm text-gray-600">
        <span aria-hidden>💬 </span>
        {reason}
      </p>
      {reasonMy && (
        <p
          lang="my"
          className="mt-1 text-sm leading-relaxed text-gray-500"
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
              className="bg-green-100 text-green-800 hover:bg-green-100 disabled:opacity-100"
            >
              <Check className="h-4 w-4" aria-hidden />
              Saved
            </Button>
          ) : saveState === "saving" ? (
            <Button variant="outline" size="sm" disabled>
              Saving…
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleClick}>
              <Plus className="h-4 w-4" aria-hidden />
              Save &ldquo;{suggestion}&rdquo;
            </Button>
          )}
          {saveState === "error" && (
            <p className="text-xs text-red-600">
              Couldn&apos;t save. Tap to try again.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
