// =============================================================================
// TEMPORARY: MOCK MODE
// =============================================================================
// When MOCK_AI_RESPONSES=true (in .env.local), this route bypasses the real
// Gemini call and returns hardcoded mock feedback so end-to-end local testing
// is possible. This exists because Gemini access is currently blocked from the
// developer's region — tracked separately.
//
// >>> MOCK_AI_RESPONSES MUST BE UNSET (OR FALSE) IN PRODUCTION. <<<
// Remove this branch once Gemini is reachable from every environment we run.
// =============================================================================
//
// The defensive error handling around the real Gemini call and JSON parse
// below is intentional and must be validated against the live API once access
// is available (deployed to Vercel or run from an allowed region).

const MOCK_FEEDBACK = {
  corrections: [
    {
      original: "I goed to the market yesterday.",
      corrected: "I went to the market yesterday.",
      explanation:
        "'Go' is an irregular verb. Its past tense form is 'went', not 'goed'.",
    },
    {
      original: "She don't like coffee.",
      corrected: "She doesn't like coffee.",
      explanation:
        "With a third-person singular subject ('she'), use 'doesn't' instead of 'don't'.",
    },
  ],
  suggestions: [
    {
      type: "vocabulary" as const,
      original: "very good",
      suggestion: "excellent",
      reason:
        "'Excellent' is more precise and sounds more natural in writing than 'very good'.",
      definition: "Extremely good; outstanding in quality.",
      example_sentence: "She did an excellent job on the presentation.",
    },
    {
      type: "expression" as const,
      original: "I like eat food",
      suggestion: "I enjoy eating food",
      reason:
        "After 'enjoy' in English we use a gerund (-ing form), and 'enjoy' is a more natural choice here.",
      definition: "To take pleasure in the activity of eating.",
      example_sentence: "I enjoy eating food with my family on weekends.",
    },
  ],
}

import { NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/auth-guard"
import { geminiFlash } from "@/lib/gemini/client"
import { extractJsonObject, isNonEmptyString } from "@/lib/gemini/parse-utils"
import {
  jsonSuccess,
  jsonInternal,
  jsonValidation,
  jsonNotFound,
  jsonError,
} from "@/lib/utils/api-response"

const MAX_AI_TOKENS = 1500
const APPROX_CHARS_PER_TOKEN = 4
const MAX_BODY_CHARS = MAX_AI_TOKENS * APPROX_CHARS_PER_TOKEN

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const FEEDBACK_COLUMNS =
  "id, entry_id, corrections, suggestions, created_at"

function buildFeedbackPrompt(entryBody: string): string {
  return `You are a friendly English teacher helping a Myanmar learner.
Analyze the following journal entry for grammar mistakes and vocabulary.

Entry:
${entryBody}

Respond with ONLY a JSON object (no markdown, no code fences, no commentary) with this exact shape:
{
  "corrections": [
    { "original": string, "corrected": string, "explanation": string }
  ],
  "suggestions": [
    {
      "type": "vocabulary" | "expression",
      "original": string,
      "suggestion": string,
      "reason": string,
      "definition": string,
      "example_sentence": string
    }
  ]
}
Field meanings for each suggestion:
- "reason": short explanation of WHY the suggested word or phrase is a better choice than the original.
- "definition": dictionary-style meaning of the suggested word or phrase (what it means), independent of this entry.
- "example_sentence": a natural, standalone example sentence that uses the suggested word or phrase correctly.
Both arrays must be present (use [] if there is nothing to suggest). Every field in every suggestion must be a non-empty string.`
}

type Correction = { original: string; corrected: string; explanation: string }
type Suggestion = {
  type: "vocabulary" | "expression"
  original: string
  suggestion: string
  reason: string
  definition: string
  example_sentence: string
}

function filterCorrections(raw: unknown): Correction[] {
  if (!Array.isArray(raw)) return []
  const out: Correction[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    if (
      isNonEmptyString(r.original) &&
      isNonEmptyString(r.corrected) &&
      isNonEmptyString(r.explanation)
    ) {
      out.push({
        original: r.original,
        corrected: r.corrected,
        explanation: r.explanation,
      })
    }
  }
  return out
}

function filterSuggestions(raw: unknown): Suggestion[] {
  if (!Array.isArray(raw)) return []
  const out: Suggestion[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    if (
      (r.type === "vocabulary" || r.type === "expression") &&
      isNonEmptyString(r.original) &&
      isNonEmptyString(r.suggestion) &&
      isNonEmptyString(r.reason) &&
      isNonEmptyString(r.definition) &&
      isNonEmptyString(r.example_sentence)
    ) {
      out.push({
        type: r.type,
        original: r.original,
        suggestion: r.suggestion,
        reason: r.reason,
        definition: r.definition,
        example_sentence: r.example_sentence,
      })
    }
  }
  return out
}

function parseFeedback(text: string): {
  corrections: Correction[]
  suggestions: Suggestion[]
} | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonObject(text))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null
  const obj = parsed as Record<string, unknown>
  const corrections = filterCorrections(obj.corrections)
  const suggestions = filterSuggestions(obj.suggestions)
  if (corrections.length === 0 && suggestions.length === 0) return null
  return { corrections, suggestions }
}

