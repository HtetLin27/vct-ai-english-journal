"use client"

import { KeyboardEvent, useState } from "react"

interface Props {
  value: string[]
  onChange: (tags: string[]) => void
  max?: number
}

export function TagInput({ value, onChange, max = 10 }: Props) {
  const [input, setInput] = useState("")
  const atMax = value.length >= max

  function commitTag() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) {
      setInput("")
      return
    }
    if (atMax) return
    onChange([...value, trimmed])
    setInput("")
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commitTag()
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white p-2">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="p-1 text-green-800 hover:text-green-900"
            aria-label={`Remove tag ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitTag}
        placeholder={value.length === 0 ? "Add a tag…" : ""}
        disabled={atMax}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
      />
    </div>
  )
}
