"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import {
  EntryForm,
  type EntryFormValues,
} from "@/components/journal/entry-form"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function NewEntryPage() {
  const router = useRouter()

  async function handleCreate(
    values: EntryFormValues
  ): Promise<string | null> {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      return json?.error || "Could not save your entry. Please try again."
    }
    router.push(`/journal/${json.data.id}`)
    return null
  }

  return (
    <>
      <div className="mb-2">
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <p className="page-eyebrow">New writing session</p>
      <h1 className="mb-6 mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
        New Journal Entry
      </h1>

      <EntryForm
        initial={{
          entry_date: todayISO(),
          title: "",
          mood: null,
          tags: [],
          body: "",
        }}
        submitLabel="Save Entry"
        submittingLabel="Saving…"
        cancelHref="/journal"
        onSubmit={handleCreate}
        showGuidedQuestions
      />
    </>
  )
}
