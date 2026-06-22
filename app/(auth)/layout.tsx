import { Leaf, NotebookPen } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_0.85fr]">
        <section className="hidden rounded-[36px] bg-primary px-8 py-10 text-primary-foreground shadow-[0_30px_90px_-40px_rgba(23,50,77,0.8)] lg:block">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/12">
            <Leaf className="h-6 w-6" />
          </div>
          <p className="mt-8 font-mono text-[0.72rem] uppercase tracking-[0.32em] text-white/70">
            Daily practice
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.06em]">
            Write in English with a steadier rhythm.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/78">
            A softer writing space for journaling, reviewing mistakes, and
            growing your vocabulary one entry at a time.
          </p>
          <div className="mt-8 rounded-[26px] border border-white/10 bg-white/8 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                <NotebookPen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold tracking-[-0.04em]">
                  One honest entry is enough.
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Build confidence with consistent practice, not perfect
                  grammar on the first try.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <div>
              <p className="page-eyebrow">Daily practice</p>
              <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                AI English Journal
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
