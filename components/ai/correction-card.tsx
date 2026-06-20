interface Props {
  original: string
  corrected: string
  explanation: string
}

export function CorrectionCard({ original, corrected, explanation }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-red-500 line-through">{original}</p>
      <p className="mt-2 text-sm font-medium text-green-700">
        <span aria-hidden>→ </span>
        {corrected}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        <span aria-hidden>💡 </span>
        {explanation}
      </p>
    </div>
  )
}
