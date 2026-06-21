"use client"

import { useEffect, useState } from "react"
import { LogoutButton } from "@/components/shared/logout-button"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; aiEnabled: boolean }
  | { status: "load_error" }

export default function SettingsPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [email, setEmail] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!cancelled) setEmail(session?.user.email ?? null)

      try {
        const res = await fetch("/api/settings")
        const json = await res.json().catch(() => null)
        if (cancelled) return
        if (!res.ok || !json?.success) {
          setState({ status: "load_error" })
          return
        }
        setState({
          status: "loaded",
          aiEnabled: Boolean(json.data?.ai_enabled),
        })
      } catch {
        if (!cancelled) setState({ status: "load_error" })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleToggle(next: boolean) {
    if (state.status !== "loaded" || saving) return
    const previous = state.aiEnabled

    setState({ status: "loaded", aiEnabled: next })
    setSaving(true)
    setSaveError(null)
    setJustSaved(false)

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_enabled: next }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error("save failed")
      }
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 2000)
    } catch {
      setState({ status: "loaded", aiEnabled: previous })
      setSaveError("Could not save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const aiEnabled = state.status === "loaded" ? state.aiEnabled : false
  const switchDisabled = state.status !== "loaded" || saving

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">AI Features</h2>
        <hr className="my-4 border-gray-200" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <label
              htmlFor="ai-enabled"
              className="block text-base font-semibold text-gray-800"
            >
              AI English Teacher
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Grammar checking, vocabulary suggestions, and writing prompts.
            </p>
          </div>
          <Switch
            id="ai-enabled"
            checked={aiEnabled}
            onCheckedChange={handleToggle}
            disabled={switchDisabled}
            aria-label="AI English Teacher"
          />
        </div>

        <p className="mt-4 text-sm text-gray-500">
          When AI is off, the &quot;Check my English&quot; button will not
          appear on your entries.
        </p>

        {justSaved && (
          <p className="mt-3 text-sm font-medium text-green-600" role="status">
            ✓ Saved
          </p>
        )}
        {saveError && (
          <div
            role="alert"
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {saveError}
          </div>
        )}
        {state.status === "load_error" && (
          <div
            role="alert"
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            Could not load your settings. Please refresh the page.
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-900">Account</h2>
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="truncate text-sm text-gray-700">
              {email ?? "Loading…"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </section>
    </>
  )
}
