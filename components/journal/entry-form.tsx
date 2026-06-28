"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MoodSelector,
  type MoodValue,
} from "@/components/journal/mood-selector"
import { TagInput } from "@/components/journal/tag-input"
import { GuidedQuestions } from "@/components/ai/guided-questions"
import {
  AiFeedbackPanel,
  type Correction,
  type Suggestion,
} from "@/components/ai/ai-feedback-panel"
import { type ApplyResult } from "@/components/ai/correction-card"
import { type SaveResult } from "@/components/ai/suggestion-card"
import { countWords } from "@/lib/utils/word-count"

export interface EntryFormValues {
  entry_date: string
  title: string
  mood: MoodValue | null
  tags: string[]
  body: string
}

interface Props {
  initial: EntryFormValues
  submitLabel: string
  submittingLabel: string
  cancelHref: string
  // Return null on success (parent will navigate away),
  // or a human-readable error message string on failure.
  onSubmit: (values: EntryFormValues) => Promise<string | null>
  showGuidedQuestions?: boolean
  // When provided, the form autosaves its contents to localStorage under this
  // key and offers to restore an unsaved draft on the next visit. Use a stable
  // key per editing context, e.g. "new" or the entry id.
  draftKey?: string
  // When true, shows an "AI feedback on this draft" panel once the user has
  // written something — corrections apply directly to the text in the editor.
  enableDraftFeedback?: boolean
}

const DRAFT_PREFIX = "aej-draft:"
const AUTOSAVE_DELAY_MS = 800

function draftStorageKey(key: string) {
  return DRAFT_PREFIX + key
}

