import type { SupabaseClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"
import { jsonError, jsonUnauthorized } from "@/lib/utils/api-response"

type AuthedUser = { id: string }

interface AuthGuardSuccess {
  user: AuthedUser
  supabase: SupabaseClient
  errorResponse: null
}

interface AuthGuardFailure {
  user: null
  supabase: null
  errorResponse: ReturnType<typeof jsonError>
}

export type AuthGuardResult = AuthGuardSuccess | AuthGuardFailure

// Wraps `supabase.auth.getUser()` so API routes can distinguish:
//   - genuine "not logged in"           → 401 Unauthorized
//   - Supabase Auth unreachable / fetch → 503 Service temporarily unavailable
//
// Without this split, a regional/network outage to the Supabase Auth endpoint
// looks identical to a missing session in DevTools, which sent us hunting for
// auth bugs that did not exist.
export async function requireUser(): Promise<AuthGuardResult> {
  const supabase = createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (user) {
    return { user, supabase, errorResponse: null }
  }

  // Supabase-js raises `AuthSessionMissingError` when there is simply no JWT
  // to validate. Anything else (notably `AuthRetryableFetchError`) means the
  // call to the Auth endpoint itself failed — that's an upstream problem, not
  // a user-auth problem, so we surface it as 503 instead of 401.
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("[auth-guard] getUser failed", {
      name: error.name,
      status: (error as { status?: number }).status,
      message: error.message,
    })
    return {
      user: null,
      supabase: null,
      errorResponse: jsonError(
        "Service temporarily unavailable. Please try again.",
        503
      ),
    }
  }

  return {
    user: null,
    supabase: null,
    errorResponse: jsonUnauthorized(),
  }
}
