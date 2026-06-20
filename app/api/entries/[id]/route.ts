import { NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/auth-guard"
import {
  jsonSuccess,
  jsonInternal,
  jsonValidation,
  jsonNotFound,
} from "@/lib/utils/api-response"
import { countWords } from "@/lib/utils/word-count"

const ALLOWED_MOODS = ["happy", "sad", "neutral", "excited", "tired"] as const
type Mood = (typeof ALLOWED_MOODS)[number]

const FULL_COLUMNS =
  "id, user_id, title, body, entry_date, mood, tags, word_count, created_at, updated_at"
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(str: string): boolean {
  if (!DATE_PATTERN.test(str)) return false
  const d = new Date(str + "T00:00:00Z")
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .select(FULL_COLUMNS)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !entry) return jsonNotFound("Entry not found")
  return jsonSuccess(entry)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  // Ownership check before any update logic — return 404 if the entry
  // doesn't exist OR belongs to another user (don't leak existence).
  const { data: existing, error: fetchErr } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()
  if (fetchErr || !existing) return jsonNotFound("Entry not found")

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

  const update: Record<string, unknown> = {}

  if ("title" in payload) {
    if (typeof payload.title !== "string" || !payload.title.trim()) {
      return jsonValidation("Title must not be empty")
    }
    if (payload.title.length > 200) {
      return jsonValidation("Title must not exceed 200 characters")
    }
    update.title = payload.title.trim()
  }

  if ("body" in payload) {
    if (typeof payload.body !== "string" || !payload.body.trim()) {
      return jsonValidation("Body must not be empty")
    }
    if (payload.body.length > 10000) {
      return jsonValidation("Body must not exceed 10000 characters")
    }
    update.body = payload.body
    update.word_count = countWords(payload.body)
  }

  if ("entry_date" in payload) {
    if (
      typeof payload.entry_date !== "string" ||
      !isValidDate(payload.entry_date)
    ) {
      return jsonValidation(
        "entry_date must be a valid date in YYYY-MM-DD format"
      )
    }
    update.entry_date = payload.entry_date
  }

  if ("mood" in payload) {
    if (payload.mood === null) {
      update.mood = null
    } else if (
      typeof payload.mood !== "string" ||
      !ALLOWED_MOODS.includes(payload.mood as Mood)
    ) {
      return jsonValidation(
        "mood must be one of: happy, sad, neutral, excited, tired"
      )
    } else {
      update.mood = payload.mood
    }
  }

  if ("tags" in payload) {
    if (
      !Array.isArray(payload.tags) ||
      !payload.tags.every((t) => typeof t === "string")
    ) {
      return jsonValidation("tags must be an array of strings")
    }
    update.tags = (payload.tags as string[])
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 50)
      .slice(0, 10)
  }

  if (Object.keys(update).length === 0) {
    return jsonValidation(
      "Request body must include at least one field to update"
    )
  }

  const { data: updated, error: updateError } = await supabase
    .from("journal_entries")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select(FULL_COLUMNS)
    .single()

  if (updateError || !updated) return jsonInternal()
  return jsonSuccess(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  // Ownership check first — return 404 without exposing other users' rows.
  const { data: existing, error: fetchErr } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()
  if (fetchErr || !existing) return jsonNotFound("Entry not found")

  const { error: deleteError } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)

  if (deleteError) return jsonInternal()
  return jsonSuccess(null)
}
