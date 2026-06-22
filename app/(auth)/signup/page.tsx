"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Check, Mail } from "lucide-react"
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
    <Card>
      <CardHeader>
        <p className="page-eyebrow">Start here</p>
        <CardTitle className="text-3xl font-semibold text-foreground">
          Create your account
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-muted-foreground">
          Create a space for daily English writing, feedback, and vocabulary
          review.
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
              className="text-sm font-medium"
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
            className="w-full"
          >
            {loading ? "Creating account…" : "Create Account"}
          </Button>

          {error && (
            <div
              role="alert"
              className="rounded-[18px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success === "redirecting" && (
            <div
              role="status"
              className="inline-flex items-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            >
              <Check className="h-4 w-4" />
              Account created! Redirecting…
            </div>
          )}

          {success === "confirm_email" && (
            <div
              role="status"
              className="inline-flex items-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            >
              <Mail className="h-4 w-4" />
              Check your email to confirm your account, then log in.
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Log in
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
