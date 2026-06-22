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
  { label: string; Icon: LucideIcon; tone: string }
> = {
  happy: {
    label: "happy",
    Icon: Smile,
    tone: "text-emerald-700",
  },
  sad: {
    label: "sad",
    Icon: Frown,
    tone: "text-sky-700",
  },
  neutral: {
    label: "neutral",
    Icon: Meh,
    tone: "text-slate-700",
  },
  excited: {
    label: "excited",
    Icon: Sparkles,
    tone: "text-amber-700",
  },
  tired: {
    label: "tired",
    Icon: MoonStar,
    tone: "text-violet-700",
  },
}
