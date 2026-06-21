"use client"

import { useMemo, useState } from "react"
import {
  AiFeedbackPanel,
  type Feedback,
} from "@/components/ai/ai-feedback-panel"

interface Props {
  entryId: string
  body: string
}

interface Segment {
  text: string
  highlight: boolean
}

// Split the entry body into segments, marking any substring that appears as a
// correction's `original` text. Longer matches win when overlapping, and we
// dedupe the mistake list so a repeated mistake highlights every occurrence.
function buildSegments(body: string, mistakes: string[]): Segment[] {
  const unique = Array.from(new Set(mistakes.filter((m) => m && m.length > 0)))
  if (unique.length === 0) return [{ text: body, highlight: false }]
  const sorted = [...unique].sort((a, b) => b.length - a.length)

  const segments: Segment[] = []
  let i = 0
  let buffer = ""
  while (i < body.length) {
    let matched: string | null = null
    for (const m of sorted) {
      if (body.startsWith(m, i)) {
        matched = m
        break
      }
    }
    if (matched) {
      if (buffer.length > 0) {
        segments.push({ text: buffer, highlight: false })
        buffer = ""
      }
      segments.push({ text: matched, highlight: true })
      i += matched.length
    } else {
      buffer += body[i]
      i += 1
    }
  }
  if (buffer.length > 0) segments.push({ text: buffer, highlight: false })
  return segments
}

export function EntryReadingView({ entryId, body }: Props) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const mistakes = useMemo(
    () => feedback?.corrections.map((c) => c.original) ?? [],
    [feedback]
  )
  const segments = useMemo(
    () => buildSegments(body, mistakes),
    [body, mistakes]
  )

  return (
    <div className="annotation-grid mt-6">
      <div className="journal-body whitespace-pre-wrap">
        {segments.map((seg, i) =>
          seg.highlight ? (
            <mark key={i} className="mistake-highlight">
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>
      <div
        aria-hidden
        className="annotation-divider annotation-divider-gradient"
      />
      <div>
        <AiFeedbackPanel
          entryId={entryId}
          feedback={feedback}
          onFeedbackChange={setFeedback}
        />
      </div>
    </div>
  )
}
