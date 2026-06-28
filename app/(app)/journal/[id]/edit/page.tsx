"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import {
  EntryForm,
  type EntryFormValues,
} from "@/components/journal/entry-form"
import { type MoodValue } from "@/components/journal/mood-selector"

const ALLOWED_MOODS: ReadonlyArray<MoodValue> = [
  "happy",
  "sad",
  "neutral",
  "excited",
  "tired",
]

function normalizeMood(m: unknown): MoodValue | null {
  return typeof m === "string" && (ALLOWED_MOODS as readonly string[]).includes(m)
    ? (m as MoodValue)
    : null
}

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "loaded"; initial: EntryFormValues }

export default function EditEntryPage() {
  const params = useParams<{ id: string }>()
  const entryId = params.id
  const router = useRouter()

  const [state, setState] = useState<FetchState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/entries/${entryId}`)
        const json = await res.json().catch(() => null)
        if (cancelled) return

        if (!res.ok || !json?.success || !json.data) {
          setState({ status: "not_found" })
          return
        }

        const e = json.data as {
          title: string
          body: string
          entry_date: string
          mood: unknown
          tags: unknown
        }

        setState({
          status: "loaded",
          initial: {
            entry_date: e.entry_date,
            title: e.title,
            mood: normalizeMood(e.mood),
            tags: Array.isArray(e.tags)
              ? e.tags.filter((t): t is string => typeof t === "string")
              : [],
            body: e.body,
          },
        })
      } catch {
        if (!cancelled) setState({ status: "not_found" })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [entryId])

  async function handleUpdate(
    values: EntryFormValues
  ): Promise<string | null> {
    const res = await fetch(`/api/entries/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      return json?.error || "Could not save your changes. Please try again."
    }
    router.push(`/journal/${entryId}`)
    router.refresh()
    return null
  }

  return (
    <>
      <div className="mb-2">
        <Link
          href={`/journal/${entryId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Edit Entry</h1>

      {state.status === "loading" && <EntryFormSkeleton />}

      {state.status === "not_found" && (
        <div className="py-16 text-center">
          <p className="mb-4 text-lg font-semibold text-gray-900">
            Entry not found.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to My Journal
          </Link>
        </div>
      )}

      {state.status === "loaded" && (
        <EntryForm
          initial={state.initial}
          submitLabel="Save Changes"
          submittingLabel="Saving…"
          cancelHref={`/journal/${entryId}`}
          onSubmit={handleUpdate}
          draftKey={entryId}
          enableDraftFeedback
        />
      )}
    </>
  )
}

function EntryFormSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading entry">
      <SkeletonField widthClass="w-40" />
      <SkeletonField widthClass="w-full" />
      <SkeletonField widthClass="w-3/4" height="h-10" />
      <SkeletonField widthClass="w-full" height="h-12" />
      <SkeletonField widthClass="w-full" height="h-48 md:h-56" />
      <div className="flex gap-3">
        <div className="h-9 w-32 animate-pulse rounded-md bg-gray-100" />
        <div className="h-9 w-24 animate-pulse rounded-md bg-gray-100" />
      </div>
    </div>
  )
}

function SkeletonField({
  widthClass,
  height = "h-10",
}: {
  widthClass: string
  height?: string
}) {
  return (
    <div className="space-y-2">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
      <div
        className={`animate-pulse rounded-md bg-gray-100 ${height} ${widthClass}`}
      />
    </div>
  )
}
