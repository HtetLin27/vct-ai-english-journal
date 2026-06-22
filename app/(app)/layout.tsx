import { createServerClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/shared/navbar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userEmail = session?.user.email ?? null

  return (
    <div className="min-h-screen">
      <Navbar userEmail={userEmail} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-6 md:pb-10 md:pt-8">
        <div className="page-frame surface-glow overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#17324d] via-[#e8a05c] to-[#5a7c6b]" />
          <div className="px-5 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
