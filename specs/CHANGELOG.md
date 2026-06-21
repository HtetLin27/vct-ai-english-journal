# Changelog

Notable decisions, deviations, and deferred work. Each entry is dated and tagged with the affected phase or area.

---

## 2026-06-21 — README is still the Phase 1 placeholder

**Phase:** 10 (Deployment)
**Status:** Deferred — MUST be addressed before public deployment.

**TODO before deployment:** Write a proper README.md for the project, including setup instructions, tech stack overview, and screenshots of the app (dashboard, journal entry, AI feedback panel, vocabulary book). Currently has only the placeholder `# AI English Journal` from Phase 1.

A public repo with a one-line README signals abandonment and gives new contributors / users nothing to anchor on. This blocks Phase 10 (Deployment) — see the Phase 10 checklist in `docs/PROJECT_SPEC.md`.

---

## 2026-06-20 — Fixed infinite redirect loop between middleware and dashboard

**Phase:** 2 (Authentication)
**Status:** Fixed in commit `5cbe849`.

**Bug:** Infinite redirect loop between middleware and dashboard page after login. Manifested as a React "Maximum update depth exceeded" error caught by Next.js's redirect-boundary.

**Root cause:** The dashboard page had its own redundant auth guard (`getUser()` + `redirect("/login")`) on top of middleware's guard. A transient network blip to Supabase caused the page-level `getUser()` to fail while middleware still considered the user authenticated, causing infinite bounce between `/login` and `/dashboard`:

- Page sees no user → `redirect("/login")`
- Middleware on `/login` sees authenticated user → `redirect("/dashboard")`
- Page sees no user → repeat

**Fix:**

1. Removed the redundant page-level `redirect("/login")` in `app/(app)/dashboard/page.tsx` — middleware is now the single source of truth for route protection.
2. Fixed `middleware.ts` to preserve refreshed session cookies on redirect responses (previously dropped them by returning a bare `NextResponse.redirect()` instead of copying cookies from the working `response`).
3. Switched the dashboard to `getSession()` (local JWT decode) instead of `getUser()` (network call) since middleware already verified the session — the page only needs to read the email for display, not re-verify auth.
4. Removed the redundant `router.refresh()` after `router.push("/dashboard")` in the login page, which was racing the navigation by refetching the stale `/login` route.

**Lesson:** Only ONE place should make security decisions (middleware). Downstream pages should trust that decision and read session data locally without re-verifying over the network — both because it's faster and because it removes a whole class of network-blip-induced failures.

---

## 2026-06-20 — Disabled Supabase email confirmation (dev only)

**Phase:** 2 (Authentication)
**Status:** Temporary — MUST be re-enabled before production deployment (Phase 10).

Email confirmation was turned off in the Supabase project to speed up local sign-up testing. New users sign in immediately after `supabase.auth.signUp()` without clicking a verification link.

**Toggle location:** Supabase Dashboard → Authentication → Providers → Email → Confirm email.

**Before going live (Phase 10):** flip the toggle back on, then re-test the signup flow end-to-end to confirm verification emails are sent and the redirect-after-confirmation works.
