"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookMarked,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const TOP_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/journal", label: "Journal" },
  { href: "/vocabulary", label: "Vocabulary" },
] as const

const BOTTOM_LINKS = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/journal", label: "Journal", Icon: BookOpen },
  { href: "/vocabulary", label: "Words", Icon: BookMarked },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface Props {
  userEmail: string | null
}

export function Navbar({ userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 hidden h-16 border-b border-gray-200 bg-white shadow-sm md:block">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-6 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-gray-900"
          >
            <span className="text-xl" aria-hidden>
              🌿
            </span>
            <span>AI English Journal</span>
          </Link>

          <nav className="flex h-full items-stretch gap-6">
            {TOP_LINKS.map((link) => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center border-b-2 text-sm transition-colors",
                    active
                      ? "border-green-600 font-medium text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                "rounded-md p-2 transition-colors",
                isActive(pathname, "/settings")
                  ? "text-green-600"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
            {userEmail && (
              <span
                className="max-w-[160px] truncate text-sm text-gray-500"
                title={userEmail}
              >
                {userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="rounded-md p-2 text-gray-500 transition-colors hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar — logo only */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-center border-b border-gray-200 bg-white shadow-sm md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-gray-900"
        >
          <span className="text-xl" aria-hidden>
            🌿
          </span>
          <span>AI English Journal</span>
        </Link>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-gray-200 bg-white md:hidden">
        {BOTTOM_LINKS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs",
                active ? "text-green-600" : "text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
