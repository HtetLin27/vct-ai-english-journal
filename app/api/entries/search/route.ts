import { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import {
  jsonSuccess,
  jsonUnauthorized,
  jsonInternal,
  jsonValidation,
} from "@/lib/utils/api-response"

const ALLOWED_MOODS = ["happy", "sad", "neutral", "excited", "tired"] as const
type Mood = (typeof ALLOWED_MOODS)[number]

const LIST_COLUMNS =
  "id, title, entry_date, mood, tags, word_count, created_at, updated_at"
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(str: string): boolean {
  if (!DATE_PATTERN.test(str)) return false
  const d = new Date(str + "T00:00:00Z")
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonUnauthorized()

  const params = request.nextUrl.searchParams
  const q = params.get("q")?.trim() || null
  const from = params.get("from")?.trim() || null
  const to = params.get("to")?.trim() || null
  const mood = params.get("mood")?.trim() || null
  const tag = params.get("tag")?.trim() || null

  if (mood !== null && !ALLOWED_MOODS.includes(mood as Mood)) {
    return jsonValidation(
      "mood must be one of: happy, sad, neutral, excited, tired"
    )
  }
  if (from !== null && !isValidDate(from)) {
    return jsonValidation("from must be a valid date in YYYY-MM-DD format")
  }
  if (to !== null && !isValidDate(to)) {
    return jsonValidation("to must be a valid date in YYYY-MM-DD format")
  }
  if (from !== null && to !== null && from > to) {
    return jsonValidation("from must not be after to")
  }

  let query = supabase
    .from("journal_entries")
    .select(LIST_COLUMNS)
    .eq("user_id", user.id)

  if (q) {
    query = query.textSearch("fts_doc", q, {
      type: "plain",
      config: "english",
    })
  }
  if (from) query = query.gte("entry_date", from)
  if (to) query = query.lte("entry_date", to)
  if (mood) query = query.eq("mood", mood)
  if (tag) query = query.contains("tags", [tag])

  const { data, error } = await query.order("entry_date", {
    ascending: false,
  })

  if (error) {
    console.error("[entries.search] query failed", {
      userId: user.id,
      error: error.message,
    })
    return jsonInternal()
  }
  return jsonSuccess(data)
}
