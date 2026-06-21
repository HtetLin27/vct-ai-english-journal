"use client"

import { Button } from "@/components/ui/button"

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ reset }: Props) {
  return (
    <div className="py-16 text-center">
      <div className="mb-4 text-5xl" aria-hidden>
        🌱
      </div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Something went wrong loading this page.
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        It&apos;s not your fault. Please try again in a moment.
      </p>
      <div className="mt-6">
        <Button
          onClick={reset}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          ↻ Try again
        </Button>
      </div>
    </div>
  )
}
