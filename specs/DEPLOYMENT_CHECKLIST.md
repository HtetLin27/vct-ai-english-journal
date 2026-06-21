# Pre-Deployment Checklist

Every item flagged across `docs/PROJECT_SPEC.md`, `specs/CHANGELOG.md`, `specs/REGRESSION_CHECKLIST.md`, and the codebase that must be resolved before the first public deploy to Vercel. Work top-to-bottom; the order roughly matches dependency (env first, then DB/auth flip, then code cleanup, then docs, then verification).

Each item has a source reference in parentheses so you can re-read the original context if needed.

---

## 1. Environment & Secrets

### Vercel project setup
- [ ] Connect the GitHub repo to a Vercel project (Production: `main` branch).
- [ ] Confirm the production build command is `next build` and the install command resolves with `npm ci` (no lockfile drift).

### Environment variables — Vercel "Production" scope
Set each of these explicitly in Vercel **Production** (and Preview, if you want preview deploys to work) — `.env.local` does **not** ship. (Source: `PROJECT_SPEC.md` §8.)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — production Supabase project URL (see Database section below for which project to point at).
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/publishable key for the production project.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — service role key for the production project. **Server-only — never expose to client.** Confirm Vercel marks it as "encrypted, not exposed to browser."
- [ ] `GEMINI_API_KEY` — see "Replace borrowed Gemini key" below before pasting.
- [ ] `MOCK_AI_RESPONSES` — **must be `false` or unset**. Shipping with `true` would return hardcoded fake feedback to real users. (Source: `PROJECT_SPEC.md` Phase 10, line 503.)

### Replace the borrowed Gemini API key
- [ ] The key currently in `.env.local` (`GEMINI_API_KEY=AIzaSy…`) appears to be borrowed/temporary. Generate a fresh key from the project owner's Google AI Studio account.
- [ ] Paste the new key into Vercel `GEMINI_API_KEY` (Production scope).
- [ ] Replace the local `.env.local` key too, or revoke the old one in Google AI Studio so it can't be misused.
- [ ] Confirm the key has the right Gemini API quota and that billing is set up if traffic will exceed the free tier.

### Confirm secrets are not in git history
- [ ] `git log --all --full-history -- .env.local` returns nothing (i.e., it has never been committed).
- [ ] `.gitignore` includes `.env.local`. If a key was ever committed even once, **rotate it** — git history is forever.

---

## 2. Database & Auth (Supabase)

### Re-enable email confirmation
- [ ] Supabase Dashboard → Authentication → Providers → Email → toggle **"Confirm email"** ON. (Source: `CHANGELOG.md` 2026-06-20 entry; `PROJECT_SPEC.md` Phase 10 line 508.)
- [ ] In the same Auth settings, configure **Site URL** and **Redirect URLs** to your production Vercel URL (e.g., `https://your-app.vercel.app`). Without this, email confirmation links will 404.
- [ ] Customize the default Supabase confirmation email template if you want (subject/from-name); the default works but looks generic.

### Update signup UX to match the new flow
- [ ] `app/(auth)/signup/page.tsx:54-60` currently shows "✅ Account created! Redirecting…" then `router.push("/dashboard")`. With email confirmation on, `supabase.auth.signUp()` returns a user with **no session** until the email link is clicked — so the redirect will land on `/login` (via middleware). Change the success state to read **"Check your email to confirm your account."** and **do not** auto-redirect.
- [ ] If you want a confirmation-success landing page (Supabase will redirect to the Site URL with a hash fragment after clicking the link), add a small page that shows "Email confirmed — please log in" and routes to `/login`.
- [ ] Re-test the full flow end-to-end after the toggle flip.

### Production vs dev project
- [ ] Decide whether production uses the **same** Supabase project as dev or a **separate** project. (`PROJECT_SPEC.md` Phase 10 mentions both options.)
  - Same project → simpler; all dev test data ships to prod. You'll want to manually delete test users + entries before launch.
  - Separate project → cleaner; requires re-running migrations and the `on_auth_user_created` trigger setup. The env vars in section 1 above must then point at the new project.
- [ ] If separate: confirm the `profiles` / `journal_entries` / `ai_feedback` / `saved_words` / `writing_streaks` schemas exist in production, and that the `on_auth_user_created` trigger that auto-inserts into `profiles` and `writing_streaks` is installed.
- [ ] If separate: confirm RLS policies are enabled and identical to dev.

### Data cleanup (if reusing dev project)
- [ ] Delete every test user from `auth.users` (CASCADE will clean `profiles`, `journal_entries`, `ai_feedback`, `saved_words`, `writing_streaks`).
- [ ] Confirm `writing_streaks` and `profiles` tables are empty after the cleanup.

---

## 3. Code Cleanup

### Remove MOCK_AI_RESPONSES dead code
Once Gemini is confirmed reachable from Vercel, the local mock fallback is no longer needed and should be removed (it remains a hidden footgun otherwise). Three files: each has a `// TEMPORARY: MOCK MODE` header block, a `MOCK_*` fixture constant, and a `if (process.env.MOCK_AI_RESPONSES === "true")` branch in the route handler. (Source: header comments in each route file.)

