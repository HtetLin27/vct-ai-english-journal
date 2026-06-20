import { createServerClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/shared/logout-button"

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-base text-gray-700 mb-6">
        {user ? `Logged in as ${user.email}` : "Session not ready yet."}
      </p>
      <LogoutButton />
    </main>
  )
}
