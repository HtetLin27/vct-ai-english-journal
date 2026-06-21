"use client"

import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

const DEBOUNCE_MS = 300

export function SearchBar({ value, onChange, placeholder, ariaLabel }: Props) {
  const [draft, setDraft] = useState(value)

  // Keep the local draft in sync if the parent resets value
  // (e.g., "Clear Filters" button).
  useEffect(() => {
    setDraft(value)
  }, [value])

  // Debounce: 300ms after the user stops typing, propagate up.
  useEffect(() => {
    if (draft === value) return
    const id = setTimeout(() => onChange(draft), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [draft, value, onChange])

  function clear() {
    setDraft("")
    onChange("")
  }

  return (
    <div className="relative w-full">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        size={16}
      />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder ?? "Search your entries…"}
        aria-label={ariaLabel ?? placeholder ?? "Search"}
        className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-9 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:border-mint focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mint"
      />
      {draft && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