- [ ] `app/api/ai/feedback/route.ts` — delete header block (lines 1–15), `MOCK_FEEDBACK` const, and the `if (process.env.MOCK_AI_RESPONSES === "true")` branch.
- [ ] `app/api/ai/guide/route.ts` — same three deletions.
- [ ] `app/api/ai/draft/route.ts` — same three deletions.
- [ ] Remove `MOCK_AI_RESPONSES` row from `docs/PROJECT_SPEC.md` §8 env-vars table and from the `.env.local` template.
- [ ] Remove `MOCK_AI_RESPONSES=true` line from `specs/REGRESSION_CHECKLIST.md` test-environment assumptions.

> **Do not skip this even if `MOCK_AI_RESPONSES` is correctly `false` in Vercel.** Leaving the branch in place means a future env-var typo or accidentally-leaked dev config could silently return fake AI feedback to paying users.

### Console statements — verified clean
- [x] Scanned the codebase: all 15 `console.*` calls are `console.error` with structured `[module] message` prefixes in error paths (auth-guard, route error handlers, dashboard/view-entry query failures). **None are debug leftovers.** No action needed.

### Deferred polish items (decide go/no-go before deploy)
These were deferred from the Phase 9 audit and explicitly punted in `CHANGELOG.md` 2026-06-21. Either ship without them or knock them out now:
- [ ] **H6** — focus ring contrast (bump `focus-visible:ring-1` to `ring-2 ring-offset-2` across `entry-form.tsx`, `guided-questions.tsx`, `search-bar.tsx`, shadcn `button.tsx`).
- [ ] **H7** — mobile date input sizing (filter-bar From/To pickers cramp on narrow viewports).
- [ ] **H8** — tag input × button touch target (currently ~24px, spec wants 44×44).
- [ ] **Data-fetching caching strategy** — decide TanStack Query vs the current per-navigation `useEffect` + `fetch` pattern. Punting this is fine for v1; document the decision.

---

## 4. Documentation

### README — currently a placeholder
- [ ] `README.md` is one line (`# AI English Journal`). Write a real README. (Source: `PROJECT_SPEC.md` Phase 10 line 509; `CHANGELOG.md` 2026-06-21.) Must include:
  - Project description (1–2 paragraphs)
  - Tech stack overview
  - Setup instructions: clone, `npm install`, `.env.local` template, `npm run dev`, Supabase project setup notes
  - Screenshots: dashboard, journal entry view, AI feedback panel, vocabulary book
  - License (if applicable)
  - A note that this is a personal project, if relevant — so a stranger landing on the repo doesn't expect commercial support.

### Spec sync
- [ ] After mock-mode removal (section 3 above), update `PROJECT_SPEC.md` §8 to drop the `MOCK_AI_RESPONSES` row, and update the Status Tracker `Complete*` footnote (line 532) since the "live Gemini pending" caveat will no longer apply.
- [ ] Update `PROJECT_SPEC.md` Status Tracker: Phase 10 from `Not Started` → `Complete` once the deploy is verified.

---

## 5. Testing

### Pre-deploy local verification
- [ ] `npx tsc --noEmit` passes clean.
- [ ] `npm run build` (production build) completes with no warnings about missing env vars or unhandled exceptions.
- [ ] Manually click through `specs/REGRESSION_CHECKLIST.md` — at minimum sections §1 (Auth), §4 (AI features), §7 (Settings) since those are the surfaces most affected by the env/auth changes.

### Post-deploy verification (on the live Vercel URL)
- [ ] **Cold-start signup** — create a brand-new account with a real email address. You should see the new "Check your email" message (not auto-redirect). Confirmation email arrives within ~1 min. Clicking it logs you in.
- [ ] **Login** with the confirmed account → lands on `/dashboard`.
- [ ] **Create entry** end-to-end (title, body, mood, tags, save). Confirm the new row exists in production `journal_entries`.
- [ ] **Live Gemini call** — open the new entry, click "Check my English". Confirm the response is *real* AI feedback (not the `MOCK_FEEDBACK` fixture's "I goed to the market yesterday" sentence — that's the dead giveaway that mock mode is still on). This was the open caveat marked with `*` on Phase 5 in the Status Tracker. (Source: `PROJECT_SPEC.md` line 532.)
- [ ] **Save vocabulary word** from a suggestion → appears on `/vocabulary`.
- [ ] **Delete entry** → cascades correctly; saved word survives with `source_entry_id = NULL`.
- [ ] **Settings toggle** — flip AI off, attempt feedback, confirm the disabled panel renders; flip back on, confirm next request succeeds.
- [ ] **Logout** → redirects to `/login`; protected routes redirect back to `/login`.

### Production sanity
- [ ] Open Vercel deployment logs — no unhandled exceptions in the first hour of traffic.
- [ ] Supabase Dashboard → Logs → no RLS-denied queries or 401s from your own traffic.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is NOT visible in any client-side network request payload or `__NEXT_DATA__` blob.

---

## Quick "did I ship a footgun?" final pass

Three things would each be catastrophic on their own; verify each:

- [ ] `MOCK_AI_RESPONSES` is `false` or unset in Vercel (no fake AI for paying users).
- [ ] Email confirmation is ON in Supabase Auth (no random signups with throwaway emails creating real DB rows).
- [ ] The borrowed Gemini API key has been replaced (no surprise bill on someone else's account).
