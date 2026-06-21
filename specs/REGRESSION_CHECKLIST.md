# Regression Checklist — Phases 2–8

Manual end-to-end checklist for every user-facing flow built so far. Work through it before deploying. Each item is a single observable behavior — if you can't verify it without guessing, the item is too vague; flag it.

**Test environment assumptions**
- Dev server running at `http://localhost:3000`
- A test account with at least 3 entries, 1 saved word, and a non-zero streak
- A second test account (clean / empty) for empty-state checks
- Test on a desktop browser **and** a real mobile viewport (DevTools responsive mode ≥ iPhone SE width is acceptable)

> **AI feature testing (§4) now requires a live Gemini connection.** Mock mode has been removed, so the `/api/ai/feedback`, `/api/ai/guide`, and `/api/ai/draft` checks must be run either (a) locally with a working `GEMINI_API_KEY` and network reachability to Gemini, or (b) against the deployed production environment on Vercel. Response *content* will vary run-to-run with live Gemini — verify behavior (shape, states, error paths) rather than asserting on specific fixture text.

---

## 1. Authentication (Phase 2)

### Signup
- [ ] Visiting `/signup` while logged out renders the signup card with heading "Create your account" and the subtext "Start your English writing journey".
- [ ] Submitting the form with mismatched passwords shows an inline red Alert below the confirm field; no network request is sent.
- [ ] Submitting a password under 8 characters shows the weak-password Alert below the button.
- [ ] Submitting with an already-registered email shows the "email already registered" Alert; user stays on `/signup`.
- [ ] Submitting valid credentials shows the green "Account created! Redirecting…" Alert and lands on `/dashboard` within ~2s.
- [ ] After successful signup, querying Supabase shows new rows in `profiles` (with `ai_enabled = true`) and `writing_streaks` (with `current_streak = 0`) for the new user — both created by the `on_auth_user_created` trigger, not by app code.

### Login
- [ ] `/login` renders with heading "Welcome back" and a link "Don't have an account? Sign up →" that navigates to `/signup`.
- [ ] Wrong password shows the inline "Invalid email or password. Please try again." Alert; user stays on `/login`.
- [ ] Correct credentials redirect to `/dashboard`.
- [ ] While the request is in flight the Log In button text reads "Logging in…" and the button is disabled.

### Logout
- [ ] On `/settings`, clicking "Log Out" in the Account card signs the user out and redirects to `/login`.
- [ ] After logout, hitting Back in the browser does not show protected content — it redirects back to `/login`.

### Route protection
- [ ] Visiting `/dashboard`, `/journal`, `/journal/new`, `/journal/<any-uuid>`, `/journal/<any-uuid>/edit`, `/vocabulary`, or `/settings` while logged out redirects to `/login`.
- [ ] Visiting `/login` or `/signup` while logged in redirects to `/dashboard` (do not let an authenticated user see the auth pages).
- [ ] `GET /api/auth/session` returns `{ success: true, data: { id, email }, error: null }` while logged in, and `{ success: true, data: null, error: null }` when not — both with HTTP 200.
- [ ] Any other API route called without a session returns HTTP 401 and `{ success: false, data: null, error: "Unauthorized" }`.

---

## 2. Journal CRUD (Phase 3)

### Create
- [ ] `/journal/new` renders with: Back link, "New Journal Entry" heading, DatePicker pre-filled with today's date, Title input, MoodSelector (5 pills, none selected), TagInput, body Textarea, the "💡 Not sure what to write? Get writing prompts →" link, "Save Entry" and "Cancel" buttons.
- [ ] Submitting with empty title shows inline `text-red-600` "Title is required" beneath the title field; no network request fires.
- [ ] Submitting with empty body shows inline `text-red-600` "Please write something in your entry" beneath the textarea.
- [ ] Body containing exactly 142 whitespace-separated words results in `word_count = 142` on the saved row (check in DB or via the meta row on the view page).
- [ ] On successful save, the user lands on `/journal/<new-id>` (not `/journal`), and the new entry appears at the top of `/journal` and `/dashboard` recent entries.
- [ ] Creating an entry dated today when the user has no prior entries sets `writing_streaks.current_streak = 1` and `last_entry_date = today`.
- [ ] Creating a second entry on the same day does **not** double-increment the streak (still 1).

### View
- [ ] `/journal/<id>` shows: Back link "← My Journal", title in `text-3xl font-bold`, meta row with date · mood badge · word count separated by `·`, tag pills (green-100/green-800/rounded-full), horizontal divider, body text in `.journal-body` style, action bar with Edit / Delete / "✨ Check my English" buttons.
- [ ] Visiting `/journal/<a-uuid-belonging-to-another-user>` returns the "Entry not found" state, **not** an empty body or 403 — verifies data isolation. (Easiest way: copy an entry id from account B while logged in as account A.)
- [ ] Visiting `/journal/<non-existent-uuid>` also shows "Entry not found" with a link back to `/journal`.