export async function POST(request: NextRequest) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  let parsedBody: unknown
  try {
    parsedBody = await request.json()
  } catch {
    return jsonValidation("Invalid JSON body")
  }
  if (!parsedBody || typeof parsedBody !== "object") {
    return jsonValidation("Invalid request body")
  }
  const payload = parsedBody as Record<string, unknown>

  if (payload.entry_id === undefined || payload.entry_id === null || payload.entry_id === "") {
    return jsonValidation("entry_id is required")
  }
  if (typeof payload.entry_id !== "string" || !UUID_PATTERN.test(payload.entry_id)) {
    return jsonValidation("entry_id must be a valid UUID")
  }
  const entryId = payload.entry_id

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("ai_enabled")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) return jsonInternal()
  if (!profile.ai_enabled) {
    return jsonError(
      "AI features are disabled. Enable them in Settings.",
      403
    )
  }

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .select("id, body")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single()

  if (entryError || !entry) return jsonNotFound("Entry not found")

  let feedback: { corrections: Correction[]; suggestions: Suggestion[] } | null

  if (process.env.MOCK_AI_RESPONSES === "true") {
    // TEMPORARY mock path — see header comment.
    feedback = MOCK_FEEDBACK
  } else {
    const truncatedBody = entry.body.slice(0, MAX_BODY_CHARS)
    const prompt = buildFeedbackPrompt(truncatedBody)

    let geminiText: string
    try {
      const result = await geminiFlash.generateContent(prompt)
      geminiText = result.response.text()
    } catch (err) {
      console.error("[ai.feedback] Gemini request failed", {
        userId: user.id,
        entryId,
        error: err instanceof Error ? err.message : String(err),
      })
      return jsonError("AI service unavailable. Please try again later.", 502)
    }

    feedback = parseFeedback(geminiText)
    if (!feedback) {
      console.error("[ai.feedback] Gemini response was not valid JSON", {
        userId: user.id,
        entryId,
        sample: geminiText.slice(0, 500),
      })
      return jsonError("AI service unavailable. Please try again later.", 502)
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ai_feedback")
    .insert({
      entry_id: entryId,
      user_id: user.id,
      corrections: feedback.corrections,
      suggestions: feedback.suggestions,
    })
    .select(FEEDBACK_COLUMNS)
    .single()

  if (insertError || !inserted) {
    console.error("[ai.feedback] ai_feedback INSERT failed", {
      userId: user.id,
      entryId,
      error: insertError?.message,
    })
    return jsonInternal()
  }

  return jsonSuccess(inserted, 201)
}
