import { Button } from "@/components/ui/button"

interface Props {
  type: "vocabulary" | "expression"
  original: string
  suggestion: string
  reason: string
  entry_id: string
  onSave?: (word: string) => void
}

export function SuggestionCard({
  type,
  original,
  suggestion,
  reason,
  onSave,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-700">
        <span className="text-red-500 line-through">{original}</span>
        <span aria-hidden className="mx-2 text-gray-400">
          →
        </span>
        <span className="font-medium text-green-700">{suggestion}</span>
      </p>
      <p className="mt-2 text-sm text-gray-500">
        <span aria-hidden>💬 </span>
        {reason}
      </p>
      {type === "vocabulary" && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave?.(suggestion)}
          >
            + Save &ldquo;{suggestion}&rdquo;
          </Button>
        </div>
      )}
    </div>
  )
}
