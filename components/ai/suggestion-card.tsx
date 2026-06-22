"use client"

import { useState } from "react"
import { Check, MessageSquareText, Plus, Save, ArrowRight } from "lucide-react"
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
    <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-[0_16px_32px_-28px_rgba(23,50,77,0.4)]">
      <p className="text-sm text-foreground">
        <span className="text-red-500 line-through">{original}</span>
        <ArrowRight aria-hidden className="mx-2 inline h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-primary">{suggestion}</span>
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{definition}</p>
      <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#9a5c24]" aria-hidden />
        {reason}
      </p>
      {reasonMy && (
        <p
          lang="my"
          className="mt-1 text-sm leading-relaxed text-muted-foreground"
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
              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 disabled:opacity-100"
            >
              <Check className="h-4 w-4" />
              Saved
            </Button>
          ) : saveState === "saving" ? (
            <Button variant="outline" size="sm" disabled>
              <Save className="h-4 w-4" />
              Saving…
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleClick}>
              <Plus className="h-4 w-4" />
              Save &ldquo;{suggestion}&rdquo;
            </Button>
          )}
          {saveState === "error" && (
            <p className="text-xs text-red-700">
              Couldn&apos;t save. Tap to try again.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
