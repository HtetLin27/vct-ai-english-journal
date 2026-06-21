import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/dashboard/stats-card"
import { JournalCard } from "@/components/journal/journal-card"
import { Button } from "@/components/ui/button"

function getGreeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return "Good morning!"
  if (hour < 18) return "Good afternoon!"
  return "Good evening!"
}

interface RecentEntry {
  id: string
  title: string
  entry_date: string
  mood: string | null
}

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) return null

  const [{ data: streak }, { data: recentEntries }] = await Promise.all([
    supabase
      .from("writing_streaks")
      .select("current_streak, longest_streak, total_words, total_entries")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("journal_entries")
      .select("id, title, entry_date, mood")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
  ])

  const currentStreak = streak?.current_streak ?? 0
  const totalWords = streak?.total_words ?? 0
  const totalEntries = streak?.total_entries ?? 0
  const entries = (recentEntries ?? []) as RecentEntry[]
  const isFirstTime = totalEntries === 0 && entries.length === 0
  const greeting = getGreeting(new Date())

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{greeting}</h1>
        {!isFirstTime && (
          <p className="mt-1 text-base text-gray-700">
            Keep up your great work 🌱
          </p>
        )}
      </div>

      {isFirstTime ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="text-4xl" aria-hidden>
            📓
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">
            Welcome to AI English Journal
          </h2>
          <p className="mt-2 text-base text-gray-700">
            Write your first entry to start your journey.
          </p>
          <div className="mt-6">
            <Button
              asChild
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Link href="/journal/new">✏ Write Your First Entry</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard icon="🔥" value={currentStreak} label="Day streak" />
            <StatsCard
              icon="✍"
              value={totalWords.toLocaleString()}
              label="words"
            />
            <StatsCard icon="📓" value={totalEntries} label="entries" />
          </section>

          <div className="mt-8">
            <Button
              asChild
              className="w-full bg-green-600 text-white hover:bg-green-700 md:w-auto"
            >
              <Link href="/journal/new">✏ Write Today&apos;s Entry</Link>
            </Button>
          </div>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent Entries
            </h2>
            <div className="mt-4 space-y-3">
              {entries.map((entry) => (
                <JournalCard
                  key={entry.id}
                  id={entry.id}
                  title={entry.title}
                  entry_date={entry.entry_date}
                  mood={entry.mood}
                  tags={[]}
                  word_count={0}
                  variant="compact"
                />
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/journal"
                className="text-sm font-medium text-green-600 hover:underline"
              >
                View all entries →
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  )
}
