# AI English Journal — Project Skill File

> Read this before writing any code. Estimated read time: 2 minutes.

---

## 1. Project Summary

**AI English Journal** is a private journaling app for Myanmar English learners. Users write daily journal entries in English; an AI English teacher (Google Gemini) provides grammar corrections, vocabulary suggestions, and guided writing prompts. All entries are private and the AI can be toggled off per user.

**Tech stack:** Next.js 14 (App Router) · Tailwind CSS · shadcn/ui · Supabase (PostgreSQL + Auth) · Google Gemini API (`gemini-2.5-flash`) · Vercel

---

## 2. Critical Rules

These are non-negotiable. Every piece of code must follow them.

### Security
- **Every API route verifies the session first** — before any DB query, before any validation, before anything.
- **Every DB query scopes to the authenticated user** — always include `WHERE user_id = <session_user_id>`. Never trust a user-supplied ID alone.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only. Never reference it in client components or expose it in responses.
- Return `404` (not `403`) when a resource exists but belongs to another user — never confirm existence to unauthorized callers.

### API Response Format
Every route returns this exact shape. No exceptions.
```ts
// Success
{ success: true,  data: {} | [] | null, error: null }
// Failure
{ success: false, data: null, error: "Human-readable message" }
```

### Auth Verification Pattern
```ts
// First lines of every API route handler:
const supabase = createServerClient()
const { data: { user }, error } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 })
```

### AI Cost Control
- Max **1500 tokens** per Gemini request — truncate `body` server-side before sending.
- Check `profiles.ai_enabled = true` before every Gemini call. Return `403` if false.
- Send only the **current entry's body** — never journal history, never multiple entries.
- Rate limit: 10 AI requests per user per hour.

### Data Isolation
- Every `journal_entries` query: `WHERE user_id = user.id`
- Every `ai_feedback` query: `WHERE user_id = user.id`
- Every `saved_words` query: `WHERE user_id = user.id`
- Never accept an entry/word ID from the request without re-verifying ownership in the DB.

---

## 3. Database Quick Reference

**All tables are in the `public` schema. All names are `snake_case`.**

| Table | Purpose |
|-------|---------|
| `profiles` | App settings per user (1-to-1 with auth.users). Has `ai_enabled` boolean. |
| `journal_entries` | Core table. One row per journal entry. Has title, body, mood, tags, word_count. |
| `ai_feedback` | Immutable AI results per entry. JSONB `corrections` and `suggestions` arrays. |
| `saved_words` | User's personal vocabulary book. One row per saved word. |
| `writing_streaks` | Pre-computed stats (streak, total words, total entries). One row per user. |

### Allowed Mood Values (enforced by CHECK constraint)
```
'happy' | 'sad' | 'neutral' | 'excited' | 'tired'
```
`mood` is nullable — users are not required to set one.

### Key Foreign Keys
```
profiles.id               → auth.users.id   (CASCADE DELETE)
journal_entries.user_id   → auth.users.id   (CASCADE DELETE)
ai_feedback.entry_id      → journal_entries.id (CASCADE DELETE)
ai_feedback.user_id       → auth.users.id   (CASCADE DELETE)
saved_words.user_id       → auth.users.id   (CASCADE DELETE)
saved_words.source_entry_id → journal_entries.id (SET NULL on delete)
writing_streaks.user_id   → auth.users.id   (CASCADE DELETE, UNIQUE)
```

### Auto-Created on Signup
A Supabase trigger (`on_auth_user_created`) auto-inserts rows into `profiles` and `writing_streaks` for every new user. Never manually create these rows in code.

### JSONB Shapes
```ts
// ai_feedback.corrections
[{ original: string, corrected: string, explanation: string }]

// ai_feedback.suggestions
[{ type: "vocabulary"|"expression", original: string, suggestion: string, reason: string }]
```

---

## 4. API Quick Reference

