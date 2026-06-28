"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ApplyResult = "applied" | "not_found" | "error"

interface Props {
  original: string
  corrected: string
  explanation: string
  explanationMy?: string
  // Apply the correction to the entry body. Returns "applied" on success,
  // "not_found" when the original text is no longer in the entry (e.g. the
  // user edited it), or "error" on a save failure.
  onApply?: () => Promise<ApplyResult>
}

type ApplyState = "idle" | "applying" | "applied" | "not_found" | "error"

export function CorrectionCard({
  original,
  corrected,
  explanation,
  explanationMy,
  onApply,
}: Props) {
  const [applyState, setApplyState] = useState<ApplyState>("idle")

  async function handleApply() {
    if (!onApply || applyState === "applying" || applyState === "applied") return
    setApplyState("applying")
    const result = await onApply()
    setApplyState(result)
  }

  const applied = applyState === "applied"

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-red-500 line-through">{original}</p>
      <p className="mt-2 text-sm font-medium text-green-700">
        <span aria-hidden>→ </span>
        {corrected}
      </p>
      <p className="mt-2 text-sm text-gray-600">
        <span aria-hidden>💡 </span>
        {explanation}
      </p>
      {explanationMy && (
        <p lang="my" className="mt-1 text-sm leading-relaxed text-gray-500">
          {explanationMy}
        </p>
      )}
      {onApply && (
        <div className="mt-3 flex flex-col items-end gap-1">
          {applied ? (
            <Button
              size="sm"
              disabled
              className="bg-green-100 text-green-800 hover:bg-green-100 disabled:opacity-100"
            >
              <Check className="h-4 w-4" aria-hidden />
              Applied
            </Button>
          ) : applyState === "applying" ? (
            <Button variant="outline" size="sm" disabled>
              Applying…
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleApply}>
              <Check className="h-4 w-4" aria-hidden />
              Apply this fix
            </Button>
          )}
          {applyState === "not_found" && (
            <p className="text-xs text-red-600">
              This text isn&apos;t in your entry anymore.
            </p>
          )}
          {applyState === "error" && (
            <p className="text-xs text-red-600">
              Couldn&apos;t apply. Tap to try again.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
