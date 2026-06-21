"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
    <Card className="rounded-xl shadow-sm bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-900">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Sign in to continue writing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
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
              className="text-sm font-medium text-gray-700"
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
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Logging in…" : "Log In"}
          </Button>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-600 rounded-md px-3 py-2 text-sm"
            >
              {error}
            </div>
          )}
        </form>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Sign up →
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