### Edit
- [ ] `/journal/<id>/edit` pre-populates Title, body, date, mood pill (highlighted green), and existing tag pills. Heading reads "Edit Entry".
- [ ] No "Get writing prompts" link appears on the edit page (per UI_SPEC §4.7).
- [ ] Saving with a changed body recalculates `word_count` — the new value is visible immediately on the view page meta row.
- [ ] Clearing the mood (clicking the highlighted pill again) and saving stores `mood = null`; the view page meta row no longer shows the mood badge.
- [ ] "Cancel" returns to `/journal/<id>` without saving.

### Delete
- [ ] Clicking "🗑 Delete" on the view page opens a shadcn AlertDialog with copy "Are you sure? This cannot be undone." with Cancel + Delete buttons.
- [ ] Canceling the dialog closes it and leaves the entry intact (verify by reloading).
- [ ] Confirming the delete navigates back to `/journal` and the entry no longer appears in the list.
- [ ] After deleting an entry that has saved words referencing it, those `saved_words` rows still exist but their `source_entry_id` is NULL (DB cascade per `SKILL.md` §3); the word still renders on `/vocabulary`.

---

## 3. Search & Filtering (Phase 4)

### Keyword search
- [ ] Typing in the SearchBar on `/journal` debounces (~300ms) then issues exactly one `GET /api/entries/search?q=…` per pause.
- [ ] A keyword present in an entry title returns that entry; a keyword present only in the body also returns it (full-text covers both).
- [ ] The clear (×) button appears once the input has a value and clears the input + results when clicked.
- [ ] Search query of pure whitespace does not produce an error — it returns all entries (same as no query).

### Mood filter
- [ ] The Mood dropdown lists all 5 valid values (happy, sad, neutral, excited, tired).
- [ ] Selecting `happy` returns only entries with `mood = 'happy'`; total count at the top of the list updates to match.
- [ ] Sending `mood=invalid` to the API directly returns HTTP 400 with error `"mood must be one of: happy, sad, neutral, excited, tired"`.

### Date range
- [ ] Picking only "from" returns entries on or after that date.
- [ ] Picking only "to" returns entries on or before that date.
- [ ] Picking both filters to the inclusive range.
- [ ] Setting `from` later than `to` returns HTTP 400 `"from must not be after to"` — UI should surface this as an error state, not a silent failure.

### Tag filter
- [ ] Tag dropdown only lists tags that exist on the user's entries (no global/shared tag list).
- [ ] Selecting a tag returns entries whose `tags` array contains that exact tag (case-sensitive exact match).
- [ ] Selecting a tag that no entry has returns the "no results" empty state below.

### Empty states
- [ ] Account with zero entries: `/journal` shows "📓 You haven't written anything yet." with "Write First Entry" button linking to `/journal/new`.
- [ ] Search/filter that returns zero results shows "🔍 No entries match your search." with a "Clear Filters" button that resets all filters and the search input.
- [ ] Loading state shows 5 `JournalCard` skeleton placeholders with animated gray-100 pulse before results arrive.

---

## 4. AI Features (Phase 5)

### Feedback panel — all 6 states
On `/journal/<id>` of an entry that has not yet been checked:

- [ ] **Idle**: Green-50 panel with "✨ Check my English" button and the subtext "Get grammar feedback and vocabulary tips." Border is `border-green-200 rounded-xl`.
- [ ] **Loading**: After clicking the button, the panel switches to "✨ Checking your English…" with an animated spinner and "This usually takes a few seconds." This state should be visibly distinct from idle.
- [ ] **Loaded with corrections**: The panel renders an h2 "Your English Feedback" header, then a "Grammar Corrections (N found)" section with one `CorrectionCard` per correction (red strikethrough original, green corrected text with "→" prefix, English explanation prefixed by 💡, and a Myanmar explanation line directly under it in softer gray when present). When suggestions exist, a "Vocabulary Suggestions (N found)" section follows with one `SuggestionCard` per item (original → suggestion, English reason with 💬, Myanmar reason when present, and a "Save" button on `vocabulary`-type cards). A "↻ Refresh feedback" button sits at the bottom. Verify the *shape and styling* of whatever Gemini returns — the specific words, counts, and number of items will vary run-to-run.
- [ ] **Loaded with no corrections** (perfect entry): Since live Gemini almost always finds *something* to correct, verify this branch deterministically by writing an entry, manually inserting an `ai_feedback` row with `corrections: []` and `suggestions: [...]`, then reloading — the panel should show the green ✅ "Great job! No grammar mistakes found. Your writing looks correct." message followed by the suggestions section.
- [ ] **AI disabled**: With `ai_enabled = false` in `profiles`, clicking "Check my English" results in the green-50 panel reading "AI features are turned off. Go to Settings to enable them." with a Settings button that navigates to `/settings`. Network response is HTTP 403 with error `"AI features are disabled. Enable them in Settings."`
- [ ] **Generic error**: Simulate by stopping the dev server mid-request or temporarily forcing a 500 — the panel switches to a red-50/red-200 alert with the API error message (or the fallback "We couldn't get feedback right now. Please try again.") and an "↻ Try again" button that re-issues the request.

