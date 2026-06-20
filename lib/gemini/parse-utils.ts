// Gemini sometimes wraps JSON in ```json ... ``` fences or surrounds it with
// conversational prose. Strip fences and isolate the outermost {...} block
// before handing the text to JSON.parse.
export function extractJsonObject(text: string): string {
  const fenceStripped = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim()
  const first = fenceStripped.indexOf("{")
  const last = fenceStripped.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) return fenceStripped
  return fenceStripped.slice(first, last + 1)
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}
