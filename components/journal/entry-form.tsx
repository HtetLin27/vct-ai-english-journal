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
}

export function EntryForm({
  initial,
  submitLabel,
  submittingLabel,
  cancelHref,
  onSubmit,
  showGuidedQuestions = false,
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

  useEffect(() => {
    if (!draftAlert) return
    const id = setTimeout(() => setDraftAlert(false), 3000)
    return () => clearTimeout(id)
  }, [draftAlert])

  function handleDraftReady(draft: string) {
    setBody(draft)
    setBodyError(null)
    setDraftAlert(true)
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
          className="flex min-h-[180px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base leading-7 text-gray-700 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-600 md:min-h-[240px]"
        />
        {bodyError && <p className="text-sm text-red-600">{bodyError}</p>}
        {showGuidedQuestions && (
          <div className="pt-2">
            <GuidedQuestions onDraftReady={handleDraftReady} />
          </div>
        )}
      </div>

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