function readDraft(key: string): EntryFormValues | null {
  try {
    const raw = window.localStorage.getItem(draftStorageKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<EntryFormValues>
    if (
      parsed &&
      typeof parsed.body === "string" &&
      typeof parsed.title === "string" &&
      typeof parsed.entry_date === "string" &&
      Array.isArray(parsed.tags)
    ) {
      return {
        entry_date: parsed.entry_date,
        title: parsed.title,
        mood: (parsed.mood as MoodValue | null) ?? null,
        tags: parsed.tags.filter((t): t is string => typeof t === "string"),
        body: parsed.body,
      }
    }
  } catch {
    // Corrupt or unavailable storage — treat as no draft.
  }
  return null
}

// Compare only the fields a user can edit so we don't offer to "restore" a
// draft that matches what's already in the form.
function sameValues(a: EntryFormValues, b: EntryFormValues): boolean {
  return (
    a.entry_date === b.entry_date &&
    a.title === b.title &&
    a.mood === b.mood &&
    a.body === b.body &&
    a.tags.length === b.tags.length &&
    a.tags.every((t, i) => t === b.tags[i])
  )
}

export function EntryForm({
  initial,
  submitLabel,
  submittingLabel,
  cancelHref,
  onSubmit,
  showGuidedQuestions = false,
  draftKey,
  enableDraftFeedback = false,
}: Props) {
  const router = useRouter()

  const [entryDate, setEntryDate] = useState(initial.entry_date)
  const [title, setTitle] = useState(initial.title)
  const [mood, setMood] = useState<MoodValue | null>(initial.mood)
  const [tags, setTags] = useState<string[]>(initial.tags)
  const [body, setBody] = useState(initial.body)

  const [titleError, setTitleError] = useState<string | null>(null)
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [draftAlert, setDraftAlert] = useState(false)

  // Autosave / restore state.
  const [restorable, setRestorable] = useState<EntryFormValues | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)

  const wordCount = countWords(body)

  const clearStoredDraft = () => {
    if (!draftKey) return
    try {
      window.localStorage.removeItem(draftStorageKey(draftKey))
    } catch {
      // Ignore storage failures.
    }
  }

  useEffect(() => {
    if (!draftAlert) return
    const id = setTimeout(() => setDraftAlert(false), 3000)
    return () => clearTimeout(id)
  }, [draftAlert])

  // On mount, offer to restore a saved draft that differs from what's loaded.
  useEffect(() => {
    if (!draftKey) return
    const saved = readDraft(draftKey)
    if (saved && !sameValues(saved, initial)) {
      setRestorable(saved)
    }
    // Intentionally run once per draftKey; `initial` is stable per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  // Debounced autosave. Pause while a restore prompt is pending so typing
  // doesn't clobber the draft the user hasn't decided about yet.
  useEffect(() => {
    if (!draftKey || restorable) return
    const current: EntryFormValues = { entry_date: entryDate, title, mood, tags, body }
    if (sameValues(current, initial)) return
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftStorageKey(draftKey),
          JSON.stringify(current)
        )
        setDraftSaved(true)
      } catch {
        // Ignore storage failures (e.g. private mode quota).
      }
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(id)
  }, [draftKey, restorable, entryDate, title, mood, tags, body, initial])

  function handleRestoreDraft() {
    if (!restorable) return
    setEntryDate(restorable.entry_date)
    setTitle(restorable.title)
    setMood(restorable.mood)
    setTags(restorable.tags)
    setBody(restorable.body)
    setBodyError(null)
    setRestorable(null)
  }

  function handleDiscardDraft() {
    clearStoredDraft()
    setRestorable(null)
  }

  function handleDraftReady(draft: string) {
    setBody(draft)
    setBodyError(null)
    setDraftAlert(true)
  }

  // Draft-mode feedback applies corrections straight to the editor text — no
  // save round-trip, since the entry may not exist yet.
  async function handleApplyDraftCorrection(
    correction: Correction
  ): Promise<ApplyResult> {
    if (!body.includes(correction.original)) return "not_found"
    setBody(body.replace(correction.original, correction.corrected))
    return "applied"
  }

  async function handleSaveDraftWord(
    suggestion: Suggestion
  ): Promise<SaveResult> {
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: suggestion.suggestion,
          definition: suggestion.definition,
          ...(suggestion.definition_my
            ? { definition_my: suggestion.definition_my }
            : {}),
          example_sentence: suggestion.example_sentence,
        }),
      })
      if (res.ok) return "saved"
      if (res.status === 400) {
        const json = await res.json().catch(() => null)
        if (json?.error === "This word is already in your vocabulary book") {
          return "saved"
        }
      }
      return "error"
    } catch {
      return "error"
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTitleError(null)
    setBodyError(null)
    setFormError(null)

    let valid = true
    if (!title.trim()) {
      setTitleError("Title is required")
      valid = false
    }
    if (!body.trim()) {
      setBodyError("Please write something in your entry")
      valid = false
    }
    if (!valid) return

    setLoading(true)
    try {
      const errorMsg = await onSubmit({
        entry_date: entryDate,
        title: title.trim(),
        mood,
        tags,
        body,
      })
      if (errorMsg) {
        setFormError(errorMsg)
        setLoading(false)
      } else {
        // Saved successfully — drop the local draft so it isn't offered again.
        clearStoredDraft()
      }
      // On success the parent navigates; this component unmounts.
      // We intentionally leave loading=true so the button stays disabled
      // during the transition.
    } catch {
      setFormError("Could not save your entry. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {restorable && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>📝 You have an unsaved draft from before.</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleRestoreDraft}
            >
              Restore
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {draftAlert && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          ✅ Draft created! Review and edit it before saving.
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="entry-date"
          className="text-base font-semibold text-gray-800"
        >
          Date
        </Label>
        <Input
          id="entry-date"
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          required
          className="w-auto"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="title"
          className="text-base font-semibold text-gray-800"
        >
          Title
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="Give your entry a title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {titleError && <p className="text-sm text-red-600">{titleError}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold text-gray-800">
          How are you feeling?
        </Label>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold text-gray-800">
          Tags{" "}
          <span className="text-sm font-normal text-gray-500">
            (press Enter to add)
          </span>
        </Label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="body"
          className="text-base font-semibold text-gray-800"
        >
          What happened today?
        </Label>
        <textarea
          id="body"
          placeholder="Write about your day…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex min-h-[180px] w-full rounded-md border border-input bg-white px-3 py-2 text-base leading-7 text-gray-700 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:min-h-[240px]"
        />
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {wordCount === 1 ? "1 word" : `${wordCount} words`}
            {wordCount > 0 && <span aria-hidden> 🌱</span>}
          </span>
          {draftKey && draftSaved && (
            <span className="text-gray-400">✓ Draft saved</span>
          )}
        </div>
        {bodyError && <p className="text-sm text-red-600">{bodyError}</p>}
        {showGuidedQuestions && (
          <div className="pt-2">
            <GuidedQuestions onDraftReady={handleDraftReady} />
          </div>
        )}
      </div>

      {enableDraftFeedback && body.trim() !== "" && (
        <AiFeedbackPanel
          requestPayload={() => ({ body })}
          onApplyCorrection={handleApplyDraftCorrection}
          onSaveWord={handleSaveDraftWord}
        />
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {formError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {loading ? submittingLabel : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
