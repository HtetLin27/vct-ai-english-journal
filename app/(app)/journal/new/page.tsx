"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
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
      />
    </main>
  )
}
