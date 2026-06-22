"use client"

import { useEffect, useState } from "react"
import { Check, Sparkles, UserCircle2 } from "lucide-react"
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
      <p className="page-eyebrow">Preferences</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
        Settings
      </h1>

      <section className="mt-6 rounded-[28px] border border-white/80 bg-white/78 p-6 shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2e2] text-[#9a5c24]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
              AI features
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Control writing prompts, grammar feedback, and vocabulary
              suggestions.
            </p>
          </div>
        </div>
        <hr className="soft-divider my-5" />

        <div className="flex items-start justify-between gap-4 rounded-[22px] bg-[#f6faf7] p-4">
          <div>
            <label
              htmlFor="ai-enabled"
              className="block text-base font-semibold text-foreground"
            >
              AI English Teacher
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
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

        <p className="mt-4 text-sm text-muted-foreground">
          When AI is off, the &quot;Check my English&quot; button will not
          appear on your entries.
        </p>

        {justSaved && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700" role="status">
            <Check className="h-4 w-4" />
            Saved
          </p>
        )}
        {saveError && (
          <div
            role="alert"
            className="mt-3 rounded-[18px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {saveError}
          </div>
        )}
        {state.status === "load_error" && (
          <div
            role="alert"
            className="mt-3 rounded-[18px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            Could not load your settings. Please refresh the page.
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
          Account
        </h2>
        <div className="mt-4 rounded-[28px] border border-white/80 bg-white/78 p-6 shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <span className="truncate text-sm text-foreground">
              {email ?? "Loading…"}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </section>
    </>
  )
}
