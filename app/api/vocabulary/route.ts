import { NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/auth-guard"
import {
  jsonSuccess,
  jsonInternal,
  jsonValidation,
  jsonNotFound,
} from "@/lib/utils/api-response"

const WORD_COLUMNS =
  "id, word, definition, example_sentence, source_entry_id, created_at"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Postgres unique_violation
const PG_UNIQUE_VIOLATION = "23505"

function escapeIlikePattern(input: string): string {
  // Escape PostgREST `.or()` reserved characters that would break the filter
  // string: commas separate filters, parens group them. Backslashes also need
  // escaping. We don't escape `%`/`_` because the user's search term is
  // wrapped in `%...%` and treating those as literals would prevent matching.
  return input.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/[()]/g, "\\$&")
}

export async function GET(request: NextRequest) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""

  let query = supabase
    .from("saved_words")
    .select(WORD_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (q) {
    const pattern = `%${escapeIlikePattern(q)}%`
    query = query.or(`word.ilike.${pattern},definition.ilike.${pattern}`)
  }

  const { data, error } = await query
  if (error) return jsonInternal()
  return jsonSuccess(data)
}

export async function POST(request: NextRequest) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    return jsonValidation("Invalid JSON body")
  }
  if (!parsed || typeof parsed !== "object") {
    return jsonValidation("Invalid request body")
  }
  const payload = parsed as Record<string, unknown>

  const word = typeof payload.word === "string" ? payload.word.trim() : ""
  if (!word) return jsonValidation("word is required")
  if (word.length > 100) {
    return jsonValidation("word must not exceed 100 characters")
  }

  const definition =
    typeof payload.definition === "string" ? payload.definition.trim() : ""
  if (!definition) return jsonValidation("definition is required")
  if (definition.length > 500) {
    return jsonValidation("definition must not exceed 500 characters")
  }

  const exampleSentence =
    typeof payload.example_sentence === "string"
      ? payload.example_sentence.trim()
      : ""
  if (!exampleSentence) return jsonValidation("example_sentence is required")
  if (exampleSentence.length > 500) {
    return jsonValidation("example_sentence must not exceed 500 characters")
  }

  let sourceEntryId: string | null = null
  if (payload.source_entry_id !== undefined && payload.source_entry_id !== null) {
    if (
      typeof payload.source_entry_id !== "string" ||
      !UUID_PATTERN.test(payload.source_entry_id)
    ) {
      return jsonValidation("source_entry_id must be a valid UUID")
    }
    // Verify the referenced entry belongs to this user. Return 404 instead of
    // exposing whether the entry exists for another user.
    const { data: entry, error: entryErr } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("id", payload.source_entry_id)
      .eq("user_id", user.id)
      .single()
    if (entryErr || !entry) return jsonNotFound("Entry not found")
    sourceEntryId = payload.source_entry_id
  }

  const { data: saved, error: insertError } = await supabase
    .from("saved_words")
    .insert({
      user_id: user.id,
      word,
      definition,
      example_sentence: exampleSentence,
      source_entry_id: sourceEntryId,
    })
    .select(WORD_COLUMNS)
    .single()

  if (insertError) {
    if ((insertError as { code?: string }).code === PG_UNIQUE_VIOLATION) {
      return jsonValidation("This word is already in your vocabulary book")
    }
    return jsonInternal()
  }
  if (!saved) return jsonInternal()

  return jsonSuccess(saved, 201)
}
