import type { LucideIcon } from "lucide-react"
import { Frown, Meh, MoonStar, Smile, Sparkles } from "lucide-react"

export const MOODS = [
  { value: "happy", label: "Happy", Icon: Smile },
  { value: "sad", label: "Sad", Icon: Frown },
  { value: "neutral", label: "Neutral", Icon: Meh },
  { value: "excited", label: "Excited", Icon: Sparkles },
  { value: "tired", label: "Tired", Icon: MoonStar },
] as const

export type MoodValue = (typeof MOODS)[number]["value"]

export const MOOD_META: Record<
  MoodValue,
  {
    label: string
    Icon: LucideIcon
    tone: string
    accent: string
    chip: string
  }
> = {
  happy: {
    label: "happy",
    Icon: Smile,
    tone: "text-emerald-700",
    accent: "bg-emerald-500/75",
    chip: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-100",
  },
  sad: {
    label: "sad",
    Icon: Frown,
    tone: "text-sky-700",
    accent: "bg-sky-500/75",
    chip: "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-100",
  },
  neutral: {
    label: "neutral",
    Icon: Meh,
    tone: "text-slate-700",
    accent: "bg-slate-400/75",
    chip: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  },
  excited: {
    label: "excited",
    Icon: Sparkles,
    tone: "text-amber-700",
    accent: "bg-amber-500/75",
    chip: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-100",
  },
  tired: {
    label: "tired",
    Icon: MoonStar,
    tone: "text-violet-700",
    accent: "bg-violet-500/75",
    chip: "bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-100",
  },
}
