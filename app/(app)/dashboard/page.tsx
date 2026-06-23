import Link from "next/link"
import {
  ArrowRight,
  Flame,
  NotebookPen,
  NotebookText,
  RefreshCw,
  Sparkles,
} from "lucide-react"
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

  const [streakResult, entriesResult] = await Promise.all([
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

  const greeting = getGreeting(new Date())

  if (streakResult.error || entriesResult.error) {
    console.error("[dashboard.page] query failed", {
      userId: user.id,
      streakError: streakResult.error?.message,
      entriesError: entriesResult.error?.message,
    })
    return (
      <>
        <div className="mb-8">
          <p className="page-eyebrow">Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
            {greeting}
          </h1>
        </div>
        <div
          role="alert"
          className="rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-700"
        >
          <p>Could not load your dashboard.</p>
          <a
            href="/dashboard"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-800 hover:underline"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </a>
        </div>
      </>
    )
  }

  const streak = streakResult.data
  const currentStreak = streak?.current_streak ?? 0
  const totalWords = streak?.total_words ?? 0
  const totalEntries = streak?.total_entries ?? 0
  const entries = (entriesResult.data ?? []) as RecentEntry[]
  const isFirstTime = totalEntries === 0 && entries.length === 0

  return (
    <>
      <div className="mb-7 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[24px] bg-primary px-5 py-6 text-primary-foreground shadow-[0_28px_70px_-34px_rgba(23,50,77,0.78)] md:px-6">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-white/70">
            Writing studio
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
            {greeting}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 md:text-base">
            Keep your English moving with one focused entry at a time. The
            dashboard shows your rhythm, recent writing, and your next step.
          </p>
          <div className="mt-5">
            <Button
              asChild
              variant="secondary"
              className="bg-white/92 text-primary hover:bg-white"
            >
              <Link href="/journal/new">
                <NotebookPen className="h-4 w-4" />
                Write today&apos;s entry
              </Link>
            </Button>
          </div>
        </section>

        <section className="compact-card px-5 py-5 md:px-6">
          <p className="page-eyebrow">Today&apos;s note</p>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fff2e2] text-[#9a5c24]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-foreground">
                Small entries count.
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                A clear paragraph is better than waiting for a perfect essay.
              </p>
            </div>
          </div>
        </section>
      </div>

      {!isFirstTime && (
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Keep up your great work. Your streak, word count, and recent entries
            are all moving in the right direction.
          </p>
          <Button asChild>
            <Link href="/journal/new">
              <NotebookPen className="h-4 w-4" />
              New entry
            </Link>
          </Button>
        </div>
      )}

      {isFirstTime ? (
        <div className="compact-card px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary text-secondary-foreground">
            <NotebookText className="h-7 w-7" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Welcome to your writing studio
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
            Start with one honest entry about your day. The app will help you
            build consistency from there.
          </p>
          <div className="mt-7">
            <Button asChild>
              <Link href="/journal/new">
                <NotebookPen className="h-4 w-4" />
                Write your first entry
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatsCard icon={<Flame className="h-5 w-5" />} value={currentStreak} label="Day streak" />
            <StatsCard
              icon={<NotebookPen className="h-5 w-5" />}
              value={totalWords.toLocaleString()}
              label="Words written"
            />
            <StatsCard icon={<NotebookText className="h-5 w-5" />} value={totalEntries} label="Entries saved" />
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="page-eyebrow">Recent work</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
                  Recent entries
                </h2>
              </div>
              <Link
                href="/journal"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-[#234764]"
              >
                View all entries
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 space-y-2">
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
          </section>
        </>
      )}
    </>
  )
}
