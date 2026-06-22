"use client"

import { RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ reset }: Props) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/78 py-16 text-center shadow-[0_18px_42px_-30px_rgba(23,50,77,0.45)]">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-700" aria-hidden>
        <TriangleAlert className="h-7 w-7" />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
        Something went wrong loading this page.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It&apos;s not your fault. Please try again in a moment.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
