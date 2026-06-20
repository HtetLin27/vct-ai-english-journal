"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoodSelector, type MoodValue } from "@/components/journal/mood-selector"
import { TagInput } from "@/components/journal/tag-input"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function NewEntryPage() {
  const router = useRouter()

  const [entryDate, setEntryDate] = useState(todayISO())
  const [title, setTitle] = useState("")
  const [mood, setMood] = useState<MoodValue | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [body, setBody] = useState("")

  const [titleError, setTitleError] = useState<string | null>(null)
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body,
          entry_date: entryDate,
          mood,
          tags,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setFormError(
          json.error || "Could not save your entry. Please try again."
        )
        setLoading(false)
        return
      }
      router.push(`/journal/${json.data.id}`)
    } catch {
      setFormError("Could not save your entry. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-2">
        <Link
          href="/journal"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back
        </Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        New Journal Entry
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          {titleError && (
            <p className="text-sm text-red-600">{titleError}</p>
          )}
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
            className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base leading-7 text-gray-700 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-600 min-h-[180px] md:min-h-[240px]"
          />
          {bodyError && (
            <p className="text-sm text-red-600">{bodyError}</p>
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
            {loading ? "Saving…" : "Save Entry"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => router.push("/journal")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  )
}
