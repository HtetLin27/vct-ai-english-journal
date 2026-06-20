import { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import {
  jsonSuccess,
  jsonUnauthorized,
  jsonInternal,
  jsonValidation,
} from "@/lib/utils/api-response"
import { countWords } from "@/lib/utils/word-count"

const ALLOWED_MOODS = ["happy", "sad", "neutral", "excited", "tired"] as const
type Mood = (typeof ALLOWED_MOODS)[number]

const LIST_COLUMNS =
  "id, title, entry_date, mood, tags, word_count, created_at, updated_at"
const FULL_COLUMNS =
  "id, user_id, title, body, entry_date, mood, tags, word_count, created_at, updated_at"
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(str: string): boolean {
  if (!DATE_PATTERN.test(str)) return false
  const d = new Date(str + "T00:00:00Z")
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str
}

function dateMinusOneDay(date: string): string {
  const d = new Date(date + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonUnauthorized()

  const { data, error } = await supabase
    .from("journal_entries")
    .select(LIST_COLUMNS)
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })

  if (error) return jsonInternal()
  return jsonSuccess(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonUnauthorized()

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

  const title = typeof payload.title === "string" ? payload.title : ""
  if (!title.trim()) return jsonValidation("Title is required")
  if (title.length > 200) {
    return jsonValidation("Title must not exceed 200 characters")
  }

  const body = typeof payload.body === "string" ? payload.body : ""
  if (!body.trim()) return jsonValidation("Body is required")
  if (body.length > 10000) {
    return jsonValidation("Body must not exceed 10000 characters")
  }

  const entryDate = typeof payload.entry_date === "string" ? payload.entry_date : ""
  if (!isValidDate(entryDate)) {
    return jsonValidation(
      "entry_date must be a valid date in YYYY-MM-DD format"
    )
  }

  let mood: Mood | null = null
  if (payload.mood !== undefined && payload.mood !== null) {
    if (
      typeof payload.mood !== "string" ||
      !ALLOWED_MOODS.includes(payload.mood as Mood)
    ) {
      return jsonValidation(
        "mood must be one of: happy, sad, neutral, excited, tired"
      )
    }
    mood = payload.mood as Mood
  }

  let tags: string[] = []
  if (payload.tags !== undefined) {
    if (
      !Array.isArray(payload.tags) ||
      !payload.tags.every((t) => typeof t === "string")
    ) {
      return jsonValidation("tags must be an array of strings")
    }
    tags = (payload.tags as string[])
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 50)
      .slice(0, 10)
  }

  const word_count = countWords(body)

  const { data: entry, error: insertError } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      title: title.trim(),
      body,
      entry_date: entryDate,
      mood,
      tags,
      word_count,
    })
    .select(FULL_COLUMNS)
    .single()

  if (insertError || !entry) return jsonInternal()

  // Update writing_streaks per DATABASE_SPEC.md section 8.
  //
  // Totals (total_words, total_entries) are a HISTORICAL RECORD — they count
  // every entry the user ever writes, regardless of its date. A backfilled
  // entry from last week is still a real entry and must count.
  //
  // Streak fields (current_streak, longest_streak, last_entry_date) measure
  // MOMENTUM — consecutive days the user actually showed up to write. Only
  // entries written for *today* reflect that momentum, so backfills to past
  // dates do not touch these fields and do not reset the streak.
  const { data: streak, error: streakSelectError } = await supabase
    .from("writing_streaks")
    .select(
      "current_streak, longest_streak, last_entry_date, total_words, total_entries"
    )
    .eq("user_id", user.id)
    .single()

  if (streakSelectError) {
    console.error(
      "[entries.POST] writing_streaks SELECT failed",
      { userId: user.id, error: streakSelectError.message }
    )
  } else if (streak) {
    const today = new Date().toISOString().slice(0, 10)
    const update: Record<string, unknown> = {
      total_words: streak.total_words + word_count,
      total_entries: streak.total_entries + 1,
    }

    if (entryDate === today) {
      const yesterday = dateMinusOneDay(today)
      let newStreak: number
      if (streak.last_entry_date === today) {
        newStreak = streak.current_streak
      } else if (streak.last_entry_date === yesterday) {
        newStreak = streak.current_streak + 1
      } else {
        newStreak = 1
      }
      update.current_streak = newStreak
      update.longest_streak = Math.max(newStreak, streak.longest_streak)
      update.last_entry_date = today
    }

    const { data: updatedRows, error: streakUpdateError } = await supabase
      .from("writing_streaks")
      .update(update)
      .eq("user_id", user.id)
      .select("user_id")

    if (streakUpdateError || !updatedRows || updatedRows.length === 0) {
      console.error(
        "[entries.POST] writing_streaks UPDATE failed",
        {
          userId: user.id,
          error: streakUpdateError?.message,
          rowsAffected: updatedRows?.length ?? 0,
        }
      )
    }
  }

  return jsonSuccess(entry, 201)
}
