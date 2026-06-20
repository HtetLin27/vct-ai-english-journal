// NOTE: The Gemini call in this route cannot be exercised end-to-end from the
// current local environment (Gemini access is blocked by region — tracked
// separately). The defensive error handling around the Gemini call and JSON
// parse below is intentional and must be validated against the live API once
// access is available (deployed to Vercel or run from an allowed region).

import { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { geminiFlash } from "@/lib/gemini/client"
import { extractJsonObject, isNonEmptyString } from "@/lib/gemini/parse-utils"
import {
  jsonSuccess,
  jsonUnauthorized,
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
    { "type": "vocabulary" | "expression", "original": string, "suggestion": string, "reason": string }
  ]
}
Both arrays must be present (use [] if there is nothing to suggest).`
}

type Correction = { original: string; corrected: string; explanation: string }
type Suggestion = {
  type: "vocabulary" | "expression"
  original: string
  suggestion: string
  reason: string
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
      isNonEmptyString(r.reason)
    ) {
      out.push({
        type: r.type,
        original: r.original,
        suggestion: r.suggestion,
        reason: r.reason,
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
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonUnauthorized()

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

  const feedback = parseFeedback(geminiText)
  if (!feedback) {
    console.error("[ai.feedback] Gemini response was not valid JSON", {
      userId: user.id,
      entryId,
      sample: geminiText.slice(0, 500),
    })
    return jsonError("AI service unavailable. Please try again later.", 502)
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
