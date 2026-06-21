"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CorrectionCard } from "@/components/ai/correction-card"
import { SuggestionCard, type SaveResult } from "@/components/ai/suggestion-card"

interface Correction {
  original: string
  corrected: string
  explanation: string
  explanation_my?: string
}

interface Suggestion {
  type: "vocabulary" | "expression"
  original: string
  suggestion: string
  reason: string
  reason_my?: string
  definition: string
  definition_my?: string
  example_sentence: string
}

export interface Feedback {
  corrections: Correction[]
  suggestions: Suggestion[]
}

type PanelError =
  | { kind: "ai_disabled" }
  | { kind: "generic"; message: string }

interface Props {
  entryId: string
  feedback: Feedback | null
  onFeedbackChange: (feedback: Feedback | null) => void
}

const PANEL_BASE =
  "rounded-xl border border-suggestion-border bg-suggestion-bg p-4"

export function AiFeedbackPanel({
  entryId,
  feedback,
  onFeedbackChange,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PanelError | null>(null)

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

  async function requestFeedback() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId }),
      })
      const json = await res.json().catch(() => null)

      if (res.status === 403) {
        setError({ kind: "ai_disabled" })
        return
      }
      if (!res.ok || !json?.success || !json.data) {
        setError({
          kind: "generic",
          message:
            json?.error ||
            "We couldn't get feedback right now. Please try again.",
        })
        return
      }
      onFeedbackChange({
        corrections: json.data.corrections ?? [],
        suggestions: json.data.suggestions ?? [],
      })
    } catch {
      setError({
        kind: "generic",
        message: "We couldn't get feedback right now. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (error?.kind === "ai_disabled") {
    return (
      <section
        aria-label="AI English feedback"
        className="rounded-xl border border-border bg-surface p-4"
      >
        <p className="text-sm text-text-body">
          AI features are turned off. Go to Settings to enable them.
        </p>
        <div className="mt-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border bg-surface text-text-primary hover:bg-surface-elevated hover:text-mint"
          >
            <Link href="/settings">Settings →</Link>
          </Button>
        </div>
      </section>
    )
  }

  if (error?.kind === "generic") {
    return (
      <section
        aria-label="AI English feedback"
        className="rounded-xl border border-coral bg-mistake-bg p-4"
      >
        <p className="text-sm text-coral-light">{error.message}</p>
        <div className="mt-3">
          <Button
            onClick={requestFeedback}
            disabled={loading}
            className="bg-mint-dark text-mint-on hover:bg-mint"
          >
            ↻ Try again
          </Button>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section
        aria-label="AI English feedback"
        role="status"
        aria-live="polite"
        className={PANEL_BASE}
      >
        <p className="font-display text-base font-semibold text-text-primary">
          <span aria-hidden>✨ </span>
          Checking your English…
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <span
            aria-hidden
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-suggestion-border border-t-mint"
          />
          <span>This usually takes a few seconds.</span>
        </div>
      </section>
    )
  }

  if (feedback) {
    const { corrections, suggestions } = feedback
    return (
      <section
        aria-label="AI English feedback"
        className="flex flex-col gap-4"
      >
        <header className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            <span aria-hidden>✨ </span>
            Your English Feedback
          </h2>
          <Button
            onClick={requestFeedback}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-border bg-surface text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
          >
            ↻ Refresh
          </Button>
        </header>

        {corrections.length === 0 ? (
          <div className="rounded-lg border border-suggestion-border bg-mood-bg p-3">
            <p className="text-sm font-medium text-mint">
              <span aria-hidden>✅ </span>
              Great job! No grammar mistakes found.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-wider text-coral-light">
              Corrections{" "}
              <span className="font-body font-normal text-text-tertiary">
                · {corrections.length} found
              </span>
            </h3>
            {corrections.map((c, i) => (
              <CorrectionCard
                key={i}
                original={c.original}
                corrected={c.corrected}
                explanation={c.explanation}
                explanationMy={c.explanation_my}
              />
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-wider text-mint">
              Suggestions{" "}
              <span className="font-body font-normal text-text-tertiary">
                · {suggestions.length} found
              </span>
            </h3>
            {suggestions.map((s, i) => (
              <SuggestionCard
                key={i}
                type={s.type}
                original={s.original}
                suggestion={s.suggestion}
                reason={s.reason}
                reasonMy={s.reason_my}
                definition={s.definition}
                example_sentence={s.example_sentence}
                onSave={() => handleSaveWord(s)}
              />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section aria-label="AI English feedback" className={PANEL_BASE}>
      <h2 className="font-display text-base font-semibold text-text-primary">
        <span aria-hidden>✨ </span>
        Check my English
      </h2>
      <p className="mt-1 text-sm text-text-body">
        Get grammar feedback and vocabulary tips.
      </p>
      <div className="mt-3">
        <Button
          onClick={requestFeedback}
          className="bg-mint-dark text-mint-on hover:bg-mint"
        >
          ✨ Check my English
        </Button>
      </div>
    </section>
  )
}
