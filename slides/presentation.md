---
marp: true
theme: gaia
paginate: true
size: 16:9
---

## AI English Journal

**Bilingual AI-powered journaling for Myanmar English learners**

The problem:

- **Journaling apps don't teach.** Day One, Notion, Apple Journal — none give you feedback on your English. You write, no one reads, no one helps you improve.
- **AI tutors don't journal.** Duolingo, ChatGPT — designed for drills and Q&A, not for the daily reflective writing that actually builds fluency.
- **Myanmar learners hit a wall.** English-only grammar explanations assume you already understand the meta-language. A learner who doesn't know what *"past tense"* or *"gerund"* means in English can't learn from feedback written in English.

This project is the gap in the middle: a daily writing habit + an AI English teacher that explains in **both languages**.

---

## Core Features

- **Daily journaling** — title, body, mood (😊😢😐🤩😴), tags, date
- **Bilingual AI grammar feedback** — corrections explained in English first (the target language), then in Myanmar (မြန်မာ) directly beneath as a comprehension safety net
- **Vocabulary suggestions** — better word choices and natural expressions, also bilingual
- **Guided questions** — when you don't know what to write, the AI generates 3–5 prompts; your answers become an AI-drafted entry you edit and save
- **Personal vocabulary book** — save words from AI suggestions with bilingual definitions and example sentences
- **Streak tracking** — current streak, longest streak, total words, total entries
- **Privacy controls** — AI features can be toggled off; every AI endpoint checks the flag before any external call, so users in control of their cost and their data

---

## Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Next.js API Routes (same repo)
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security + Supabase Auth)
- **AI:** Google Gemini API (`gemini-2.5-flash`)
- **Hosting:** Vercel

**How it fits together:** the browser talks to Next.js API routes; routes verify the session via Supabase Auth, query the database scoped to the authenticated user, and — for AI features — forward the current entry's body to Gemini and persist the structured response. Row Level Security is the second wall: even if app-layer filters were missed, the database would refuse to return another user's data.

---

## MCP, Skill, and Agent

**Supabase MCP** — direct database access from the AI coding session:

- Verified schema, ran migrations, inspected RLS policies live
- Inserted demo-account data and updated `writing_streaks` directly when seeding production for screenshots

**Custom Skill** (`.claude/SKILL.md`) — the project's non-negotiables, loaded into every session:

- Security rules (auth-first, `user_id` always scoped, return 404 not 403 for cross-user)
- API response envelope, file/folder conventions, color tokens
- A pre-coding checklist the AI works through before writing any new file

**Custom Agent** (`test-writer` subagent) — generates test checklists from a route file + `docs/API_SPEC.md`:

- Output drops into `specs/REGRESSION_CHECKLIST.md` style — no reformat needed
- Cross-checks code against spec and surfaces drift (e.g., undocumented 400 messages the route emits)

---

## Real Engineering Challenges

Three concrete bugs and constraints, honestly named:

- **Infinite redirect loop between middleware and dashboard.** Two layers each made auth decisions. A transient Supabase blip caused the page to disagree with middleware, bouncing the user until React threw *"Maximum update depth exceeded."* Fix: make middleware the single source of truth; page reads session locally without re-verifying.

- **RLS policy gap silently zeroing writes.** `writing_streaks` had a `SELECT` policy but no `UPDATE` policy. Updates ran under the user's session, hit RLS, affected zero rows — no error, no warning, just dashboards that never incremented. Fix: explicit `UPDATE` policy. Lesson: RLS failing closed is correct; *"select works"* doesn't imply *"update works."*

- **Gemini regional API restriction.** Gemini was unreachable from Myanmar throughout the build. Solution: develop against a `MOCK_AI_RESPONSES` env flag that returned deterministic fixture JSON shaped like the real response. Removed the mock branches as deliberate pre-deployment cleanup; the Vercel deploy from US-East was the verification step — real Gemini worked on the first request, with no fallback path because none existed any more.

---

## What I Learned & Live Demo

**Spec-driven development with AI coding agents.** Writing the specs *first* — `PROJECT_SPEC.md`, `API_SPEC.md`, `DATABASE_SPEC.md`, `UI_SPEC.md` — was the single biggest leverage point. When the agent drifted, the spec was what I pointed at. Stale specs lie, though: a working `specs/CHANGELOG.md` next to the code kept the drift visible.

**Real bugs need real tracing, not guessing.** The redirect loop, the RLS gap, and a reported "intermittent navigation failure" all looked similar at first glance. Two were real and structural; one was a misread that the code couldn't actually cause. Pushing back when the symptom doesn't match the code mattered more than rushing to "fix" something.

**Live demo**

🔗 **https://vct-ai-english-journal.vercel.app/**

Demo account pre-loaded with a 7-day streak, sample entries, and saved vocabulary.

**Thank you — questions?**
