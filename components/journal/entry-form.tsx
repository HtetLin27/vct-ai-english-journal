"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Check, Tags, TextCursorInput } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MoodSelector,
} from "@/components/journal/mood-selector"
import { TagInput } from "@/components/journal/tag-input"
import { GuidedQuestions } from "@/components/ai/guided-questions"
import { type MoodValue } from "@/lib/moods"

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
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700"
        >
          <Check className="h-4 w-4" />
          Draft created. Review and edit it before saving.
        </div>
      )}

      <section className="grid gap-4 rounded-[28px] border border-white/80 bg-white/76 p-5 shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)] md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="entry-date"
            className="inline-flex items-center gap-2 text-base font-semibold"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Date
          </Label>
          <Input
            id="entry-date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="inline-flex items-center gap-2 text-base font-semibold"
          >
            <TextCursorInput className="h-4 w-4 text-muted-foreground" />
            Title
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Give your entry a title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {titleError && <p className="text-sm text-red-700">{titleError}</p>}
        </div>
      </section>

      <section className="space-y-2 rounded-[28px] border border-white/80 bg-white/76 p-5 shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
        <Label className="text-base font-semibold">How are you feeling?</Label>
        <MoodSelector value={mood} onChange={setMood} />
      </section>

      <section className="space-y-2 rounded-[28px] border border-white/80 bg-white/76 p-5 shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
        <Label className="inline-flex items-center gap-2 text-base font-semibold">
          <Tags className="h-4 w-4 text-muted-foreground" />
          Tags{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (press Enter to add)
          </span>
        </Label>
        <TagInput value={tags} onChange={setTags} />
      </section>

      <section className="space-y-2 rounded-[28px] border border-white/80 bg-white/78 p-5 shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
        <Label htmlFor="body" className="text-base font-semibold">
          What happened today?
        </Label>
        <textarea
          id="body"
          placeholder="Write about your day…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex min-h-[220px] w-full rounded-[24px] border border-input bg-white/80 px-4 py-4 text-base leading-8 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-h-[280px]"
        />
        {bodyError && <p className="text-sm text-red-700">{bodyError}</p>}
        {showGuidedQuestions && (
          <div className="pt-2">
            <GuidedQuestions onDraftReady={handleDraftReady} />
          </div>
        )}
      </section>

      {formError && (
        <div
          role="alert"
          className="rounded-[18px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
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
