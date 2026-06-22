"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MOODS } from "@/lib/moods"

const MOOD_OPTIONS = MOODS.map(({ value, label }) => ({ value, label }))

// Radix Select can't use "" as an item value; this sentinel stands in
// for the "all moods" / "no filter" choice and is translated to null
// at the boundary.
const ALL_MOODS = "__all__"

const TAG_DEBOUNCE_MS = 300

interface Props {
  mood: string | null
  from: string
  to: string
  tag: string
  onMoodChange: (mood: string | null) => void
  onFromChange: (date: string) => void
  onToChange: (date: string) => void
  onTagChange: (tag: string) => void
}

export function FilterBar({
  mood,
  from,
  to,
  tag,
  onMoodChange,
  onFromChange,
  onToChange,
  onTagChange,
}: Props) {
  // Tag input has its own debounced draft state for the same reason the
  // search bar does — typing should not fire one fetch per keystroke.
  const [tagDraft, setTagDraft] = useState(tag)

  useEffect(() => {
    setTagDraft(tag)
  }, [tag])

  useEffect(() => {
    if (tagDraft === tag) return
    const id = setTimeout(() => onTagChange(tagDraft), TAG_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [tagDraft, tag, onTagChange])

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-[0_18px_42px_-34px_rgba(23,50,77,0.45)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="page-eyebrow">Refine entries</p>
          <p className="text-sm text-muted-foreground">
            Filter by mood, date range, or a tag.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label
            id="filter-mood-label"
            className="text-xs font-medium text-muted-foreground"
          >
            Mood
          </Label>
          <Select
            value={mood ?? ALL_MOODS}
            onValueChange={(v) => onMoodChange(v === ALL_MOODS ? null : v)}
          >
            <SelectTrigger
              aria-labelledby="filter-mood-label"
              className="w-[160px]"
            >
              <SelectValue placeholder="All moods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MOODS}>All moods</SelectItem>
              {MOOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label
            htmlFor="filter-from"
            className="text-xs font-medium text-muted-foreground"
          >
            From
          </Label>
          <Input
            id="filter-from"
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-[150px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label
            htmlFor="filter-to"
            className="text-xs font-medium text-muted-foreground"
          >
            To
          </Label>
          <Input
            id="filter-to"
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="w-[150px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label
            htmlFor="filter-tag"
            className="text-xs font-medium text-muted-foreground"
          >
            Tag
          </Label>
          <Input
            id="filter-tag"
            type="text"
            placeholder="e.g. travel"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>
    </div>
  )
}
