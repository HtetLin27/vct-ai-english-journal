"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Props {
  entryId: string
}

export function DeleteEntryButton({ entryId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setError(json?.error || "Could not delete the entry. Please try again.")
        setDeleting(false)
        return
      }
      setOpen(false)
      router.push("/journal")
      router.refresh()
    } catch {
      setError("Could not delete the entry. Please try again.")
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-border bg-surface text-coral-light hover:bg-mistake-bg hover:text-coral-light hover:border-coral"
        >
          🗑 Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-coral bg-mistake-bg px-3 py-2 text-sm text-coral-light"
          >
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={deleting}
            className="bg-coral text-mistake-bg hover:bg-coral-light"
          >
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
