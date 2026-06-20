# AI English Journal — Project Specification

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Target Users](#2-target-users)
3. [Features](#3-features)
4. [Tech Stack](#4-tech-stack)
5. [Architecture & Rules](#5-architecture--rules)
6. [Coding Conventions](#6-coding-conventions)
7. [API Response Format](#7-api-response-format)
8. [Environment Variables](#8-environment-variables)
9. [Database Schema](#9-database-schema)
10. [Folder Structure](#10-folder-structure)
11. [Project Phases](#11-project-phases)
12. [Status Tracker](#12-status-tracker)

---

## 1. Project Overview

**AI English Journal** is a web application that helps Myanmar English learners improve their writing through daily journaling, guided by an AI English teacher. Users write journal entries in English; the AI provides grammar corrections, vocabulary suggestions, and natural expression coaching — all without overwhelming the learner.

---

## 2. Target Users

- Myanmar nationals learning English at beginner-to-intermediate level
- Users who want a low-pressure, private space to practice writing daily
- Learners who benefit from simple, clear feedback rather than complex grammar rules
- People who struggle to know what to write and need guided prompts

---

## 3. Features

### 3.1 Authentication

- Sign up with email and password
- Log in and log out
- Session-based access; all protected routes require an authenticated session

### 3.2 Journal Entries

- Create a journal entry with:
  - Title
  - Date (defaults to today)
  - Body text
  - Mood (e.g., happy, sad, neutral, excited, tired)
  - Tags (e.g., "work", "family", "travel")
- Edit any existing entry
- Delete any entry (with confirmation)
- View a chronological list of past entries
- Search entries by keyword (title or body), date range, mood, or tag

### 3.3 AI English Teacher

The AI acts as a friendly English teacher. All AI interactions are scoped to the **current entry only** — the full journal history is never sent.

| Capability             | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| Grammar check          | Identify grammatical errors in the entry                            |
| Sentence correction    | Rewrite incorrect sentences naturally                               |
| Mistake explanation    | Explain each mistake in simple terms suitable for Myanmar learners  |
| Vocabulary suggestions | Suggest better or more natural word choices                         |
| Natural expressions    | Teach idiomatic English phrases relevant to the context             |
| Guided questions       | Ask the user targeted questions when they do not know what to write |
| Draft generation       | Create a journal draft from the user's answers to guided questions  |

### 3.4 Vocabulary Book

- Save new vocabulary words discovered during AI feedback
- Each saved word stores: word, definition, example sentence, date saved
- View and search the personal vocabulary list

### 3.5 Progress Tracking

- Writing streak (consecutive days with at least one entry)
- Total words written (cumulative across all entries)
- Common mistake patterns (aggregated from AI feedback history)
- Basic stats dashboard (streak, word count, entry count)

### 3.6 User Settings

- Toggle AI features on or off globally
- Option to keep all journals private (default: private)
- No social or sharing features in scope

---

## 4. Tech Stack

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| Frontend framework | Next.js `14.2.35` (App Router)                                   |
| Styling            | Tailwind CSS v3                                                  |
| UI components      | shadcn/ui v2.1.0 (style `new-york`, base color `zinc`)           |
| Backend            | Next.js API Routes (same repo)                                   |
| Database           | PostgreSQL via Supabase                                          |
| Authentication     | Supabase Auth (email + password)                                 |
| AI                 | Google Gemini API (`gemini-2.5-flash`)                           |
| Deployment         | Vercel                                                           |
| Version control    | GitHub                                                           |

### 4.1 Toolchain Notes

These are **intentional compatibility choices** made during project setup. Do not "fix" them in future sessions — they are pinned together for a reason.

- **Tailwind v3, not v4.** shadcn/ui v2.x is built against Tailwind v3 (`@tailwind base/components/utilities` directives, classic `tailwind.config.ts`). The current `shadcn@latest` CLI requires Tailwind v4 and is incompatible with this setup. Stay on shadcn `2.x` and Tailwind v3 unless the whole stack is migrated together.
- **shadcn/ui v2.1.0 with brand-green overrides.** Initialized with `style: new-york`, `baseColor: zinc`, CSS variables enabled. The default `--primary` and `--ring` in `app/globals.css` are overridden to the brand green from `UI_SPEC.md` — `oklch(0.627 0.194 149.214)` (≈ `green-600`) for light, `oklch(0.696 0.198 149.521)` (≈ `green-500`) for dark. `--primary-foreground` is white for legible button labels. Keep these overrides in place; do not revert to zinc.
- **`next.config.mjs`, not `.ts`.** TypeScript Next config (`next.config.ts`) requires Next.js 15+. We are on Next 14, so config stays as `.mjs`.
- **No `public/` folder yet.** Next 14's `create-next-app` does not generate one by default. Create it the first time a static asset (favicon, image, etc.) needs to be added; its absence is not a missing-file bug.

---

## 5. Architecture & Rules

These rules are non-negotiable and must be enforced in every API route and AI integration.

### 5.1 Security

- **Session verification first**: Every API route must authenticate the user session before executing any logic. Return `401` immediately if no valid session exists.
- **Data isolation**: A user must never receive another user's journal entries. All database queries must include `WHERE user_id = <authenticated_user_id>`.
- **No cross-user AI context**: AI calls must only include the current entry being analyzed. Never send multiple entries or the full journal history to the AI.

### 5.2 AI Constraints

- AI features can be toggled off per user in their settings. When AI is off, all AI endpoints must return a clear error message without calling the Gemini API.
- Maximum **1500 tokens** per AI request to control costs. Truncate entry content on the server before sending if needed.
- AI responses are never stored raw; only structured feedback (corrections, suggestions) is persisted.

### 5.3 Privacy

- All journal entries are private by default. There is no public sharing mechanism.
- The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is used server-side only and must never be exposed to the client.

---

## 6. Coding Conventions

| Target                | Convention                           | Example                                |
| --------------------- | ------------------------------------ | -------------------------------------- |
| Database table names  | `snake_case`                         | `journal_entries`, `saved_words`       |
| File names            | `kebab-case`                         | `journal-editor.tsx`, `use-journal.ts` |
| React components      | `PascalCase`                         | `JournalEditor`, `MoodSelector`        |
| Functions & variables | `camelCase`                          | `getEntryById`, `handleSubmit`         |
| Constants             | `SCREAMING_SNAKE_CASE`               | `MAX_AI_TOKENS`                        |
| API route files       | `route.ts` inside kebab-case folders | `app/api/entries/[id]/route.ts`        |

---

## 7. API Response Format

Every API route must return a response in this exact shape:

```ts
// Success
{
  success: true,
  data: {} | [] | null,
  error: null
}

// Failure
{
  success: false,
  data: null,
  error: "Human-readable error message"
}
```

HTTP status codes must also be set correctly (`200`, `201`, `400`, `401`, `403`, `404`, `500`).

---

## 8. Environment Variables

These variables must be present in `.env.local` for local development and configured as environment variables in Vercel for production.

| Variable                        | Scope           | Description                                                                          |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client + Server | Supabase project URL                                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous (public) key                                                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only     | Supabase service role key — bypasses Row Level Security. Never expose to the client. |
| `GEMINI_API_KEY`                | Server only     | Google Gemini API key for AI features                                                |

**`.env.local` template:**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

---

## 9. Database Schema

All tables use `snake_case` naming. All tables include `created_at` and `updated_at` timestamps.

### `users` (managed by Supabase Auth)

Supabase Auth creates and manages the `auth.users` table. A separate `public.profiles` table stores app-specific user data.

### `profiles`

```sql
id            uuid  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
ai_enabled    boolean  DEFAULT true
created_at    timestamptz  DEFAULT now()
updated_at    timestamptz  DEFAULT now()
```

### `journal_entries`

```sql
id            uuid  PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
title         text  NOT NULL
body          text  NOT NULL
entry_date    date  NOT NULL DEFAULT CURRENT_DATE
mood          text  -- e.g. 'happy', 'sad', 'neutral', 'excited', 'tired'
tags          text[]  DEFAULT '{}'
word_count    integer  DEFAULT 0
created_at    timestamptz  DEFAULT now()
updated_at    timestamptz  DEFAULT now()
```

### `ai_feedback`

Stores structured AI feedback linked to a specific entry.

```sql
id            uuid  PRIMARY KEY DEFAULT gen_random_uuid()
entry_id      uuid  NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE
user_id       uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
corrections   jsonb  -- array of { original, corrected, explanation }
suggestions   jsonb  -- array of { type, original, suggestion, reason }
created_at    timestamptz  DEFAULT now()
```

### `saved_words`

```sql
id              uuid  PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
word            text  NOT NULL
definition      text
example_sentence text
source_entry_id uuid  REFERENCES journal_entries(id) ON DELETE SET NULL
created_at      timestamptz  DEFAULT now()
```

### `writing_streaks`

```sql
id              uuid  PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid  NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE
current_streak  integer  DEFAULT 0
longest_streak  integer  DEFAULT 0
last_entry_date date
total_words     integer  DEFAULT 0
total_entries   integer  DEFAULT 0
updated_at      timestamptz  DEFAULT now()
```

---

## 10. Folder Structure

```
ai-english-journal/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout header)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (app)/                    # Protected route group
│   │   ├── layout.tsx            # Main app layout with nav
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Stats, streak, recent entries
│   │   ├── journal/
│   │   │   ├── page.tsx          # Journal list + search
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # New entry form
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # View entry + AI feedback
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit entry form
│   │   ├── vocabulary/
│   │   │   └── page.tsx          # Saved words list
│   │   └── settings/
│   │       └── page.tsx          # User settings
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── route.ts
│   │   ├── entries/
│   │   │   ├── route.ts          # GET list, POST create
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, PUT, DELETE single entry
│   │   ├── ai/
│   │   │   ├── feedback/
│   │   │   │   └── route.ts      # POST: grammar check + suggestions
│   │   │   ├── guide/
│   │   │   │   └── route.ts      # POST: guided questions
│   │   │   └── draft/
│   │   │       └── route.ts      # POST: draft from answers
│   │   ├── vocabulary/
│   │   │   ├── route.ts          # GET list, POST save word
│   │   │   └── [id]/
│   │   │       └── route.ts      # DELETE saved word
│   │   └── settings/
│   │       └── route.ts          # GET, PUT user settings
│   ├── globals.css
│   └── layout.tsx                # Root layout
│
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui generated components
│   ├── journal/
│   │   ├── JournalEditor.tsx
│   │   ├── JournalCard.tsx
│   │   ├── JournalList.tsx
│   │   ├── MoodSelector.tsx
│   │   ├── TagInput.tsx
│   │   └── SearchBar.tsx
│   ├── ai/
│   │   ├── AiFeedbackPanel.tsx
│   │   ├── CorrectionCard.tsx
│   │   ├── GuidedQuestions.tsx
│   │   └── DraftGenerator.tsx
│   ├── vocabulary/
│   │   ├── WordCard.tsx
│   │   └── VocabularyList.tsx
│   ├── dashboard/
│   │   ├── StreakCard.tsx
│   │   └── StatsCard.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
│
├── lib/                          # Utility and service modules
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server-side Supabase client
│   ├── gemini/
│   │   ├── client.ts             # Gemini API client setup
│   │   └── prompts.ts            # All AI prompt templates
│   ├── utils/
│   │   ├── api.ts                # API response helper (formatResponse)
│   │   ├── auth.ts               # Session verification helper
│   │   └── word-count.ts
│   └── constants.ts              # App-wide constants (MAX_AI_TOKENS, etc.)
│
├── hooks/                        # Custom React hooks
│   ├── use-journal.ts
│   ├── use-ai-feedback.ts
│   └── use-auth.ts
│
├── types/                        # TypeScript type definitions
│   ├── journal.ts
│   ├── ai.ts
│   └── database.ts               # Generated or manual DB types
│
├── docs/                         # Project documentation
│   └── PROJECT_SPEC.md           # This file
│
├── specs/                        # Feature specs and wireframes
│
├── .env.local                    # Local environment variables (gitignored)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json               # shadcn/ui config
└── package.json
```

---

## 11. Project Phases

### Phase 1 — Project Setup

- Initialize Next.js 14 project with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Set up Supabase project (database + auth)
- Create `.env.local` with all required variables
- Set up GitHub repository and connect to Vercel
- Configure Supabase Row Level Security (RLS) policies

**Deliverable:** App runs locally at `localhost:3000`. Supabase project is live.

---

### Phase 2 — Authentication

- Implement sign up page (email + password)
- Implement log in page
- Implement log out
- Set up Supabase Auth session helpers for both client and server
- Protect all `/(app)` routes; redirect unauthenticated users to `/login`
- Create `profiles` row automatically on user sign up (via Supabase trigger)

**Deliverable:** Users can create accounts and log in/out. Unauthenticated users cannot access the app.

---

### Phase 3 — Journal CRUD

- Create journal entry form (title, body, date, mood, tags)
- Implement create, read, update, delete API routes for entries
- Journal list page with entries sorted by date
- Individual entry view page
- Edit entry page
- Delete confirmation dialog
- Word count calculated and stored on save

**Deliverable:** Full journal CRUD working end-to-end with data stored in Supabase.

---

### Phase 4 — Search & Filtering

- Keyword search across title and body (Supabase full-text search or `ilike`)
- Filter by date range
- Filter by mood
- Filter by tag

**Deliverable:** Users can find past entries easily.

---

### Phase 5 — AI English Teacher

- Set up Gemini API client
- Build AI feedback endpoint (grammar check, corrections, vocabulary, expressions)
- Build guided questions endpoint (for when users don't know what to write)
- Build draft generation endpoint (from user's answers)
- AI feedback panel component displayed on the entry view page
- Save AI feedback to `ai_feedback` table
- Respect `ai_enabled` setting per user — gate all AI endpoints

**Deliverable:** AI feedback is displayed on journal entries. Guided journaling flow works.

---

### Phase 6 — Vocabulary Book

- Save word button on AI feedback panel
- Vocabulary list page
- Delete saved word
- Search vocabulary list

**Deliverable:** Users can build and review their personal word list.

---

### Phase 7 — Progress Tracking

- Dashboard page with:
  - Current writing streak
  - Longest streak
  - Total words written
  - Total entries
- Streak updated automatically when a new entry is saved
- Common mistake patterns displayed (derived from `ai_feedback` data)

**Deliverable:** Users see motivating progress stats on their dashboard.

---

### Phase 8 — Settings

- Settings page: toggle AI on/off
- PUT `/api/settings` updates the `profiles` table
- Settings respected across all AI endpoints

**Deliverable:** Users have control over AI features.

---

### Phase 9 — Polish & Testing

- Responsive design review (mobile + desktop)
- Loading and error states for all async operations
- Empty states (first entry prompt, empty vocabulary, etc.)
- Basic accessibility review (keyboard navigation, ARIA labels)
- Manual end-to-end testing of all user flows

**Deliverable:** App is polished, stable, and handles edge cases gracefully.

---

### Phase 10 — Deployment

- Configure all environment variables in Vercel
- Deploy to Vercel from GitHub `main` branch
- Verify production build works
- Test authentication, journal CRUD, and AI features in production
- Set up Supabase production database (if using a separate project)
- **Re-enable email confirmation in Supabase Auth settings before going live** (see `specs/CHANGELOG.md` 2026-06-20 — the toggle was turned off for local dev). Path: Supabase Dashboard → Authentication → Providers → Email → Confirm email.

**Deliverable:** App is live on a public Vercel URL.

---

## 12. Status Tracker

| Phase    | Description        | Status      |
| -------- | ------------------ | ----------- |
| Phase 1  | Project Setup      | Complete    |
| Phase 2  | Authentication     | Complete    |
| Phase 3  | Journal CRUD       | Complete    |
| Phase 4  | Search & Filtering | In Progress |
| Phase 5  | AI English Teacher | Not Started |
| Phase 6  | Vocabulary Book    | Not Started |
| Phase 7  | Progress Tracking  | Not Started |
| Phase 8  | Settings           | Not Started |
| Phase 9  | Polish & Testing   | Not Started |
| Phase 10 | Deployment         | Not Started |

> Update this table as phases are completed. Use: `Not Started` → `In Progress` → `Complete`.
