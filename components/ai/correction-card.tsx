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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-red-500 line-through">{original}</p>
      <p className="mt-2 text-sm font-medium text-green-700">
        <span aria-hidden>→ </span>
        {corrected}
      </p>
      <p className="mt-2 text-sm text-gray-600">
        <span aria-hidden>💡 </span>
        {explanation}
      </p>
      {explanationMy && (
        <p
          lang="my"
          className="mt-1 text-sm leading-relaxed text-gray-500"
        >
          {explanationMy}
        </p>
      )}
    </div>
  )
}
