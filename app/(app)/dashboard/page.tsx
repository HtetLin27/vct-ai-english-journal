import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/shared/logout-button"

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-base text-gray-700 mb-6">
        Logged in as {user.email}
      </p>
      <LogoutButton />
    </main>
  )
}
