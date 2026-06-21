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

type SuccessKind = "redirecting" | "confirm_email"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessKind | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // When Supabase email confirmation is OFF (current local dev), signUp returns
    // a session immediately — log the user straight in. When it's ON (production),
    // signUp returns a user but no session; the user must click the email link
    // before they can log in, so don't redirect — show a "check your email" message.
    if (data.session) {
      setSuccess("redirecting")
      setLoading(false)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 800)
    } else {
      setSuccess("confirm_email")
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-xl shadow-sm bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-900">
          Create your account
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Start your English writing journey
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirm-password"
              className="text-sm font-medium text-gray-700"
            >
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || success !== null}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Creating account…" : "Create Account"}
          </Button>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-600 rounded-md px-3 py-2 text-sm"
            >
              {error}
            </div>
          )}

          {success === "redirecting" && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-600 rounded-md px-3 py-2 text-sm"
            >
              ✅ Account created! Redirecting…
            </div>
          )}

          {success === "confirm_email" && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-600 rounded-md px-3 py-2 text-sm"
            >
              📧 Check your email to confirm your account, then log in.
            </div>
          )}
        </form>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Log in →
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
