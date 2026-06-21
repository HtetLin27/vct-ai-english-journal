# AI English Journal — Project Report

## 1. Project Overview

**AI English Journal** is a private journaling web application built for Myanmar nationals learning English at a beginner-to-intermediate level. Users write daily journal entries; an AI English teacher (Google Gemini) returns grammar corrections, vocabulary suggestions, and guided writing prompts — with every correction explained in **both English and Myanmar (မြန်မာ)**.

The bilingual explanation is the project's central design choice. Existing journaling apps (Day One, Notion) offer no language feedback. Existing AI tutors (Duolingo, ChatGPT) are not journaling environments and explain in English only, which is the language the learner is still struggling with. The combined product — daily reflective writing plus an AI teacher who explains corrections in the learner's first language — is the gap this project fills.

- **Live deployment:** https://vct-ai-english-journal.vercel.app/
- **Repository:** this directory
- **Demo account:** `demo.aiej@gmail.com` (pre-loaded with 7 days of entries, a 7-day streak, and saved vocabulary so every feature surface is non-empty for evaluation)
- **Status:** Phases 1–9 complete, Phase 10 deployed and verified end-to-end. Residual pre-launch items tracked in `specs/DEPLOYMENT_CHECKLIST.md`.

---

## 2. Development Approach — Spec-Driven Development with an AI Coding Agent

