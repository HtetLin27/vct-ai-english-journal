import { NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/auth-guard"
import { geminiFlash } from "@/lib/gemini/client"
import { extractJsonObject, isNonEmptyString } from "@/lib/gemini/parse-utils"
import {
  jsonSuccess,
  jsonInternal,
  jsonValidation,
  jsonError,
} from "@/lib/utils/api-response"

const MAX_TOPIC_CHARS = 200

function buildGuidePrompt(topic: string | null): string {
  const topicLine = topic
    ? `The learner gave this hint about what they want to write about: "${topic}".`
    : "The learner did not provide a topic hint."

  return `You are a friendly English teacher helping a Myanmar learner who does not know what to journal about today.
${topicLine}

Produce 3 to 5 guided journaling questions that will help them start writing. Each question should be open-ended, encouraging, and easy to understand for an intermediate English learner.

Respond with ONLY a JSON object (no markdown, no code fences, no commentary) with this exact shape:
{
  "questions": [string, string, string]
}
Include between 3 and 5 questions. Each question must be a non-empty string.`
}

function filterQuestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (isNonEmptyString(item)) out.push(item.trim())
  }
  return out
}

function parseGuide(text: string): { questions: string[] } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonObject(text))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null
  const obj = parsed as Record<string, unknown>
  const questions = filterQuestions(obj.questions)
  if (questions.length === 0) return null
  return { questions }
}

export async function POST(request: NextRequest) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  let parsedBody: unknown = {}
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      parsedBody = await request.json()
    } catch {
      return jsonValidation("Invalid JSON body")
    }
  }
  if (parsedBody === null || typeof parsedBody !== "object") {
    return jsonValidation("Invalid request body")
  }
  const payload = parsedBody as Record<string, unknown>

  let topic: string | null = null
  if (payload.topic !== undefined && payload.topic !== null) {
    if (typeof payload.topic !== "string") {
      return jsonValidation("topic must be a string")
    }
    if (payload.topic.length > MAX_TOPIC_CHARS) {
      return jsonValidation("topic must not exceed 200 characters")
    }
    const trimmed = payload.topic.trim()
    topic = trimmed.length > 0 ? trimmed : null
  }

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

  const prompt = buildGuidePrompt(topic)

  let geminiText: string
  try {
    const result = await geminiFlash.generateContent(prompt)
    geminiText = result.response.text()
  } catch (err) {
    console.error("[ai.guide] Gemini request failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    })
    return jsonError("AI service unavailable. Please try again later.", 502)
  }

  const guide = parseGuide(geminiText)
  if (!guide) {
    console.error("[ai.guide] Gemini response was not valid JSON", {
      userId: user.id,
      sample: geminiText.slice(0, 500),
    })
    return jsonError("AI service unavailable. Please try again later.", 502)
  }

  return jsonSuccess(guide)
}
