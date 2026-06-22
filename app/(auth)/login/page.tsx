"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      if (signInError.code === "email_not_confirmed") {
        setError(
          "Please confirm your email before logging in. Check your inbox for the confirmation link."
        )
      } else {
        setError("Invalid email or password. Please try again.")
      }
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <Card>
      <CardHeader>
        <p className="page-eyebrow">Welcome back</p>
        <CardTitle className="text-3xl font-semibold text-foreground">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-muted-foreground">
          Sign in to return to your writing studio and continue today&apos;s
          practice.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium"
            >
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Logging in…" : "Log In"}
          </Button>

          {error && (
            <div
              role="alert"
              className="rounded-[18px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Sign up
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
