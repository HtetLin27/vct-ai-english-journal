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
    <article className="rounded-lg border border-border bg-surface p-4">
      <header className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-coral"
        />
        <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-coral-light">
          Correction
        </span>
      </header>

      <p className="text-sm leading-relaxed text-text-tertiary line-through decoration-text-tertiary/60">
        {original}
      </p>
      <p className="mt-1 text-sm leading-relaxed">
        <span aria-hidden className="mr-1 text-coral">→</span>
        <span className="font-medium text-mint">{corrected}</span>
      </p>

      <p className="mt-3 text-sm leading-relaxed text-text-body">
        {explanation}
      </p>
      {explanationMy && (
        <p
          lang="my"
          className="mt-1 text-sm leading-relaxed text-myanmar-text"
        >
          {explanationMy}
        </p>
      )}
    </article>
  )
}