Base path: `/api`. All routes require auth except `GET /api/auth/session`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/session` | Current session user (no auth required) |
| `GET` | `/api/entries` | List all entries (no body field) |
| `POST` | `/api/entries` | Create entry — also updates writing_streaks |
| `GET` | `/api/entries/[id]` | Single entry with full body |
| `PUT` | `/api/entries/[id]` | Partial update — recalculates word_count if body changes |
| `DELETE` | `/api/entries/[id]` | Delete entry (DB cascades ai_feedback, nulls saved_words.source_entry_id) |
| `GET` | `/api/entries/search` | Search/filter: `?q=&from=&to=&mood=&tag=` |
| `POST` | `/api/ai/feedback` | Grammar check + suggestions → saves to ai_feedback |
| `POST` | `/api/ai/guide` | Get 3–5 guided writing questions |
| `POST` | `/api/ai/draft` | Generate draft from Q&A answers |
| `GET` | `/api/vocabulary` | List saved words (`?q=` for search) |
| `POST` | `/api/vocabulary` | Save a word (data comes from client, no new AI call) |
| `DELETE` | `/api/vocabulary/[id]` | Delete saved word |
| `GET` | `/api/stats` | Streak + cumulative stats from writing_streaks |
| `GET` | `/api/settings` | Get user's ai_enabled setting |
| `PUT` | `/api/settings` | Update ai_enabled |

---

## 5. UI Quick Reference

### Always Use These Color Tokens

| Role | Tailwind Class | When |
|------|---------------|------|
| Primary action | `bg-green-600 hover:bg-green-700 text-white` | Main buttons |
| Selected state | `bg-green-100 border-green-600 text-green-800` | Mood pills, active nav |
| Page background | `bg-gray-50` | Page wrapper |
| Card surface | `bg-white border border-gray-200 rounded-xl shadow-sm` | All cards |
| Body text | `text-gray-700` | Paragraph text |
| Secondary text | `text-gray-500 text-sm` | Metadata, captions |
| Headings | `text-gray-900 font-bold` (h1) / `font-semibold` (h2+) | Titles |
| Error | `bg-red-50 text-red-600 border-red-200` | Error alerts |
| Tag badge | `bg-green-100 text-green-800 text-xs rounded-full px-2 py-0.5` | Tags on entries |
| AI panel bg | `bg-green-50 border border-green-200 rounded-xl` | AI feedback panel |

### Component Map

| Component | File location | Used on |
|-----------|--------------|---------|
| `JournalCard` | `components/journal/JournalCard.tsx` | Journal list, Dashboard |
| `MoodSelector` | `components/journal/MoodSelector.tsx` | New Entry, Edit Entry |
| `TagInput` | `components/journal/TagInput.tsx` | New Entry, Edit Entry |
| `SearchBar` | `components/journal/SearchBar.tsx` | Journal list, Vocabulary |
| `AiFeedbackPanel` | `components/ai/AiFeedbackPanel.tsx` | View Entry, New Entry |
| `CorrectionCard` | `components/ai/CorrectionCard.tsx` | Inside AiFeedbackPanel |
| `SuggestionCard` | `components/ai/SuggestionCard.tsx` | Inside AiFeedbackPanel |
| `GuidedQuestions` | `components/ai/GuidedQuestions.tsx` | New Entry |
| `DraftGenerator` | `components/ai/DraftGenerator.tsx` | New Entry |
| `WordCard` | `components/vocabulary/WordCard.tsx` | Vocabulary page |
| `StatsCard` | `components/dashboard/StatsCard.tsx` | Dashboard |
| `StreakCard` | `components/dashboard/StreakCard.tsx` | Dashboard |
| `EmptyState` | `components/shared/EmptyState.tsx` | All pages |
| `LoadingSpinner` | `components/shared/LoadingSpinner.tsx` | Async states |
| `Navbar` | `components/shared/Navbar.tsx` | `(app)/layout.tsx` |

### Typography Classes
```
Page title (h1):    text-3xl font-bold text-gray-900
Section heading:    text-2xl font-semibold text-gray-900
Card title:         text-xl font-semibold text-gray-800
Journal body:       text-base leading-7 text-gray-700
Metadata / small:   text-sm text-gray-500
Timestamps / tiny:  text-xs text-gray-400
Links:              text-sm font-medium text-green-600 hover:underline
```

---

## 6. Code Patterns

### API Route Template
```ts
// app/api/entries/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // 1. ALWAYS verify session first
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, data: null, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 2. Query with user_id filter — ALWAYS scope to authenticated user
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, title, entry_date, mood, tags, word_count, created_at, updated_at')
    .eq('user_id', user.id)           // <-- never omit this
    .order('entry_date', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }

  // 3. Return standard envelope
  return NextResponse.json({ success: true, data, error: null })
}
```

### Gemini API Call Pattern
```ts
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// In an API route — always truncate first, always check ai_enabled first
const MAX_AI_TOKENS = 1500
const APPROX_CHARS_PER_TOKEN = 4

