"use client"

import Link from "next/link"
import { useState } from "react"
import {
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Settings2,
  Sparkles,
} from "lucide-react"
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

interface Feedback {
  corrections: Correction[]
  suggestions: Suggestion[]
}

type PanelError =
  | { kind: "ai_disabled" }
  | { kind: "generic"; message: string }

interface Props {
  entryId: string
}

export function AiFeedbackPanel({ entryId }: Props) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState<PanelError | null>(null)

  async function handleSaveWord(suggestion: Suggestion): Promise<SaveResult> {
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: suggestion.suggestion,
          definition: suggestion.definition,
          // Forward only when the suggestion carries it — older feedback rows
          // (and any future suggestion source without a Myanmar definition)
          // simply omit the field, matching the optional API contract.
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
      setFeedback({
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
        className="mt-6 rounded-[28px] border border-[#e8a05c]/25 bg-[#fff8f1] p-5"
      >
        <p className="text-sm text-foreground">
          AI features are turned off. Go to Settings to enable them.
        </p>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">
              <Settings2 className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  if (error?.kind === "generic") {
    return (
      <section
        aria-label="AI English feedback"
        className="mt-6 rounded-[28px] border border-red-200 bg-red-50 p-5"
      >
        <p className="text-sm text-red-700">{error.message}</p>
        <div className="mt-3">
          <Button onClick={requestFeedback} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Try again
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
        className="mt-6 rounded-[28px] border border-[#e8a05c]/25 bg-[#fff8f1] p-5"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-[#9a5c24]" aria-hidden />
          Checking your English…
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden className="h-4 w-4 animate-spin text-[#9a5c24]" />
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
        className="mt-6 rounded-[28px] border border-[#e8a05c]/25 bg-[#fff8f1] p-5"
      >
        <h2 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
          <Sparkles className="h-5 w-5 text-[#9a5c24]" aria-hidden />
          Your English Feedback
        </h2>

        <div className="mt-4">
          {corrections.length === 0 ? (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Great job! No grammar mistakes found. Your writing looks correct.
            </p>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-foreground">
                Grammar Corrections{" "}
                <span className="font-normal text-muted-foreground">
                  ({corrections.length} found)
                </span>
              </h3>
              <hr className="my-2 border-[#e8a05c]/20" />
              <div className="space-y-3">
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
            </>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">
              Vocabulary Suggestions{" "}
              <span className="font-normal text-muted-foreground">
                ({suggestions.length} found)
              </span>
            </h3>
            <hr className="my-2 border-[#e8a05c]/20" />
            <div className="space-y-3">
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
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={requestFeedback}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh feedback
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="AI English feedback"
      className="mt-6 rounded-[28px] border border-[#e8a05c]/25 bg-[#fff8f1] p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={requestFeedback}>
          <Sparkles className="h-4 w-4" />
          Check my English
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Get grammar feedback and vocabulary tips.
      </p>
    </section>
  )
}
