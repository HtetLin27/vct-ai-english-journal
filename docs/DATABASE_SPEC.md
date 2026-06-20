# AI English Journal — Database Specification

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Relationships](#2-entity-relationships)
3. [Shared Utilities](#3-shared-utilities)
4. [Table: profiles](#4-table-profiles)
5. [Table: journal_entries](#5-table-journal_entries)
6. [Table: ai_feedback](#6-table-ai_feedback)
7. [Table: saved_words](#7-table-saved_words)
8. [Table: writing_streaks](#8-table-writing_streaks)
9. [Signup Trigger](#9-signup-trigger)
10. [Full Execution Script](#10-full-execution-script)
11. [Security Hardening](#11-security-hardening)

---

## 1. Overview

- Database: PostgreSQL (hosted on Supabase)
- All table names: `snake_case`
- All timestamps: `timestamptz` (timezone-aware)
- Primary keys: `uuid` generated with `gen_random_uuid()`
- Auth is managed by Supabase in the `auth` schema. Application data lives in the `public` schema.
- Row Level Security (RLS) is enabled on every table as a defense-in-depth measure. All write operations in this app go through Next.js API routes using the `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. RLS policies protect against any direct client-side access using the anon key.

---

## 2. Entity Relationships

```
auth.users (Supabase managed)
    │
    ├── profiles          (1-to-1)   one profile per user
    ├── journal_entries   (1-to-many) a user has many entries
    ├── saved_words       (1-to-many) a user saves many words
    └── writing_streaks   (1-to-1)   one streak record per user

journal_entries
    │
    ├── ai_feedback       (1-to-many) an entry can have many feedback records
    └── saved_words       (many-to-1) a saved word may reference the entry it came from
```

**Key rules enforced at the database level:**

- All foreign keys to `auth.users` use `ON DELETE CASCADE` — deleting a user removes all their data.
- `ai_feedback` cascades on entry deletion — deleting a journal entry removes its feedback.
- `saved_words.source_entry_id` uses `ON DELETE SET NULL` — deleting an entry does not delete the saved word, it just removes the source reference.

---

## 3. Shared Utilities

### 3.1 updated_at Auto-Update Function

This function is reused by triggers on any table that has an `updated_at` column.

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

## 4. Table: `profiles`

### Why it exists

Supabase Auth manages `auth.users` and only stores authentication data (email, password hash, etc.). The `profiles` table stores application-specific user settings. It has a 1-to-1 relationship with `auth.users`, using the same `id`.

### CREATE TABLE

```sql
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled  boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### Indexes

No additional indexes are needed. The primary key (`id`) is already indexed and is the only column ever used in a `WHERE` clause for this table (always queried as `WHERE id = auth.uid()`).

### updated_at Trigger

```sql
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### Row Level Security

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user can only read their own profile.
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- A user can only update their own profile.
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT is handled exclusively by the signup trigger (SECURITY DEFINER),
-- which runs with elevated privileges and bypasses RLS. No user INSERT policy needed.
```

---

## 5. Table: `journal_entries`

### Why it exists

The core table of the app. Stores every journal entry a user writes. One user can have many entries. The `mood` column is constrained to exactly five allowed values to ensure data consistency across the application.

### CREATE TABLE

```sql
CREATE TABLE public.journal_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  body        text        NOT NULL,
  entry_date  date        NOT NULL DEFAULT CURRENT_DATE,
  mood        text        CHECK (mood IN ('happy', 'sad', 'neutral', 'excited', 'tired')),
  tags        text[]      NOT NULL DEFAULT '{}',
  word_count  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**Notes:**
- `mood` is nullable — users are not required to set a mood.
- `tags` stores an array of plain text strings (e.g., `'{work, family}'`).
- `word_count` is calculated server-side before insert/update and stored for efficient stats queries.

### Indexes

```sql
-- Used on every query: all entry fetches filter by user first.
CREATE INDEX idx_journal_entries_user_id
  ON public.journal_entries (user_id);

-- Used for the journal history list, which is sorted newest-first per user.
CREATE INDEX idx_journal_entries_user_id_entry_date
  ON public.journal_entries (user_id, entry_date DESC);

-- Used for mood filter on the journal list page.
CREATE INDEX idx_journal_entries_user_id_mood
  ON public.journal_entries (user_id, mood);

-- Used for tag filter: GIN index supports the @> (contains) operator on arrays.
CREATE INDEX idx_journal_entries_tags
  ON public.journal_entries USING GIN (tags);

-- Used for keyword search across title and body.
-- to_tsvector generates a searchable document from both columns.
-- Queries use: WHERE to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', ?)
CREATE INDEX idx_journal_entries_fts
  ON public.journal_entries
  USING GIN (to_tsvector('english', title || ' ' || body));
```

### updated_at Trigger

```sql
CREATE TRIGGER journal_entries_set_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### Full-Text Search Computed Column (`fts_doc`)

```sql
CREATE OR REPLACE FUNCTION public.fts_doc(public.journal_entries)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT to_tsvector('english', $1.title || ' ' || $1.body)
$$;
```

**Why it exists.** The search endpoint (`GET /api/entries/search`) needs to issue the predicate `to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', q)`. Supabase's PostgREST `.textSearch()` method only accepts a column or function name as its target — it cannot operate on a raw SQL expression. Adding this single-argument table-row function lets PostgREST expose `fts_doc` as a virtual column on `journal_entries`, so the route can call `.textSearch('fts_doc', q, { type: 'plain', config: 'english' })`.

**Why it reuses the existing index.** The function body is the exact expression that `idx_journal_entries_fts` was built on (`to_tsvector('english', title || ' ' || body)`). Postgres recognizes the equivalent expression at plan time and uses the GIN index via a `Bitmap Index Scan`, so this approach adds no storage overhead and no new index — verified with `EXPLAIN` after the migration. The alternative (adding a generated stored `tsvector` column and reindexing) would have worked too but at the cost of an extra column per row.

**Properties.** `IMMUTABLE` lets the planner pre-evaluate the expression and match the functional index. `PARALLEL SAFE` allows the planner to use parallel workers if it chooses. Both are required for the index match to fire reliably.

### Row Level Security

```sql
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- A user can only read their own entries.
CREATE POLICY "Users can view own entries"
  ON public.journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- A user can only create entries for themselves.
CREATE POLICY "Users can insert own entries"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A user can only update their own entries.
CREATE POLICY "Users can update own entries"
  ON public.journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- A user can only delete their own entries.
CREATE POLICY "Users can delete own entries"
  ON public.journal_entries
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 6. Table: `ai_feedback`

### Why it exists

Stores the structured output from the AI English teacher, linked to the specific journal entry it analyzed. Keeping feedback in a separate table avoids bloating `journal_entries` with large JSONB columns and allows the app to show a history of feedback for a given entry. Records are **immutable** — feedback is never edited after it is saved; a new record is created on each AI request.

### CREATE TABLE

```sql
CREATE TABLE public.ai_feedback (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     uuid        NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  corrections  jsonb,
  suggestions  jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

**JSONB shapes:**

`corrections` — array of grammar corrections. Every item carries the explanation in **both English and Myanmar** — Myanmar text helps users who are still building English fluency understand the rule without context-switching to a translator:
```json
[
  {
    "original":       "I goed to the market",
    "corrected":      "I went to the market",
    "explanation":    "'Go' is an irregular verb. The past tense is 'went', not 'goed'.",
    "explanation_my": "'Go' က irregular verb ဖြစ်ပါတယ်။ past tense မှာ 'goed' မဟုတ်ဘဲ 'went' ကိုသုံးရပါမယ်။"
  }
]
```

`suggestions` — array of vocabulary and expression suggestions. The English `reason` and Myanmar `reason_my` are paired — the model writes both in the same response:
```json
[
  {
    "type":       "vocabulary",
    "original":   "very happy",
    "suggestion": "delighted",
    "reason":     "'Delighted' sounds more natural and expressive than 'very happy'.",
    "reason_my":  "'Delighted' က 'very happy' ထက် ပိုသဘာဝကျပြီး ပိုပြောရှင်းပါတယ်။"
  },
  {
    "type":       "expression",
    "original":   "I like it very much",
    "suggestion": "I really enjoy it",
    "reason":     "'I really enjoy it' is a more natural English expression.",
    "reason_my":  "'I really enjoy it' က ပိုသဘာဝကျတဲ့ အင်္ဂလိပ်အသုံးအနှုန်းပါ။"
  }
]
```

**Backward compatibility.** The Myanmar fields are part of the JSONB blob, not separate columns, so no schema migration is required for them — older `ai_feedback` rows written before this change simply omit `explanation_my` / `reason_my`. UI components must treat the Myanmar fields as optional and gracefully render English-only when they're missing.

No `updated_at` column — records are immutable.

### Indexes

```sql
-- Used when loading all feedback for a specific entry (entry view page).
CREATE INDEX idx_ai_feedback_entry_id
  ON public.ai_feedback (entry_id);

-- Used when querying feedback history by user (e.g., common mistake patterns on dashboard).
CREATE INDEX idx_ai_feedback_user_id
  ON public.ai_feedback (user_id);
```

### Row Level Security

```sql
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- A user can only read their own feedback.
CREATE POLICY "Users can view own ai feedback"
  ON public.ai_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- A user can only insert feedback for themselves.
-- The API route also validates that entry_id belongs to the user before calling AI.
CREATE POLICY "Users can insert own ai feedback"
  ON public.ai_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies — feedback records are immutable.
```

---

## 7. Table: `saved_words`

### Why it exists

Allows users to build a personal vocabulary list from words surfaced during AI feedback. Each saved word belongs to a user and optionally tracks which journal entry it came from. Words can be saved independently of the AI flow in the future, so `source_entry_id` is nullable.

### CREATE TABLE

```sql
CREATE TABLE public.saved_words (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word             text        NOT NULL,
  definition       text,
  definition_my    text,
  example_sentence text,
  source_entry_id  uuid        REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  -- Prevent saving the same word twice per user.
  UNIQUE (user_id, word)
);
```

**Notes:**
- `definition` and `example_sentence` are populated by the AI at save time and stored for offline viewing.
- `definition_my` holds the Myanmar translation of `definition` and is populated from the same AI suggestion the user saved from. It is **nullable** so that future non-AI-sourced word entries (e.g. a manual "Add a word" flow) can omit it without a backfill.
- `source_entry_id` is set to `NULL` if the source entry is deleted — the word itself is preserved.
- The `UNIQUE (user_id, word)` constraint prevents duplicate vocabulary entries per user.

No `updated_at` column — saved words are not edited, only created and deleted.

### Indexes

```sql
-- Used on every vocabulary list query, which always filters by user.
CREATE INDEX idx_saved_words_user_id
  ON public.saved_words (user_id);

-- Used for keyword search on the vocabulary page (case-insensitive ILIKE queries).
-- A basic B-tree index on (user_id, word) also supports prefix search efficiently.
CREATE INDEX idx_saved_words_user_id_word
  ON public.saved_words (user_id, word);
```

### Row Level Security

```sql
ALTER TABLE public.saved_words ENABLE ROW LEVEL SECURITY;

-- A user can only read their own saved words.
CREATE POLICY "Users can view own saved words"
  ON public.saved_words
  FOR SELECT
  USING (auth.uid() = user_id);

-- A user can only save words for themselves.
CREATE POLICY "Users can insert own saved words"
  ON public.saved_words
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A user can only delete their own saved words.
CREATE POLICY "Users can delete own saved words"
  ON public.saved_words
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 8. Table: `writing_streaks`

### Why it exists

Tracks each user's writing activity over time. Storing these counters in a dedicated table (rather than computing them on every dashboard load) keeps the dashboard query instant, regardless of how many entries the user has. There is exactly one row per user; it is upserted by the API route each time a journal entry is saved.

### CREATE TABLE

```sql
CREATE TABLE public.writing_streaks (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  integer NOT NULL DEFAULT 0,
  longest_streak  integer NOT NULL DEFAULT 0,
  last_entry_date date,
  total_words     integer NOT NULL DEFAULT 0,
  total_entries   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**Streak logic (enforced in application code, not the database):**

This table holds two distinct kinds of data, and the API route treats them differently when a new entry is saved:

- **Totals** (`total_words`, `total_entries`) — a historical record. Every saved entry counts, no matter what its `entry_date` is. A backfilled entry from last week is still a real entry the user wrote and must be reflected in the totals.
- **Streak fields** (`current_streak`, `longest_streak`, `last_entry_date`) — a measure of writing momentum, i.e. consecutive days the user actually showed up to write. Only entries whose `entry_date` equals **today (UTC)** count as showing up today. Backfilled entries (`entry_date` in the past) do **not** touch these fields. This means a user can fill in a missed day later without it resetting their current streak — and equally, a backfill cannot retroactively extend a streak the user did not actually maintain.

When a journal entry is saved, the API route:

1. Fetches the user's current `writing_streaks` row.
2. **Always** adds the new entry's `word_count` to `total_words` and increments `total_entries` by 1.
3. Then checks whether `entry_date == today (UTC)`. If **not**, stop here — the streak fields are left untouched.
4. If `entry_date == today`, apply the streak transition based on `last_entry_date`:
   - `last_entry_date` is today → no change (entry already counted today).
   - `last_entry_date` is yesterday → increment `current_streak` by 1.
   - `last_entry_date` is anything else (older, null, or — in theory — in the future) → reset `current_streak` to 1.
5. Update `longest_streak = max(longest_streak, current_streak)`.
6. Set `last_entry_date` to today.

### Indexes

The `UNIQUE` constraint on `user_id` automatically creates a unique index. No additional indexes are needed — this table is always queried by `user_id` and has exactly one row per user.

### updated_at Trigger

```sql
CREATE TRIGGER writing_streaks_set_updated_at
  BEFORE UPDATE ON public.writing_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### Row Level Security

```sql
ALTER TABLE public.writing_streaks ENABLE ROW LEVEL SECURITY;

-- A user can only read their own streak data.
CREATE POLICY "Users can view own writing streak"
  ON public.writing_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

-- A user can update their own streak row. The API route
-- (POST /api/entries) runs under the user's session via the anon-key
-- server client, so RLS applies — without this policy the increment
-- to total_words / total_entries silently affects zero rows.
-- INSERT is intentionally not exposed: the row is created by the
-- on_auth_user_created trigger (SECURITY DEFINER) and there is exactly
-- one row per user for its lifetime.
CREATE POLICY "Users can update own writing streak"
  ON public.writing_streaks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 9. Signup Trigger

### Why it exists

When a new user signs up via Supabase Auth, a row must be created in `profiles` and `writing_streaks` before the user can use the app. Doing this in a database trigger guarantees these rows always exist, regardless of which code path created the user (web signup, admin invite, etc.).

### Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create the user's app profile with default settings.
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Initialize the user's streak and stats record.
  INSERT INTO public.writing_streaks (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;
```

**`SECURITY DEFINER`** means the function runs with the privileges of its owner (the database superuser), not the calling user. This is required because the trigger fires in the `auth` schema context, where regular users do not have INSERT rights on `public.profiles`.

### Trigger

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 10. Full Execution Script

Paste this entire script into the Supabase SQL Editor and run it once to set up the complete schema. The order matters — functions and referenced tables must exist before they are used.

```sql
-- ============================================================
-- STEP 1: Shared utility function for updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- STEP 2: profiles
-- ============================================================

CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled  boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- STEP 3: journal_entries
-- ============================================================

CREATE TABLE public.journal_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  body        text        NOT NULL,
  entry_date  date        NOT NULL DEFAULT CURRENT_DATE,
  mood        text        CHECK (mood IN ('happy', 'sad', 'neutral', 'excited', 'tired')),
  tags        text[]      NOT NULL DEFAULT '{}',
  word_count  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_entries_user_id
  ON public.journal_entries (user_id);

CREATE INDEX idx_journal_entries_user_id_entry_date
  ON public.journal_entries (user_id, entry_date DESC);

CREATE INDEX idx_journal_entries_user_id_mood
  ON public.journal_entries (user_id, mood);

CREATE INDEX idx_journal_entries_tags
  ON public.journal_entries USING GIN (tags);

CREATE INDEX idx_journal_entries_fts
  ON public.journal_entries
  USING GIN (to_tsvector('english', title || ' ' || body));

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER journal_entries_set_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Computed-column function exposed to PostgREST so the search endpoint
-- can call .textSearch('fts_doc', q, { type: 'plain', config: 'english' }).
-- The expression matches idx_journal_entries_fts above, so Postgres
-- reuses that GIN index — no extra column, no extra index. See §5
-- "Full-Text Search Computed Column" for full rationale.
CREATE OR REPLACE FUNCTION public.fts_doc(public.journal_entries)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT to_tsvector('english', $1.title || ' ' || $1.body)
$$;


-- ============================================================
-- STEP 4: ai_feedback
-- ============================================================

CREATE TABLE public.ai_feedback (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     uuid        NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  corrections  jsonb,
  suggestions  jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_feedback_entry_id
  ON public.ai_feedback (entry_id);

CREATE INDEX idx_ai_feedback_user_id
  ON public.ai_feedback (user_id);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai feedback"
  ON public.ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai feedback"
  ON public.ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- STEP 5: saved_words
-- ============================================================

CREATE TABLE public.saved_words (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word             text        NOT NULL,
  definition       text,
  definition_my    text,
  example_sentence text,
  source_entry_id  uuid        REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, word)
);

CREATE INDEX idx_saved_words_user_id
  ON public.saved_words (user_id);

CREATE INDEX idx_saved_words_user_id_word
  ON public.saved_words (user_id, word);

ALTER TABLE public.saved_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved words"
  ON public.saved_words FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved words"
  ON public.saved_words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved words"
  ON public.saved_words FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- STEP 6: writing_streaks
-- ============================================================

CREATE TABLE public.writing_streaks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  integer     NOT NULL DEFAULT 0,
  longest_streak  integer     NOT NULL DEFAULT 0,
  last_entry_date date,
  total_words     integer     NOT NULL DEFAULT 0,
  total_entries   integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.writing_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own writing streak"
  ON public.writing_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own writing streak"
  ON public.writing_streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER writing_streaks_set_updated_at
  BEFORE UPDATE ON public.writing_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- STEP 7: Signup trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  INSERT INTO public.writing_streaks (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- STEP 8: Security hardening (see Section 11 for rationale)
-- ============================================================

ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
```

---

## 11. Security Hardening

These statements are applied at the end of Section 10. They close two warnings flagged by `supabase db advisors` after the initial schema is created. They are part of the standard setup — a fresh database should always include them.

### 11.1 Pin `set_updated_at` search_path

```sql
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
```

**Why:** Without an explicit `search_path`, the function resolves unqualified names using the caller's `search_path` at execution time. A user (or role) with `CREATE` privilege on any schema earlier in the `search_path` could shadow built-in objects and hijack what the function does when it fires from a trigger. Pinning `search_path` to `public, pg_temp` eliminates that attack surface.

### 11.2 Revoke public EXECUTE on `handle_new_user`

```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
```

**Why:** `handle_new_user` is a `SECURITY DEFINER` function in the `public` schema. Postgres grants `EXECUTE` to `PUBLIC` by default for every new function, which means Supabase auto-exposes it as an RPC endpoint at `/rest/v1/rpc/handle_new_user`, callable by both `anon` and `authenticated`. Without this revoke, any user could invoke it directly and insert stray rows into `profiles` and `writing_streaks` using their own `auth.uid()`.

The `AFTER INSERT` trigger on `auth.users` still fires correctly after the revoke — Postgres triggers invoke their function regardless of `EXECUTE` grants on the role.