async function callGeminiFeedback(userId: string, entryBody: string) {
  // Check ai_enabled
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_enabled')
    .eq('id', userId)
    .single()

  if (!profile?.ai_enabled) {
    return NextResponse.json(
      { success: false, data: null, error: 'AI features are disabled. Enable them in Settings.' },
      { status: 403 }
    )
  }

  // Truncate body to token limit
  const truncated = entryBody.slice(0, MAX_AI_TOKENS * APPROX_CHARS_PER_TOKEN)

  const prompt = `You are a friendly English teacher helping a Myanmar learner.
Analyze this journal entry for grammar mistakes and vocabulary.
Entry: ${truncated}
Return JSON with this shape: { corrections: [...], suggestions: [...] }`

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text)
}
```

### Safe Supabase Query Pattern
```ts
// Always: select only needed columns, filter by user_id, handle error
const { data: entry, error } = await supabase
  .from('journal_entries')
  .select('id, title, body, entry_date, mood, tags, word_count')
  .eq('id', entryId)          // from URL params
  .eq('user_id', user.id)     // ownership check — NEVER skip this
  .single()

if (error || !entry) {
  return NextResponse.json(
    { success: false, data: null, error: 'Entry not found' },
    { status: 404 }
  )
}
// At this point, entry is guaranteed to belong to user.id
```

### Streak Update Pattern
```ts
// Called inside POST /api/entries after saving the new entry
async function updateStreak(userId: string, wordCount: number, entryDate: string) {
  const { data: streak } = await supabase
    .from('writing_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  const today = entryDate
  const yesterday = /* today - 1 day */

  let newStreak = 1
  if (streak.last_entry_date === yesterday) newStreak = streak.current_streak + 1
  if (streak.last_entry_date === today) newStreak = streak.current_streak // already counted

  await supabase
    .from('writing_streaks')
    .update({
      current_streak:  newStreak,
      longest_streak:  Math.max(newStreak, streak.longest_streak),
      last_entry_date: today,
      total_words:     streak.total_words + wordCount,
      total_entries:   streak.total_entries + 1,
    })
    .eq('user_id', userId)
}
```

---

## 7. File Creation Rules

### Where to Put New Files

| What you're creating | Where it goes |
|---------------------|--------------|
| A page | `app/(app)/<route>/page.tsx` or `app/(auth)/<route>/page.tsx` |
| An API route | `app/api/<feature>/route.ts` or `app/api/<feature>/[id]/route.ts` |
| A React component | `components/<feature>/ComponentName.tsx` |
| A shared/generic component | `components/shared/ComponentName.tsx` |
| A custom hook | `hooks/use-<feature>.ts` |
| A Supabase helper | `lib/supabase/client.ts` (browser) or `lib/supabase/server.ts` (server) |
| A Gemini helper | `lib/gemini/client.ts` or `lib/gemini/prompts.ts` |
| A utility function | `lib/utils/<name>.ts` |
| A TypeScript type | `types/<domain>.ts` |
| App-wide constants | `lib/constants.ts` |

### Naming Conventions

| Target | Convention | Example |
|--------|-----------|---------|
| Files | `kebab-case` | `journal-editor.tsx`, `use-journal.ts` |
| React components | `PascalCase` | `JournalEditor`, `AiFeedbackPanel` |
| Functions & variables | `camelCase` | `getEntryById`, `handleSubmit` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_AI_TOKENS = 1500` |
| DB table names | `snake_case` | `journal_entries`, `saved_words` |
| API route files | always `route.ts` | `app/api/entries/[id]/route.ts` |

---

## 8. Before You Write Any Code

Work through this checklist mentally before generating any file:

- [ ] **Is this an API route?** → Does it verify session in the first 3 lines?
- [ ] **Does it query the DB?** → Is `user_id = user.id` in every query that touches user data?
- [ ] **Does it call Gemini?** → Does it check `ai_enabled` first? Does it truncate to 1500 tokens?
- [ ] **Does it return JSON?** → Is it using `{ success, data, error }` format with correct HTTP status?
- [ ] **Is it a new file?** → Is the file name `kebab-case`? Is the component name `PascalCase`?
- [ ] **Is it a new component?** → Does it go in the right `components/<feature>/` folder?
- [ ] **Does it use color?** → Is it using the design system tokens (green-600, gray-700, etc.) not arbitrary values?
- [ ] **Is it deleting data?** → Is ownership verified before the delete (fetch first, check user_id, then delete)?
- [ ] **Does it handle mood?** → Is the value one of: `happy | sad | neutral | excited | tired`?
- [ ] **Is it a new DB table or column?** → Is the name `snake_case`? Does it cascade correctly from `auth.users`?
