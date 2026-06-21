import { NextRequest } from "next/server"
import { requireUser } from "@/lib/supabase/auth-guard"
import {
  jsonInternal,
  jsonSuccess,
  jsonValidation,
} from "@/lib/utils/api-response"

export async function GET() {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data, error } = await supabase
    .from("profiles")
    .select("ai_enabled")
    .eq("id", user.id)
    .single()

  if (error || !data) {
    console.error("[settings.GET] profiles select failed", {
      userId: user.id,
      error: error?.message,
    })
    return jsonInternal()
  }

  return jsonSuccess({ ai_enabled: data.ai_enabled })
}

export async function PUT(request: NextRequest) {
  const { user, supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonValidation(
      "Request body must include at least one field to update"
    )
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonValidation(
      "Request body must include at least one field to update"
    )
  }

  const { ai_enabled } = body as { ai_enabled?: unknown }

  if (ai_enabled === undefined) {
    return jsonValidation(
      "Request body must include at least one field to update"
    )
  }

  if (typeof ai_enabled !== "boolean") {
    return jsonValidation("ai_enabled must be a boolean")
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ai_enabled })
    .eq("id", user.id)
    .select("ai_enabled")
    .single()

  if (error || !data) {
    console.error("[settings.PUT] profiles update failed", {
      userId: user.id,
      error: error?.message,
    })
    return jsonInternal()
  }

  return jsonSuccess({ ai_enabled: data.ai_enabled })
}