### Bilingual rendering inside feedback
- [ ] English explanation appears **first** on each correction; Myanmar (`explanation_my`) is on a separate line directly beneath it in softer gray (`text-gray-500`), not above.
- [ ] When `explanation_my` is missing (test by inserting an `ai_feedback` row with English-only fields), the Myanmar line is omitted entirely — no "translation unavailable" placeholder.
- [ ] Same English-then-Myanmar pairing for the `reason`/`reason_my` line on `SuggestionCard`.

### Guided questions flow (`/journal/new`)
- [ ] Clicking "💡 Not sure what to write? Get writing prompts →" reveals the Step 1 panel with an optional topic input and "Get prompts" / "Cancel" buttons.
- [ ] Submitting with an empty topic still works (topic is optional per API_SPEC §5).
- [ ] Submitting with a topic >200 chars returns HTTP 400 `"topic must not exceed 200 characters"` — UI surfaces this, doesn't silently fail.
- [ ] Step 2: loading state shows "💡 Thinking of questions for you…" with a spinner.
- [ ] Step 3: 3–5 small textareas appear, each labeled with a question. The "✨ Create my draft" button is disabled until at least one answer field is non-empty.
- [ ] Each answer's character limit is 500; the API returns 400 if any exceeds.
- [ ] Step 4: while the draft is generating, "✨ Writing your draft…" with a spinner.
- [ ] Step 5: the generated draft text is inserted into the main body Textarea (not appended after existing content unless that is the intended behavior — confirm), the guided-questions panel closes, and a transient green "✅ Draft created! Review and edit it before saving." Alert flashes briefly at the top.
- [ ] With AI disabled, the "Get writing prompts" link click results in the AI-disabled message — not a loading spinner that hangs.

### AI request constraints
- [ ] Open the entry, click Check, inspect the Network tab. The POST body to `/api/ai/feedback` is exactly `{ entry_id: "<uuid>" }` — never the body content, never multiple entries.
- [ ] Create an entry with > 6000 characters of body. Trigger feedback. The server truncates to 6000 chars (1500 tokens × 4) before sending to Gemini — verify the response still arrives with no error.

---

## 5. Vocabulary Book (Phase 6)

### Save from suggestion
- [ ] On the AI feedback panel, clicking "Save" on a vocabulary `SuggestionCard` transitions the button from `idle → saving → saved` and remains disabled in the saved state.
- [ ] After saving, navigating to `/vocabulary` shows the word at the top of the list with the same `word`, `definition`, `definition_my` (Myanmar), `example_sentence`, and a `source_entry_id` pointing back to the originating entry (verify in DB or by deleting the source entry — the row persists with `source_entry_id = NULL`).
- [ ] Clicking Save a second time on the same suggestion (or saving a duplicate word) is treated as success by the UI (button shows "saved") even though the API returns HTTP 400 `"This word is already in your vocabulary book"` — verify per `ai-feedback-panel.tsx:67-72`.
- [ ] "Save" on an `expression`-type suggestion behaves correctly per the component contract (per UI_SPEC §5, save button is "only used for vocabulary type" — confirm expressions either hide the button or behave consistently).

### View list
- [ ] `/vocabulary` shows heading "My Vocabulary Book", word count label ("N words saved"), SearchBar, and a 2-column grid on `md+` / 1-column on mobile.
- [ ] Each `WordCard` renders: word in `text-lg font-semibold`, English definition in `text-sm text-gray-600`, Myanmar definition directly beneath in `text-sm text-gray-500 mt-0.5` when present, divider, italic example sentence, trash icon button bottom-right.
- [ ] When `definition_my` is missing on a card, no placeholder text appears and the layout collapses naturally (no extra whitespace where the Myanmar line would be).
- [ ] Words are sorted by `created_at` descending (newest first).

### Search vocabulary
- [ ] Typing in the search bar issues `GET /api/vocabulary?q=…` and filters case-insensitively across `word` and `definition`.
- [ ] Search with no results shows "🔍 No words match your search." with a "Clear search" button.

