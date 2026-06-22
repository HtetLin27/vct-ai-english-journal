import { ArrowRight, Lightbulb } from "lucide-react"

interface Props {
  original: string
  corrected: string
  explanation: string
  explanationMy?: string
}

export function CorrectionCard({
  original,
  corrected,
  explanation,
  explanationMy,
}: Props) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-[0_16px_32px_-28px_rgba(23,50,77,0.4)]">
      <p className="text-sm text-red-500 line-through">{original}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
        <ArrowRight className="h-4 w-4" aria-hidden />
        {corrected}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#9a5c24]" aria-hidden />
        {explanation}
      </p>
      {explanationMy && (
        <p
          lang="my"
          className="mt-1 text-sm leading-relaxed text-muted-foreground"
        >
          {explanationMy}
        </p>
      )}
    </div>
  )
}
