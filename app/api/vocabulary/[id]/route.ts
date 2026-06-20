import { NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/auth-guard"
import {
  jsonSuccess,
  jsonInternal,
  jsonNotFound,
} from "@/lib/utils/api-response"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  // Ownership check first — return 404 without exposing other users' rows.
  const { data: existing, error: fetchErr } = await supabase
    .from("saved_words")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()
  if (fetchErr || !existing) return jsonNotFound("Word not found")

  const { error: deleteError } = await supabase
    .from("saved_words")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)

  if (deleteError) return jsonInternal()
  return jsonSuccess(null)
}