### Delete
- [ ] Clicking the trash icon on a `WordCard` removes the card (with a brief "Deleted" toast per UI_SPEC §4.8) and the row is gone from the DB (`saved_words` table).
- [ ] Trying to delete via `DELETE /api/vocabulary/<id>` of a word belonging to another user returns HTTP 404 `"Word not found"`.

### Empty state
- [ ] An account with zero saved words sees: "📖 Your vocabulary book is empty. When you check your English, you can save new words here to study later."

---

## 6. Dashboard (Phase 7)

### Greeting
- [ ] Loading `/dashboard` between 05:00–11:59 local shows "Good morning!"; 12:00–17:59 "Good afternoon!"; 18:00–04:59 "Good evening!" (or whatever the actual time-bucket logic is — confirm the boundaries match the implementation).

### Stats accuracy
- [ ] The three `StatsCard`s show: 🔥 current_streak, ✍ total_words, 📓 total_entries — values match the `writing_streaks` row exactly.
- [ ] Create a new entry of N words today. `total_entries` increases by 1, `total_words` increases by exactly N, and `current_streak` either increments (if yesterday had an entry) or resets to 1 (if not).
- [ ] If the user last wrote 3+ days ago, `current_streak` is 1 after writing today (not 0, not stale).
- [ ] `longest_streak` never decreases — verify by creating an entry that would extend the longest streak, then breaking the streak; `longest_streak` retains the higher value.

### Recent entries
- [ ] Shows the 3 most recent entries in `JournalCard` compact variant (title + date + mood, no body preview, no tags).
- [ ] Each card is fully clickable and navigates to the matching `/journal/<id>`.
- [ ] "View all entries →" link navigates to `/journal`.

### Empty state (new user)
- [ ] An account with zero entries sees: "📓 Welcome to AI English Journal — Write your first entry to start your journey." with a "✏ Write Your First Entry" CTA linking to `/journal/new`. No stats cards, no recent-entries section.

### Loading
- [ ] On initial load, 3 stats-card skeletons + 3 journal-card skeletons appear with the gray-100 pulse animation before data arrives.

---

## 7. Settings (Phase 8)

### AI toggle persistence
- [ ] `/settings` renders with "AI Features" card, an `AI English Teacher` label with description, and a shadcn `Switch` reflecting the current `profiles.ai_enabled` value.
- [ ] Toggling the switch immediately issues `PUT /api/settings` with `{ ai_enabled: <new-value> }`. On success, a brief "Saved" toast appears.
- [ ] After toggling off, reloading `/settings` shows the switch still off (persisted to DB, not just local state).
- [ ] After toggling off and navigating to a journal entry, clicking "Check my English" returns the AI-disabled panel state (see §4 above).
- [ ] After toggling back on, the next "Check my English" click succeeds.
- [ ] If `PUT /api/settings` fails (simulate with the server stopped), the switch reverts to its previous value and a red Alert "Could not save settings. Please try again." appears.

### Account section
- [ ] User email is displayed in `text-sm text-gray-700` and matches the logged-in user.
- [ ] "Log Out" button signs out and redirects to `/login` (covered under §1).

---

## 8. Navigation

### Top nav (desktop, `md+`)
- [ ] Visible on all `/(app)` pages: logo+name on the left, links Dashboard / Journal / Vocabulary in the center, Settings icon + truncated email on the right.
- [ ] Active link styling: `text-green-600 font-medium` with a `border-b-2 border-green-600` underline — only the currently-active route shows it.
- [ ] Inactive links: `text-gray-500`; on hover, `text-gray-900`.
- [ ] Clicking each link navigates to the correct route (`/dashboard`, `/journal`, `/vocabulary`, `/settings`) with no full-page reload.
- [ ] Logo+name links to `/dashboard`.

### Bottom nav (mobile, `< md`)
- [ ] Bottom nav is visible only below 768px viewport; top nav drops its links above that breakpoint (logo only).
- [ ] 4 icons: Home, Journal, Words, Settings. The active one is `text-green-600`; others `text-gray-400`.
- [ ] Each icon has at least 44×44px tap target (per UI_SPEC §8.4 — verify by inspecting in DevTools).
- [ ] Bottom nav remains fixed and visible while scrolling long content; main content padding (`pb-24`) keeps content from being hidden behind it.
- [ ] Bottom nav respects `env(safe-area-inset-bottom)` on iOS (no overlap with the home indicator).

### Cross-cutting
- [ ] Auth pages (`/login`, `/signup`) render **without** the top nav or bottom nav — just the centered card.
- [ ] No nav link is broken (no 404s, no console errors on navigation).
