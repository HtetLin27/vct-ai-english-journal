import { NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/auth-guard"
import { geminiFlash } from "@/lib/gemini/client"
import {
  jsonSuccess,
  jsonInternal,
  jsonValidation,
  jsonError,
} from "@/lib/utils/api-response"

const MAX_ANSWERS = 5
const MAX_QUESTION_CHARS = 300
const MAX_ANSWER_CHARS = 500

type QAPair = { question: string; answer: string }

function buildDraftPrompt(answers: QAPair[]): string {
  const qaBlock = answers
    .map(
      (pair, i) =>
        `Q${i + 1}: ${pair.question}\nA${i + 1}: ${pair.answer}`
    )
    .join("\n\n")

  return `You are a friendly English teacher helping a Myanmar learner write a journal entry.
Below are guided questions and the learner's short answers. Use them to write a complete journal entry in the learner's voice — first person, warm, natural English at an intermediate level.

${qaBlock}

Write only the journal entry text. Do not include a title, headings, code fences, commentary, or sign-offs. Do not wrap the text in quotation marks. Use plain paragraphs separated by blank lines.`
}

function sanitizeDraft(raw: string): string {
  let text = raw.trim()

  // Strip surrounding triple-backtick fences if Gemini ignored the instruction.
  text = text.replace(/^```(?:\w+)?\s*\n?/i, "").replace(/\n?```\s*$/i, "")

  // Strip a leading conversational preamble like "Here's your draft:".
  text = text.replace(/^(here(?:'s| is)[^\n:]*:\s*)/i, "")

  // Strip surrounding straight or smart quotes wrapping the whole draft.
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("“") && text.endsWith("”"))
  ) {
    text = text.slice(1, -1)
  }

  return text.trim()
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

  if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
    return jsonValidation("answers must be a non-empty array")
  }
  if (payload.answers.length > MAX_ANSWERS) {
    return jsonValidation("answers must not exceed 5 items")
  }

  const answers: QAPair[] = []
  for (const item of payload.answers) {
    if (!item || typeof item !== "object") {
      return jsonValidation("Each answer must not be empty")
    }
    const r = item as Record<string, unknown>
    const question = typeof r.question === "string" ? r.question : ""
    const answer = typeof r.answer === "string" ? r.answer : ""
    if (!answer.trim()) {
      return jsonValidation("Each answer must not be empty")
    }
    if (answer.length > MAX_ANSWER_CHARS) {
      return jsonValidation("Each answer must not exceed 500 characters")
    }
    if (question.length > MAX_QUESTION_CHARS) {
      return jsonValidation("Each question must not exceed 300 characters")
    }
    answers.push({ question: question.trim(), answer: answer.trim() })
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

  const prompt = buildDraftPrompt(answers)

  let geminiText: string
  try {
    const result = await geminiFlash.generateContent(prompt)
    geminiText = result.response.text()
  } catch (err) {
    console.error("[ai.draft] Gemini request failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    })
    return jsonError("AI service unavailable. Please try again later.", 502)
  }

  const draft = sanitizeDraft(geminiText)
  if (!draft) {
    console.error("[ai.draft] Gemini returned empty draft", {
      userId: user.id,
      sample: geminiText.slice(0, 500),
    })
    return jsonError("AI service unavailable. Please try again later.", 502)
  }

  return jsonSuccess({ draft })
}
