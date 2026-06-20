import { createServerClient } from "@/lib/supabase/server"
import { WordCard } from "@/components/vocabulary/word-card"

type SavedWord = {
  id: string
  word: string
  definition: string
  definition_my: string | null
  example_sentence: string
}

export default async function VocabularyPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user.id

  let words: SavedWord[] = []
  let loadError = false

  if (userId) {
    const { data, error } = await supabase
      .from("saved_words")
      .select("id, word, definition, definition_my, example_sentence")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[vocabulary.page] query failed", {
        userId,
        error: error.message,
      })
      loadError = true
    } else {
      words = data ?? []
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">My Vocabulary Book</h1>
      <p className="mt-1 text-sm text-gray-500">
        {words.length} {words.length === 1 ? "word" : "words"} saved
      </p>

      {loadError ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          Could not load your vocabulary book. Please refresh the page.
        </div>
      ) : words.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            📖
          </div>
          <p className="mb-1 text-lg font-semibold text-gray-900">
            Your vocabulary book is empty.
          </p>
          <p className="text-sm text-gray-500">
            When you check your English, you can save new words here to study
            later.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {words.map((w) => (
            <WordCard
              key={w.id}
              id={w.id}
              word={w.word}
              definition={w.definition}
              definitionMy={w.definition_my ?? undefined}
              example_sentence={w.example_sentence}
            />
          ))}
        </div>
      )}
    </main>
  )
}
