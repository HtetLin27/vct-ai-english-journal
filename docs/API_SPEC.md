# AI English Journal — API Specification

## Table of Contents

1. [Overview](#1-overview)
2. [Auth Endpoints](#2-auth-endpoints)
3. [Journal Entry Endpoints](#3-journal-entry-endpoints)
4. [Search Endpoints](#4-search-endpoints)
5. [AI Feature Endpoints](#5-ai-feature-endpoints)
6. [Vocabulary Endpoints](#6-vocabulary-endpoints)
7. [Stats & Streak Endpoints](#7-stats--streak-endpoints)
8. [Settings Endpoints](#8-settings-endpoints)

---

## 1. Overview

### Base URL

```
/api
```

All endpoints are Next.js API Routes under `app/api/`.

### Response Envelope

Every response — success or failure — uses this exact shape (defined in `PROJECT_SPEC.md`):

```ts
// Success
{ success: true,  data: {} | [] | null, error: null }

// Failure
{ success: false, data: null, error: "Human-readable message" }
```

### Authentication

All endpoints except sign-up and login require a valid Supabase session. The session is read server-side from the request cookie using the Supabase server client. A missing or expired session returns:

```json
HTTP 401
{ "success": false, "data": null, "error": "Unauthorized" }
```

Session verification is the **first thing** every protected route does, before any other logic.

### Validation Errors

Invalid request bodies return:

```json
HTTP 400
{ "success": false, "data": null, "error": "<specific validation message>" }
```

### Server Errors

Unexpected server errors return:

```json
HTTP 500
{ "success": false, "data": null, "error": "Internal server error" }
```

### Rate Limiting

AI endpoints (`/api/ai/*`) are computationally expensive. Notes on rate limiting are included per endpoint. Rate limiting implementation is handled at the Next.js middleware or API route level (not in the database).

---

## 2. Auth Endpoints

Auth state is managed by the Supabase client SDK on the frontend. The only server-side auth endpoint is for reading the current session.

---

### `GET /api/auth/session`

Returns the currently authenticated user's ID and email.

**Auth required:** No (returns null data if not logged in)

**Tables read:** None (reads from Supabase Auth session cookie)

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com"
  },
  "error": null
}
```

**When no session exists `200`:**

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

> Sign up and login are handled entirely by the Supabase client SDK (`supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`). No custom API routes are needed for these flows.

---

## 3. Journal Entry Endpoints

---

### `GET /api/entries`

Returns all journal entries for the authenticated user, sorted by `entry_date` descending (newest first).

**Auth required:** Yes

**Tables read:** `journal_entries`

**Query parameters:** None (filtering/search is a separate endpoint — see Section 4)

**Success response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "My first day at work",
      "entry_date": "2026-06-14",
      "mood": "happy",
      "tags": ["work"],
      "word_count": 142,
      "created_at": "2026-06-14T09:30:00Z",
      "updated_at": "2026-06-14T09:30:00Z"
    }
  ],
  "error": null
}
```

> The `body` field is intentionally excluded from the list response to keep payloads small. The full body is returned only in the single-entry endpoint.

---

### `POST /api/entries`

Creates a new journal entry for the authenticated user.

**Auth required:** Yes

**Tables written:** `journal_entries`, `writing_streaks`

**Request body:**

```ts
{
  title:      string   // required, 1–200 characters
  body:       string   // required, 1–10,000 characters
  entry_date: string   // required, ISO date format "YYYY-MM-DD"
  mood:       string   // optional, must be one of: "happy" | "sad" | "neutral" | "excited" | "tired"
  tags:       string[] // optional, defaults to [], each tag 1–50 characters, max 10 tags
}
```

**Validation rules:**
- `title` must not be empty or whitespace-only
- `body` must not be empty or whitespace-only
- `entry_date` must be a valid date string parseable as `YYYY-MM-DD`
- `mood`, if provided, must be exactly one of the five allowed values
- `tags`, if provided, must be an array of strings; each tag trimmed before saving

**Server-side actions:**
1. Verify session
2. Validate request body
3. Calculate `word_count` from `body` (split on whitespace)
4. Insert into `journal_entries` with `user_id = authenticated user`
5. Update `writing_streaks` for the user (upsert streak counters)

**Success response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "My first day at work",
    "body": "Today I started my new job. I was very nervous but...",
    "entry_date": "2026-06-14",
    "mood": "happy",
    "tags": ["work"],
    "word_count": 142,
    "created_at": "2026-06-14T09:30:00Z",
    "updated_at": "2026-06-14T09:30:00Z"
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"Title is required"` |
| `400` | `"Body is required"` |
| `400` | `"entry_date must be a valid date in YYYY-MM-DD format"` |
| `400` | `"mood must be one of: happy, sad, neutral, excited, tired"` |
| `400` | `"tags must be an array of strings"` |
| `401` | `"Unauthorized"` |
| `500` | `"Internal server error"` |

---

### `GET /api/entries/[id]`

Returns a single journal entry by ID, including the full body text.

**Auth required:** Yes

**Tables read:** `journal_entries`

**Path parameter:** `id` — UUID of the entry

**Server-side actions:**
1. Verify session
2. Fetch entry by `id` WHERE `user_id = authenticated user`
3. If not found, return `404` (this also handles the case where the entry belongs to another user)

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "My first day at work",
    "body": "Today I started my new job. I was very nervous but...",
    "entry_date": "2026-06-14",
    "mood": "happy",
    "tags": ["work"],
    "word_count": 142,
    "created_at": "2026-06-14T09:30:00Z",
    "updated_at": "2026-06-14T09:30:00Z"
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `401` | `"Unauthorized"` |
| `404` | `"Entry not found"` |
| `500` | `"Internal server error"` |

---

### `PUT /api/entries/[id]`

Updates an existing journal entry. Only the fields provided in the request body are updated (partial update).

**Auth required:** Yes

**Tables written:** `journal_entries`

**Path parameter:** `id` — UUID of the entry

**Request body (all fields optional, at least one required):**

```ts
{
  title?:      string   // 1–200 characters if provided
  body?:       string   // 1–10,000 characters if provided
  entry_date?: string   // ISO date "YYYY-MM-DD" if provided
  mood?:       string | null  // one of the 5 values, or null to clear mood
  tags?:       string[] // array of strings if provided
}
```

**Server-side actions:**
1. Verify session
2. Fetch entry by `id` WHERE `user_id = authenticated user` (verify ownership; return `404` if not found)
3. Validate provided fields
4. Recalculate `word_count` if `body` is updated
5. Update entry; `updated_at` is set automatically by the database trigger

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "My first day at work (updated)",
    "body": "Today I started my new job...",
    "entry_date": "2026-06-14",
    "mood": "excited",
    "tags": ["work", "life"],
    "word_count": 198,
    "created_at": "2026-06-14T09:30:00Z",
    "updated_at": "2026-06-14T11:00:00Z"
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"Request body must include at least one field to update"` |
| `400` | `"Title must not be empty"` |
| `400` | `"Body must not be empty"` |
| `400` | `"mood must be one of: happy, sad, neutral, excited, tired"` |
| `401` | `"Unauthorized"` |
| `404` | `"Entry not found"` |
| `500` | `"Internal server error"` |

---

### `DELETE /api/entries/[id]`

Deletes a journal entry and all associated AI feedback (cascade handled by the database).

**Auth required:** Yes

**Tables written:** `journal_entries` (cascade deletes `ai_feedback`; sets `saved_words.source_entry_id` to NULL)

**Path parameter:** `id` — UUID of the entry

**Server-side actions:**
1. Verify session
2. Verify ownership: fetch entry WHERE `id` AND `user_id = authenticated user`; return `404` if not found
3. Delete entry (database handles cascades)

**Success response `200`:**

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `401` | `"Unauthorized"` |
| `404` | `"Entry not found"` |
| `500` | `"Internal server error"` |

---

## 4. Search Endpoints

---

### `GET /api/entries/search`

Searches and filters the authenticated user's journal entries. All parameters are optional; omitting all returns the same result as `GET /api/entries`.

**Auth required:** Yes

**Tables read:** `journal_entries`

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | `string` | Keyword search across `title` and `body` (full-text search) |
| `from` | `string` | Start date filter, inclusive, format `YYYY-MM-DD` |
| `to` | `string` | End date filter, inclusive, format `YYYY-MM-DD` |
| `mood` | `string` | Filter by mood: `happy \| sad \| neutral \| excited \| tired` |
| `tag` | `string` | Filter entries that include this tag (exact match) |

**Validation rules:**
- `mood`, if provided, must be one of the five allowed values
- `from` and `to`, if provided, must be valid `YYYY-MM-DD` dates
- `from` must not be after `to` if both are provided

**Server-side query logic:**
- `q` → `WHERE to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', q)`
- `from` / `to` → `WHERE entry_date >= from AND entry_date <= to`
- `mood` → `WHERE mood = mood`
- `tag` → `WHERE tags @> ARRAY[tag]`
- All filters are combined with `AND`
- Results are always sorted by `entry_date DESC`

**Success response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "My trip to Bagan",
      "entry_date": "2026-05-20",
      "mood": "excited",
      "tags": ["travel"],
      "word_count": 220,
      "created_at": "2026-05-20T18:00:00Z",
      "updated_at": "2026-05-20T18:00:00Z"
    }
  ],
  "error": null
}
```

> `body` is excluded from search results for the same reason as the list endpoint. The client navigates to the entry detail page to read the full text.

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"mood must be one of: happy, sad, neutral, excited, tired"` |
| `400` | `"from must be a valid date in YYYY-MM-DD format"` |
| `400` | `"to must be a valid date in YYYY-MM-DD format"` |
| `400` | `"from must not be after to"` |
| `401` | `"Unauthorized"` |
| `500` | `"Internal server error"` |

---

## 5. AI Feature Endpoints

### General rules for all AI endpoints

- **AI must be enabled:** Before calling the Gemini API, every AI endpoint checks `profiles.ai_enabled` for the authenticated user. If `ai_enabled = false`, the endpoint returns `403` immediately — no AI call is made.
- **Token cap:** Entry `body` is truncated server-side to stay within **1500 tokens** (approximately 1125 words) before being sent to Gemini. Truncation is silent — the user is not notified.
- **Current entry only:** Only the body of the single entry being analyzed is sent to Gemini. No other entries, feedback history, or user data is included in the prompt.
- **Rate limiting:** AI endpoints should be rate-limited to **10 requests per user per hour** to control Gemini API costs. Exceeding this limit returns `429`.

**AI disabled response `403`:**

```json
{
  "success": false,
  "data": null,
  "error": "AI features are disabled. Enable them in Settings."
}
```

**Rate limit exceeded response `429`:**

```json
{
  "success": false,
  "data": null,
  "error": "Too many AI requests. Please wait before trying again."
}
```

---

### `POST /api/ai/feedback`

Sends the journal entry body to Gemini for grammar checking, sentence correction, vocabulary suggestions, and natural expression coaching. Saves the structured result to `ai_feedback`.

**Auth required:** Yes

**Tables read:** `journal_entries`, `profiles`

**Tables written:** `ai_feedback`

**Request body:**

```ts
{
  entry_id: string  // required, UUID of the journal entry to analyze
}
```

**Validation rules:**
- `entry_id` must be a valid UUID
- The entry must exist and belong to the authenticated user (verified by database query — not just from the request)

**Server-side actions:**
1. Verify session
2. Check `ai_enabled` for user
3. Fetch entry by `entry_id` WHERE `user_id = authenticated user`; return `404` if not found
4. Truncate `body` to 1500-token limit
5. Call Gemini API with feedback prompt
6. Parse structured response from Gemini
7. Insert into `ai_feedback` with `entry_id`, `user_id`, `corrections`, `suggestions`
8. Return the new feedback record

**Gemini prompt context sent:**

```
Role: You are a friendly English teacher helping a Myanmar learner.
Task: Analyze the following journal entry for grammar mistakes and vocabulary.
Entry: <truncated body>
```

**Bilingual explanation fields.** Every correction includes `explanation_my` alongside `explanation`, and every suggestion includes `reason_my` alongside `reason`. Both fields are required outputs from Gemini — the prompt instructs the model to write the English explanation first, then the Myanmar translation of that same explanation. Guided-question endpoints (`/api/ai/guide`, `/api/ai/draft`) stay English-only because those are writing prompts, not explanations of grammar rules.

For backward compatibility, the UI must treat `explanation_my` and `reason_my` as optional — feedback rows written before this change will not have them. See `DATABASE_SPEC.md` §6 for the JSONB shape.

**Success response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "entry_id": "uuid",
    "corrections": [
      {
        "original":       "I goed to the market yesterday.",
        "corrected":      "I went to the market yesterday.",
        "explanation":    "'Go' is an irregular verb. The past tense form is 'went'.",
        "explanation_my": "'Go' က irregular verb ဖြစ်ပါတယ်။ past tense မှာ 'went' ကိုသုံးပါ။"
      }
    ],
    "suggestions": [
      {
        "type":             "vocabulary",
        "original":         "very good",
        "suggestion":       "excellent",
        "reason":           "'Excellent' is more precise and sounds more natural in writing.",
        "reason_my":        "'Excellent' က 'very good' ထက် ပိုတိကျပြီး စာအရေးအသားမှာ ပိုသဘာဝကျပါတယ်။",
        "definition":       "Extremely good; outstanding in quality.",
        "example_sentence": "She did an excellent job on the presentation."
      },
      {
        "type":             "expression",
        "original":         "I like eat food",
        "suggestion":       "I enjoy eating food",
        "reason":           "In English, after 'enjoy' we use a gerund (-ing form).",
        "reason_my":        "အင်္ဂလိပ်စာမှာ 'enjoy' ပြီးရင် gerund (-ing form) ကိုသုံးရပါတယ်။",
        "definition":       "To take pleasure in the activity of eating.",
        "example_sentence": "I enjoy eating food with my family on weekends."
      }
    ],
    "created_at": "2026-06-14T10:00:00Z"
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"entry_id is required"` |
| `400` | `"entry_id must be a valid UUID"` |
| `401` | `"Unauthorized"` |
| `403` | `"AI features are disabled. Enable them in Settings."` |
| `404` | `"Entry not found"` |
| `429` | `"Too many AI requests. Please wait before trying again."` |
| `500` | `"Internal server error"` |
| `502` | `"AI service unavailable. Please try again later."` |

---

### `POST /api/ai/guide`

When a user does not know what to write, this endpoint sends a small context (optional topic hint) to Gemini and returns 3–5 guided journaling questions to help them get started.

**Auth required:** Yes

**Tables read:** `profiles`

**Tables written:** None

**Request body:**

```ts
{
  topic?: string  // optional, a brief hint from the user (e.g., "today at work"), max 200 characters
}
```

**Validation rules:**
- `topic`, if provided, must not exceed 200 characters

**Server-side actions:**
1. Verify session
2. Check `ai_enabled` for user
3. Call Gemini API with guided question prompt, including `topic` if provided
4. Return the array of questions

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "questions": [
      "What happened today that made you feel something strongly?",
      "Was there a moment today where you had to make a decision? What did you choose?",
      "Did you talk to anyone interesting today? What did you discuss?",
      "What is one thing you learned or noticed today?",
      "How do you feel right now compared to how you felt this morning?"
    ]
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"topic must not exceed 200 characters"` |
| `401` | `"Unauthorized"` |
| `403` | `"AI features are disabled. Enable them in Settings."` |
| `429` | `"Too many AI requests. Please wait before trying again."` |
| `500` | `"Internal server error"` |
| `502` | `"AI service unavailable. Please try again later."` |

---

### `POST /api/ai/draft`

Takes the user's answers to the guided questions and asks Gemini to write a complete journal entry draft. The user reviews and edits the draft before saving it.

**Auth required:** Yes

**Tables read:** `profiles`

**Tables written:** None (the draft is returned to the client; the user saves it via `POST /api/entries`)

**Request body:**

```ts
{
  answers: Array<{
    question: string  // the guided question text, max 300 characters
    answer:   string  // the user's answer, max 500 characters
  }>
}
```

**Validation rules:**
- `answers` must be a non-empty array
- Maximum 5 question/answer pairs
- Each `answer` must not be empty or whitespace-only
- Each `answer` must not exceed 500 characters

**Server-side actions:**
1. Verify session
2. Check `ai_enabled` for user
3. Validate `answers` array
4. Combine all Q&A pairs and call Gemini with draft-generation prompt
5. Return the draft text

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "draft": "Today was an interesting day at work. My manager gave me a new project..."
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"answers must be a non-empty array"` |
| `400` | `"answers must not exceed 5 items"` |
| `400` | `"Each answer must not be empty"` |
| `400` | `"Each answer must not exceed 500 characters"` |
| `401` | `"Unauthorized"` |
| `403` | `"AI features are disabled. Enable them in Settings."` |
| `429` | `"Too many AI requests. Please wait before trying again."` |
| `500` | `"Internal server error"` |
| `502` | `"AI service unavailable. Please try again later."` |

---

## 6. Vocabulary Endpoints

---

### `GET /api/vocabulary`

Returns all saved words for the authenticated user, sorted by `created_at` descending.

**Auth required:** Yes

**Tables read:** `saved_words`

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | `string` | Optional keyword to search word or definition (case-insensitive) |

**Success response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "word": "delighted",
      "definition": "Very pleased and happy.",
      "definition_my": "အလွန်ပျော်ရွှင်ပြီး ကျေနပ်နေတဲ့ အခြေအနေ။",
      "example_sentence": "She was delighted to receive the good news.",
      "source_entry_id": "uuid",
      "created_at": "2026-06-14T10:30:00Z"
    }
  ],
  "error": null
}
```

> `definition_my` may be `null` for words saved before bilingual definitions were introduced, or for any future non-AI-sourced word entries. The UI must render gracefully when it's absent.

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `401` | `"Unauthorized"` |
| `500` | `"Internal server error"` |

---

### `POST /api/vocabulary`

Saves a new word to the authenticated user's vocabulary book. The word, definition, and example sentence are provided by the client (populated from AI feedback data already on the page — no additional AI call is made here).

**Auth required:** Yes

**Tables written:** `saved_words`

**Request body:**

```ts
{
  word:             string   // required, 1–100 characters
  definition:       string   // required, 1–500 characters
  definition_my?:   string   // optional, 1–500 characters — Myanmar translation of definition
  example_sentence: string   // required, 1–500 characters
  source_entry_id?: string   // optional, UUID of the entry where the word was found
}
```

**Validation rules:**
- `word` must not be empty or whitespace-only
- `definition` must not be empty
- `definition_my`, if provided, must not exceed 500 characters (empty string is treated as omitted)
- `example_sentence` must not be empty
- `source_entry_id`, if provided, must be a valid UUID belonging to the authenticated user

> `definition_my` is **optional** because the column is nullable in the database (see `DATABASE_SPEC.md` §7). In practice the AI-sourced save flow always sends it — it comes from the same suggestion the user clicked "Save" on — but a future manual "Add a word" flow can omit it.

**Success response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "word": "delighted",
    "definition": "Very pleased and happy.",
    "definition_my": "အလွန်ပျော်ရွှင်ပြီး ကျေနပ်နေတဲ့ အခြေအနေ။",
    "example_sentence": "She was delighted to receive the good news.",
    "source_entry_id": "uuid",
    "created_at": "2026-06-14T10:30:00Z"
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"word is required"` |
| `400` | `"definition is required"` |
| `400` | `"example_sentence is required"` |
| `400` | `"This word is already in your vocabulary book"` |
| `401` | `"Unauthorized"` |
| `500` | `"Internal server error"` |

> The `409 Conflict` case (duplicate word) is caught from the `UNIQUE (user_id, word)` database constraint and returned as a `400` with a user-friendly message.

---

### `DELETE /api/vocabulary/[id]`

Removes a saved word from the authenticated user's vocabulary book.

**Auth required:** Yes

**Tables written:** `saved_words`

**Path parameter:** `id` — UUID of the saved word

**Server-side actions:**
1. Verify session
2. Verify ownership: fetch word WHERE `id` AND `user_id = authenticated user`; return `404` if not found
3. Delete the record

**Success response `200`:**

```json
{
  "success": true,
  "data": null,
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `401` | `"Unauthorized"` |
| `404` | `"Word not found"` |
| `500` | `"Internal server error"` |

---

## 7. Stats & Streak Endpoints

---

### `GET /api/stats`

Returns the authenticated user's writing streak and cumulative statistics for the dashboard.

**Auth required:** Yes

**Tables read:** `writing_streaks`

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "current_streak": 7,
    "longest_streak": 14,
    "last_entry_date": "2026-06-14",
    "total_words": 8340,
    "total_entries": 42
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `401` | `"Unauthorized"` |
| `500` | `"Internal server error"` |

> The `writing_streaks` row is created automatically on signup. This endpoint will always return a valid data object for authenticated users.

---

## 8. Settings Endpoints

---

### `GET /api/settings`

Returns the authenticated user's current settings.

**Auth required:** Yes

**Tables read:** `profiles`

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "ai_enabled": true
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `401` | `"Unauthorized"` |
| `500` | `"Internal server error"` |

---

### `PUT /api/settings`

Updates the authenticated user's settings. All fields are optional; at least one must be provided.

**Auth required:** Yes

**Tables written:** `profiles`

**Request body:**

```ts
{
  ai_enabled?: boolean  // toggle AI features on or off
}
```

**Validation rules:**
- `ai_enabled`, if provided, must be a boolean (`true` or `false`)
- At least one field must be present in the request body

**Success response `200`:**

```json
{
  "success": true,
  "data": {
    "ai_enabled": false
  },
  "error": null
}
```

**Possible errors:**

| Status | Error message |
|--------|--------------|
| `400` | `"Request body must include at least one field to update"` |
| `400` | `"ai_enabled must be a boolean"` |
| `401` | `"Unauthorized"` |
| `500` | `"Internal server error"` |

---

## Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/session` | No | Get current session user |
| `GET` | `/api/entries` | Yes | List all entries (no body) |
| `POST` | `/api/entries` | Yes | Create a new entry |
| `GET` | `/api/entries/[id]` | Yes | Get a single entry with full body |
| `PUT` | `/api/entries/[id]` | Yes | Update an entry (partial) |
| `DELETE` | `/api/entries/[id]` | Yes | Delete an entry |
| `GET` | `/api/entries/search` | Yes | Search and filter entries |
| `POST` | `/api/ai/feedback` | Yes | Get AI grammar and vocabulary feedback |
| `POST` | `/api/ai/guide` | Yes | Get guided journaling questions |
| `POST` | `/api/ai/draft` | Yes | Generate a journal draft from answers |
| `GET` | `/api/vocabulary` | Yes | List saved words |
| `POST` | `/api/vocabulary` | Yes | Save a new word |
| `DELETE` | `/api/vocabulary/[id]` | Yes | Delete a saved word |
| `GET` | `/api/stats` | Yes | Get streak and writing stats |
| `GET` | `/api/settings` | Yes | Get user settings |
| `PUT` | `/api/settings` | Yes | Update user settings |
