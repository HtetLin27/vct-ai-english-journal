"use client"

import { useState } from "react"
import { Lightbulb, LoaderCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Step =
  | { kind: "trigger" }
  | { kind: "topic"; topic: string; error: string | null }
  | { kind: "loadingQuestions" }
  | {
      kind: "questions"
      questions: string[]
      answers: string[]
      error: string | null
    }
  | { kind: "loadingDraft" }

interface Props {
  onDraftReady: (draft: string) => void
}

export function GuidedQuestions({ onDraftReady }: Props) {
  const [step, setStep] = useState<Step>({ kind: "trigger" })

  function reset() {
    setStep({ kind: "trigger" })
  }

  function openTopic() {
    setStep({ kind: "topic", topic: "", error: null })
  }

  async function fetchQuestions(topic: string) {
    setStep({ kind: "loadingQuestions" })
    try {
      const res = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topic.trim() ? { topic: topic.trim() } : {}),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success || !Array.isArray(json.data?.questions)) {
        setStep({
          kind: "topic",
          topic,
          error:
            json?.error ||
            "We couldn't get prompts right now. Please try again.",
        })
        return
      }
      const questions: string[] = json.data.questions
      setStep({
        kind: "questions",
        questions,
        answers: questions.map(() => ""),
        error: null,
      })
    } catch {
      setStep({
        kind: "topic",
        topic,
        error: "We couldn't get prompts right now. Please try again.",
      })
    }
  }

  async function fetchDraft(questions: string[], answers: string[]) {
    setStep({ kind: "loadingDraft" })
    try {
      const payload = {
        answers: questions.map((question, i) => ({
          question,
          answer: answers[i] ?? "",
        })),
      }
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success || typeof json.data?.draft !== "string") {
        setStep({
          kind: "questions",
          questions,
          answers,
          error:
            json?.error ||
            "We couldn't create the draft right now. Please try again.",
        })
        return
      }
      onDraftReady(json.data.draft)
      reset()
    } catch {
      setStep({
        kind: "questions",
        questions,
        answers,
        error: "We couldn't create the draft right now. Please try again.",
      })
    }
  }

  if (step.kind === "trigger") {
    return (
      <button
        type="button"
        onClick={openTopic}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <Lightbulb className="h-4 w-4" />
        Not sure what to write? Get writing prompts
      </button>
    )
  }

  if (step.kind === "topic") {
    return (
      <section className="rounded-[24px] border border-[#e8a05c]/25 bg-[#fff8f1] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb className="h-4 w-4 text-[#9a5c24]" aria-hidden />
          Get writing prompts
        </h3>
        <label
          htmlFor="guide-topic"
          className="mt-3 block text-sm font-medium text-foreground"
        >
          What happened today? (optional)
        </label>
        <Input
          id="guide-topic"
          type="text"
          maxLength={200}
          value={step.topic}
          onChange={(e) =>
            setStep({ kind: "topic", topic: e.target.value, error: step.error })
          }
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          e.g. &ldquo;work&rdquo;, &ldquo;family dinner&rdquo;,
          &ldquo;I felt tired&rdquo;
        </p>
        {step.error && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {step.error}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={() => fetchQuestions(step.topic)}>
            Get prompts
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
            Cancel
          </Button>
        </div>
      </section>
    )
  }

  if (step.kind === "loadingQuestions") {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-[24px] border border-[#e8a05c]/25 bg-[#fff8f1] p-4"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Lightbulb className="h-4 w-4 text-[#9a5c24]" aria-hidden />
          <span>Thinking of questions for you…</span>
          <LoaderCircle aria-hidden className="h-4 w-4 animate-spin text-[#9a5c24]" />
        </p>
      </section>
    )
  }

  if (step.kind === "questions") {
    const hasAnyAnswer = step.answers.some((a) => a.trim().length > 0)
    return (
      <section className="rounded-[24px] border border-[#e8a05c]/25 bg-[#fff8f1] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb className="h-4 w-4 text-[#9a5c24]" aria-hidden />
          Answer these questions and we&apos;ll write a draft
        </h3>
        <ol className="mt-3 space-y-3">
          {step.questions.map((q, i) => (
            <li key={i} className="space-y-1">
              <label
                htmlFor={`guide-answer-${i}`}
                className="block text-sm text-foreground"
              >
                {i + 1}. {q}
              </label>
              <textarea
                id={`guide-answer-${i}`}
                value={step.answers[i] ?? ""}
                maxLength={500}
                onChange={(e) => {
                  const next = [...step.answers]
                  next[i] = e.target.value
                  setStep({ ...step, answers: next, error: null })
                }}
                className="min-h-[70px] w-full rounded-[20px] border border-input bg-white/90 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8f1]"
              />
            </li>
          ))}
        </ol>
        {step.error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {step.error}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            disabled={!hasAnyAnswer}
            onClick={() => fetchDraft(step.questions, step.answers)}
          >
            <Sparkles className="h-4 w-4" />
            Create my draft
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
            Cancel
          </Button>
        </div>
      </section>
    )
  }

  // loadingDraft
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-[24px] border border-[#e8a05c]/25 bg-[#fff8f1] p-4"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles aria-hidden className="h-4 w-4 text-[#9a5c24]" />
        <span>Writing your draft…</span>
        <LoaderCircle aria-hidden className="h-4 w-4 animate-spin text-[#9a5c24]" />
      </p>
    </section>
  )
}