This project was built collaboratively with **Claude Code** (Anthropic's CLI coding agent) as the primary implementation tool. My role was direction, review, and judgment; Claude's role was generating code, running tests, and proposing diffs. The collaboration worked because of the upfront investment in specifications.

Before Claude wrote a single line of production code, I authored four written specifications stored under `docs/`:

- **`PROJECT_SPEC.md`** — phases, security rules, conventions, status tracker.
- **`API_SPEC.md`** — all 16 endpoints with exact request/response shapes, validation rules, and the precise error strings each route must return.
- **`DATABASE_SPEC.md`** — full schema with `CREATE TABLE`, indexes, RLS policies, the signup trigger, and a runnable end-to-end execution script.
- **`UI_SPEC.md`** — design system, page layouts, component-by-component visual specifications.

These specs functioned as **living contracts** throughout the build:

- When Claude drifted toward a shortcut (e.g., reaching for the AI without checking the `ai_enabled` flag, or omitting a `WHERE user_id` clause), the spec was the source of truth I could point at without subjective debate.
- When a question came up mid-implementation that the spec didn't answer, I updated the spec first, then asked Claude to implement against the updated version. This avoided the failure mode where verbal decisions get lost between sessions.
- Each session began with Claude reading the relevant spec files. This kept context fresh without me having to re-explain the project structure every time.

The trade-off is real: **spec maintenance is its own work, and stale specs lie**. Twice during the build I caught the documented spec disagreeing with the actual code (most notably for `POST /api/vocabulary`, where the route emits seven error messages that the spec didn't list). I addressed this by treating `specs/CHANGELOG.md` as the system of record for "what actually changed and why," even when the formal spec hadn't caught up yet. Future iterations would benefit from automated drift detection — likely a custom check that diffs documented error messages against `jsonValidation(...)` calls in the routes.

---

## 3. Tools Used

### 3.1 MCP — Supabase MCP Server

The Supabase MCP server gave Claude direct database access from inside the coding session, eliminating the round-trip of "ask the user to run a SQL query in the Supabase dashboard and paste the result back." Concrete uses:

- **Schema verification during development.** Before writing a query, Claude would confirm column names and types live, rather than relying on stale memory. This caught at least one wrong-column-name typo before it ever ran in production.
- **Migrations applied directly.** Phase 1 schema setup was applied via `apply_migration` (not by me copy-pasting SQL into the dashboard), with the migration text stored in the session for review.
- **Security advisor checks.** After schema changes, `get_advisors` flagged the two security warnings later documented in `DATABASE_SPEC.md` §11: pinning `search_path` on `set_updated_at`, and revoking public `EXECUTE` on `handle_new_user`. Both were resolved before deployment.
- **Production demo data seeding.** After deploying to Vercel, I needed a polished demo account for screenshots. Rather than manually clicking through the live site five times, Claude used `execute_sql` to insert seven backdated journal entries and manually update the `writing_streaks` counters (since direct SQL bypasses the API route's streak-update logic). Each step was shown to me as proposed SQL before execution, in keeping with the "show me before you touch production" discipline.

### 3.2 Skills

Two skills were active in the project:

- **Custom project skill (`.claude/SKILL.md`).** A hand-written 350-line skill file that every coding session reads before generating any new file. It contains: security rules (auth-first verification, `user_id` always scoped, return 404 not 403 for cross-user resources), the JSON response envelope, the database quick reference, the color tokens, the file/folder conventions, and a "before you write any code" checklist of 10 items. The most important effect of this skill: it reduced spec drift by surfacing the non-negotiables at the start of every session, so Claude wasn't reasoning from training-data defaults that might disagree with the project's actual rules.

- **Official Supabase agent skill.** Installed for canonical guidance on safe database operations: when to prefer `apply_migration` vs `execute_sql`, how RLS interacts with the anon-key server client vs the service-role key, and which advisors to run after schema changes. This skill complemented `DATABASE_SPEC.md` by providing tooling-level best practices that the spec deliberately stayed silent on.

### 3.3 Agent — `test-writer` Subagent

I authored a custom subagent (`.claude/agents/test-writer.md`) that specializes in generating test cases for this project's endpoints. The subagent's instructions encode the project's testing conventions:

- Outputs a **manual test checklist** matching `specs/REGRESSION_CHECKLIST.md` style (no test runner is installed yet, so executable Jest/Vitest code would have nowhere to run).
- Reads the actual route file *and* the matching `API_SPEC.md` section, then cross-references them.
- Organizes output into required sections: happy path, validation errors, auth failures, ownership/cross-user, side effects, feature-specific edge cases, and **open questions** for spec/code drift it can't silently fix.

**Demonstration: `POST /api/vocabulary`.** When asked to generate tests for the vocabulary save endpoint, the subagent produced ~30 specific test items and — more usefully — **caught nine concrete pieces of spec/code drift**:

- The route emits validation errors `"Invalid JSON body"`, `"Invalid request body"`, `"word must not exceed 100 characters"`, `"definition must not exceed 500 characters"`, `"example_sentence must not exceed 500 characters"`, `"definition_my must be a string"`, `"definition_my must not exceed 500 characters"`, and `"source_entry_id must be a valid UUID"` — none of which appear in `API_SPEC.md` §6's error table.
- The route returns HTTP `404 "Entry not found"` when `source_entry_id` belongs to another user — undocumented in the spec, but the correct security behavior (don't leak whether another user's entry exists).

This is the test-writer's most valuable output: **not the tests themselves, but the drift it surfaces**. The same pattern was demonstrated for `GET /api/entries/search`, which uncovered undocumented silent-trim behavior on all query parameters and a missing tie-breaker in the sort order.

---

## 4. Architecture Summary

### 4.1 Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui v2.1.0 (style `new-york`, brand-green overrides) |
| Backend | Next.js API Routes (same repo) |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth (email + password) |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Hosting | Vercel |

### 4.2 Database Schema (5 tables)

All tables in the `public` schema, with RLS enabled and policies scoped to `auth.uid() = user_id`.

| Table | Purpose |
|---|---|
| `profiles` | 1-to-1 with `auth.users`. Holds `ai_enabled` boolean. |
| `journal_entries` | Core table. `title`, `body`, `entry_date`, `mood` (CHECK constraint on 5 values), `tags text[]`, `word_count`. |
| `ai_feedback` | Immutable per-entry AI results. `corrections` and `suggestions` JSONB arrays carrying bilingual English+Myanmar fields. |
| `saved_words` | Personal vocabulary book. `UNIQUE (user_id, word)` to prevent duplicates. `definition_my` nullable for future non-AI sources. |
| `writing_streaks` | Pre-computed dashboard stats (current/longest streak, total words/entries, last entry date). |

A signup trigger (`on_auth_user_created`, `SECURITY DEFINER`) auto-inserts the `profiles` and `writing_streaks` rows for every new `auth.users` row.

### 4.3 API Structure (16 endpoints)

All routes use the standard envelope: `{ success: true, data, error: null }` on success, `{ success: false, data: null, error: "..." }` on failure, with correct HTTP status codes.

- **Auth:** 1 route (`GET /api/auth/session`)
- **Journal:** 5 routes (list, create, get, update, delete, search)
- **AI:** 3 routes (feedback, guide, draft) — all gated by `ai_enabled`
- **Vocabulary:** 3 routes (list, create, delete)
- **Stats:** 1 route (`GET /api/stats`)
- **Settings:** 2 routes (get, update)
- **Search:** 1 route (`GET /api/entries/search`)

### 4.4 Key Security Patterns

- **Row Level Security as defense in depth.** Every table has `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies tied to `auth.uid() = user_id`. The application layer already filters by user, but RLS is the second wall — a query that accidentally forgot `WHERE user_id` would still return zero other users' rows instead of leaking data.
- **`requireUser()` helper across 9 API routes.** A small wrapper in `lib/supabase/auth-guard.ts` distinguishes "no JWT" (`AuthSessionMissingError` → HTTP 401) from "Supabase Auth endpoint is unreachable" (`AuthRetryableFetchError` → HTTP 503). Before this split, a regional/network outage to the Auth endpoint looked identical to a missing session, which sent me chasing auth bugs that didn't exist.
- **404 over 403 for cross-user resources.** Documented in `SKILL.md` as a non-negotiable: never confirm that a resource exists when the caller isn't authorized to see it.
- **AI gating before any external call.** Every `/api/ai/*` route checks `profiles.ai_enabled` *before* invoking Gemini, so a user who disables AI pays no API cost and shares no entry text with a third-party model.

---

## 5. Real Engineering Problems Solved

These are not "I built a feature" stories — they are bugs and constraints that required structural fixes.

### 5.1 Infinite Redirect Loop Between Middleware and Dashboard

**Symptom.** After login, the app entered an infinite redirect loop between `/login` and `/dashboard`, manifested as React's *"Maximum update depth exceeded"* error.

**Root cause.** Two layers were each making authentication decisions: middleware (the intended source of truth) and the dashboard page itself (which had a redundant `getUser()` + `redirect("/login")` guard). A transient network blip to Supabase caused the page-level `getUser()` to fail (returning no user) while middleware still considered the JWT valid. The result:

- Page sees no user → `redirect("/login")`
- Middleware on `/login` sees authenticated user → `redirect("/dashboard")`
- Page sees no user → repeat

**Fix.** Structural, not patched-around-the-edges:

1. Removed the redundant page-level redirect — middleware is now the sole authority on route protection.
2. Fixed `middleware.ts` to preserve refreshed session cookies on redirect responses (it had been dropping them by returning a bare `NextResponse.redirect()` instead of copying cookies from the working response).
3. Switched the dashboard from `getUser()` (network call) to `getSession()` (local JWT decode) — it only needs to read the email for display, not re-verify authentication.
4. Removed a stray `router.refresh()` after `router.push("/dashboard")` on the login page that was racing the navigation by re-fetching the stale `/login` route.

**Lesson, documented in `specs/CHANGELOG.md`.** Only one layer should make security decisions. Downstream layers should trust that decision and read session data locally, both because it's faster and because it removes an entire class of network-blip-induced failures.

### 5.2 RLS Policy Gap Silently Zeroing Writes

**Symptom.** Dashboards never incremented after a journal entry was saved. No error in logs, no error in the browser console. Total words stayed at 0; streaks stayed at 0.

**Root cause.** The `writing_streaks` table had RLS enabled with `SELECT` and `INSERT` policies, but **no `UPDATE` policy**. The streak update in `POST /api/entries` ran under the user's session via the anon-key server client (not the service-role key), so RLS applied — and silently affected zero rows.

The bug was almost philosophical: RLS is *supposed* to fail closed. The correct behavior for an unauthorized `UPDATE` is "affect zero rows, return no error." But because the operation was authorized in our intent (the user is updating their own row), the policy gap looked like a feature bug, not an auth bug.

**Fix.** Added an explicit policy: `CREATE POLICY "Users can update own writing streak" ON public.writing_streaks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`

**Lesson.** "SELECT works" doesn't imply "UPDATE works." Every table needs a deliberate audit of which row-modifying operations are intended, and an explicit policy for each. A test that just reads from a table doesn't catch this — it requires writing and then reading back.

### 5.3 Gemini Regional API Restriction

**Constraint.** Google's Gemini API is unreachable from Myanmar, the developer's region. This blocked direct testing of all three `/api/ai/*` routes (`/feedback`, `/guide`, `/draft`) throughout Phases 5–7.

**Approach.** Rather than block on access, I introduced a `MOCK_AI_RESPONSES=true` environment flag. Each AI route had an `if (process.env.MOCK_AI_RESPONSES === "true")` branch that returned hand-written fixture JSON shaped exactly like the real Gemini response — including the bilingual English + Myanmar fields. This enabled:

- Defensive parsing logic (markdown-fence stripping, JSON-from-conversational-preamble extraction, missing-field handling) to be implemented and unit-tested locally.
- The full UI (loading states, error states, the bilingual feedback panel rendering) to be verified end-to-end against deterministic data.
- The vocabulary-save flow to be exercised, since the save endpoint takes structured data from the AI suggestion card.

**Pre-deployment cleanup.** The mock branches were **physically deleted** in a single commit before deployment — not just disabled via env flag. The reasoning: a future env-var typo or accidentally-leaked dev config could otherwise silently return fake AI feedback to paying users. The `specs/DEPLOYMENT_CHECKLIST.md` flagged this as a discrete pre-deploy task to prevent it from being forgotten.

**Verification.** The Vercel deployment from US-East was the real test. The first POST to `/api/ai/feedback` against a real journal entry returned a real Gemini response with correct bilingual English + Myanmar fields. No fallback path because none existed any more.

---

## 6. Testing & Quality

The project has no automated test runner (a deliberate Phase 9 deferral, captured in `specs/CHANGELOG.md`). Quality assurance was handled through three complementary mechanisms:

### 6.1 Regression Checklist (`specs/REGRESSION_CHECKLIST.md`)

A manual end-to-end test checklist covering every user-facing flow built across Phases 2–8. Each item is a single observable behavior with a specific pass/fail criterion — no vague "test that it works" entries. The checklist is organized by feature area (Auth, Journal CRUD, Search, AI features, Vocabulary, Dashboard, Settings, Navigation) and includes the AI feedback panel's 6 distinct states (idle, loading, loaded-with-corrections, loaded-no-corrections, AI-disabled, generic error). This checklist is the primary verification gate for pre-deployment and post-deployment smoke tests.

### 6.2 Accessibility Audit (Phase 9)

A focused audit identified 6 critical and 10 high-priority accessibility gaps. The fixes shipped before deployment:

- **Mood selector color-blind accessibility** — selected pill now shows a `✓` mark in addition to the green background, so the selected state is distinguishable without relying on color alone.
- **Contrast sweep** — every interactive or meaningful use of `text-gray-400` (which fails WCAG AA at ~2.8:1 on white) was bumped to `text-gray-500` (4.83:1, passes AA). Decorative aria-hidden icons retain `gray-400`. The UI specification was updated to document this rule explicitly.
- **Screen reader support** — added `aria-label` to icon-only buttons (Trash, Logout, Settings), associated form labels with their inputs (the Mood Select via `aria-labelledby`, the SearchBar input via `aria-label`), and added `role="status" aria-live="polite"` to AI loading states and the vocabulary delete confirmation.
- **Loading and error boundaries** — added `loading.tsx` and `error.tsx` for the entire `(app)` route group, so server-rendered pages (dashboard, view entry, vocabulary) show skeleton placeholders during navigation instead of blank screens, and unhandled exceptions get a friendly error UI instead of Next.js's default crash page.

Three high-priority items (H6 focus-ring contrast, H7 mobile date input sizing, H8 tag input touch target) and the larger question of a client-side data-caching strategy (TanStack Query vs. the current per-navigation `useEffect` + `fetch` pattern) were explicitly deferred and recorded in `specs/CHANGELOG.md` so they wouldn't be silently forgotten.

### 6.3 Deployment Checklist (`specs/DEPLOYMENT_CHECKLIST.md`)

A comprehensive pre-deployment checklist organized into 5 sections: Environment & Secrets, Database & Auth, Code Cleanup, Documentation, Testing. It includes a "did I ship a footgun?" final pass that highlights three catastrophic-if-missed items: `MOCK_AI_RESPONSES` false in Vercel (don't serve fake AI), email confirmation re-enabled in Supabase (don't accept random signups), and the borrowed Gemini API key rotated (no surprise bill on someone else's account).

This checklist also surfaced the signup-flow bug that would have appeared the moment email confirmation was re-enabled: the existing signup page was calling `router.push("/dashboard")` after `signUp()`, assuming a session would always be present. With confirmation enabled, `signUp()` returns a user but no session, so the redirect would land on `/login` (via middleware) and the new account would appear broken. The fix was a single conditional branch on `data.session` — same code now works in both environments without an env check.

---

## 7. Reflection

### What Worked Well

**Specs as the source of truth.** The largest single leverage point in this project was investing in written specifications *before* writing code. When Claude generated something that disagreed with the spec, the spec won — no debate. When I needed to make a decision mid-implementation, I'd update the spec first, then ask Claude to implement against the new version. This kept verbal decisions from getting lost between sessions.

**Push-back when a symptom didn't match the code.** Twice during the build, I asked Claude to investigate reported issues that turned out to have no actual code cause — most notably an "intermittent navigation failure" that the codebase couldn't have produced. Claude pushed back with a clear "I can't reproduce this from the code; here are likelier causes and what to check," rather than inventing a fix. This was more useful than a confident-but-wrong patch would have been.

**Checklists as ship/defer gates.** The regression checklist, accessibility audit, and deployment checklist all served as explicit decision points: "is this ready, or am I deferring this?" The act of writing "deferred" next to an item — rather than silently leaving it broken — kept the project honest about what was actually production-quality vs. known-incomplete.

**MCP-driven database iteration.** Being able to verify schema, run migrations, and seed demo data through the same coding session — rather than context-switching to the Supabase dashboard — made the database half of the project move at roughly the same velocity as the frontend half. Without MCP, the schema work would have been the bottleneck.

### What Was Challenging

**Spec drift.** The specs aged faster than I updated them. The `POST /api/vocabulary` route emits seven validation error messages that the API spec never documented; the search route silently trims all query parameters in a way the spec doesn't describe. The test-writer subagent caught these on-demand, but a more systematic approach (automated diff between documented error strings and actual `jsonValidation()` calls) would catch the drift before it accumulates.

**Working around the Gemini regional restriction.** The mock-mode approach worked, but it created a parallel code path that had to be maintained, tested, and then carefully removed. The discipline of physically deleting the mock branches before deployment (rather than just turning off the env flag) was right, but it cost an extra commit and added a deployment-checklist item that wouldn't have existed if Gemini had been reachable.

**Trusting the AI vs. verifying it.** Claude is very good at sounding confident. The "intermittent navigation failure" was a moment where the right answer was "the code can't do that, please re-check your repro" rather than "let me find a fix." Building the habit of asking *why* Claude believed something — and pushing back when the answer didn't ground out in the codebase — was an ongoing discipline. The agent is a collaborator, not an oracle.

### What I'd Do Differently Next Time

**Set up a test runner from Phase 1.** Vitest or Jest, configured before any feature code. The current manual regression checklist is comprehensive, but it scales by linear human effort. Even a small executable test suite covering the response-envelope shape and the auth pattern would have caught the RLS-policy-gap bug automatically (a write-then-read test would have shown the write silently failed).

**Author the deployment checklist alongside Phase 1, not at the end.** Several Phase-10 items (rotating the borrowed Gemini key, removing mock mode, re-enabling email confirmation, writing a real README) were technically "remembered" via `specs/CHANGELOG.md` notes, but consolidating them into a single living checklist from day one — and treating it as a CI artifact, not a one-time document — would have reduced the risk of any single item being forgotten.

**Build the test-writer subagent earlier.** The subagent shipped in Phase 9. Its biggest value was surfacing spec/code drift — which means it would have been even more useful in Phases 3–6 when the routes were first being implemented. The same pattern applies to other domain-specific subagents (a "spec-updater" agent that watches for code changes and proposes spec updates, for example).

**Invest in automated drift detection.** The two-source-of-truth problem (spec + code) is fundamental to any spec-driven project. A small custom tool that parses `API_SPEC.md`'s error tables and compares them to `jsonValidation(...)` calls across routes would catch drift mechanically. This would be the natural next-iteration project.

---

**End of report.**
