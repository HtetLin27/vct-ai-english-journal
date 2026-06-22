"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookMarked,
  BookOpen,
  Leaf,
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
      <header className="sticky top-0 z-40 hidden border-b border-white/60 bg-background/90 backdrop-blur-md md:block">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-foreground"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_30px_-18px_rgba(23,50,77,0.8)]">
              <Leaf className="h-5 w-5" />
            </span>
            <span>
              <span className="page-eyebrow block text-[0.62rem] text-muted-foreground">
                Daily practice
              </span>
              <span className="font-display text-xl font-semibold tracking-[-0.04em]">
                AI English Journal
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 rounded-full border border-white/80 bg-white/65 p-1.5 shadow-[0_18px_42px_-28px_rgba(23,50,77,0.35)]">
            {TOP_LINKS.map((link) => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-[0_12px_24px_-16px_rgba(23,50,77,0.8)]"
                      : "text-muted-foreground hover:bg-white hover:text-foreground"
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
                "rounded-full border border-white/80 bg-white/65 p-2.5 shadow-[0_14px_28px_-24px_rgba(23,50,77,0.45)] transition-all",
                isActive(pathname, "/settings")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
            {userEmail && (
              <span
                className="max-w-[180px] truncate rounded-full border border-white/80 bg-white/65 px-4 py-2 text-sm text-muted-foreground shadow-[0_14px_28px_-24px_rgba(23,50,77,0.45)]"
                title={userEmail}
              >
                {userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="rounded-full border border-white/80 bg-white/65 p-2.5 text-muted-foreground shadow-[0_14px_28px_-24px_rgba(23,50,77,0.45)] transition-all hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-center border-b border-white/60 bg-background/90 backdrop-blur-md md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-foreground"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-[-0.04em]">
            AI English Journal
          </span>
        </Link>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-stretch rounded-[24px] border border-white/80 bg-white/88 p-1.5 shadow-[0_24px_60px_-26px_rgba(23,50,77,0.5)] backdrop-blur-md md:hidden">
        {BOTTOM_LINKS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-[18px] py-3 text-xs transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_12px_24px_-16px_rgba(23,50,77,0.8)]"
                  : "text-muted-foreground"
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
