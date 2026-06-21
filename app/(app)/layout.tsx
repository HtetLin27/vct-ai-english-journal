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
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={userEmail} />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  )
}
