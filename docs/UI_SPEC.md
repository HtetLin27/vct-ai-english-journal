# AI English Journal — UI Specification

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Layout & Navigation](#3-layout--navigation)
4. [Pages](#4-pages)
   - [Login](#41-login-page--login)
   - [Signup](#42-signup-page--signup)
   - [Dashboard](#43-dashboard-page--dashboard)
   - [Journal List](#44-journal-list-page--journal)
   - [New Entry](#45-new-entry-page--journalnew)
   - [View Entry](#46-view-entry-page--journalid)
   - [Edit Entry](#47-edit-entry-page--journalidedit)
   - [Vocabulary](#48-vocabulary-page--vocabulary)
   - [Settings](#49-settings-page--settings)
5. [Reusable Components](#5-reusable-components)
6. [Mood Selector UI](#6-mood-selector-ui)
7. [AI Feedback Panel UI](#7-ai-feedback-panel-ui)
8. [Mobile Responsiveness](#8-mobile-responsiveness)

---

## 1. Design Philosophy

The app must feel **calm, clean, and encouraging**. Language learning is vulnerable work — users are putting imperfect writing in front of an AI judge. The UI should never feel clinical, graded, or pressured.

**Design principles:**

- **Generous whitespace.** Give content room to breathe. Never crowd the screen.
- **Green means growth.** Green is the primary brand color — it signals life, progress, and encouragement, not warnings.
- **Friendly, not formal.** Rounded corners, soft shadows, warm gray tones. Avoid sharp edges and stark blacks.
- **Feedback without shame.** Grammar corrections are shown as suggestions, not red marks. The AI is a teacher, not a judge.
- **Mobile-first writing experience.** Many users will write on their phone. The textarea and save flow must feel natural at small sizes.

---

## 2. Design System

### 2.1 Color Palette

All colors map to Tailwind CSS utility classes for direct use with shadcn/ui.

#### Brand Green

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `green-50` | `bg-green-50` | `#f0fdf4` | Page section tints, AI panel background |
| `green-100` | `bg-green-100` | `#dcfce7` | Selected state fills, streak badge bg |
| `green-200` | `border-green-200` | `#bbf7d0` | Selected state borders |
| `green-500` | `text-green-500` | `#22c55e` | Icons, active dots, inline accents |
| `green-600` | `bg-green-600` | `#16a34a` | Primary buttons, links, key actions |
| `green-700` | `bg-green-700` | `#15803d` | Primary button hover state |
| `green-800` | `text-green-800` | `#166534` | Text on green-100 backgrounds |

#### Neutrals

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `white` | `bg-white` | `#ffffff` | Card surfaces, input fields, panels |
| `gray-50` | `bg-gray-50` | `#f9fafb` | App page background |
| `gray-100` | `bg-gray-100` | `#f3f4f6` | Subtle section dividers, skeleton loaders |
| `gray-200` | `border-gray-200` | `#e5e7eb` | Default borders, dividers |
| `gray-400` | `text-gray-400` | `#9ca3af` | Decorative icons only (must be `aria-hidden`). Fails WCAG AA contrast for text on white (≈2.8:1) — do not use for any text users need to read |
| `gray-500` | `text-gray-500` | `#6b7280` | Secondary text, metadata, captions, placeholder text, inactive nav labels, word counts |
| `gray-700` | `text-gray-700` | `#374151` | Body text |
| `gray-900` | `text-gray-900` | `#111827` | Headings, primary text |

#### Semantic Colors

| Purpose | Background | Text / Border | Tailwind |
|---------|-----------|--------------|---------|
| Error | `#fef2f2` | `#dc2626` | `bg-red-50 text-red-600 border-red-200` |
| Warning | `#fffbeb` | `#d97706` | `bg-amber-50 text-amber-600 border-amber-200` |
| Success | `#f0fdf4` | `#16a34a` | `bg-green-50 text-green-600 border-green-200` |
| Info | `#eff6ff` | `#2563eb` | `bg-blue-50 text-blue-600 border-blue-200` |

---

### 2.2 Typography

**Font family:** Inter (Google Fonts) — loaded via `<link>` in the root layout.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

| Role | Tailwind | Size | Weight | Color | Usage |
|------|---------|------|--------|-------|-------|
| `h1` | `text-3xl font-bold` | 30px | 700 | `gray-900` | Page titles |
| `h2` | `text-2xl font-semibold` | 24px | 600 | `gray-900` | Section headings |
| `h3` | `text-xl font-semibold` | 20px | 600 | `gray-800` | Card titles, sub-sections |
| `h4` | `text-base font-semibold` | 16px | 600 | `gray-800` | Labels, form group titles |
| Body | `text-base font-normal` | 16px | 400 | `gray-700` | Journal body, descriptions |
| Small | `text-sm font-normal` | 14px | 400 | `gray-500` | Metadata, captions, helper text |
| Caption | `text-xs font-normal` | 12px | 400 | `gray-500` | Timestamps, word counts |
| Link | `text-sm font-medium` | 14px | 500 | `green-600` | Inline links |

**Journal body text** uses a slightly increased line height for readability:

```css
.journal-body {
  font-size: 16px;
  line-height: 1.75;   /* leading-7 */
  color: #374151;       /* gray-700 */
}
```

---

### 2.3 Spacing Scale

Base unit: `4px` (Tailwind's default). Use multiples consistently.

| Name | Tailwind | Value | Usage |
|------|---------|-------|-------|
| xs | `p-1` / `gap-1` | 4px | Tight icon padding, badge inner |
| sm | `p-2` / `gap-2` | 8px | Button padding (y), tag gaps |
| md | `p-4` / `gap-4` | 16px | Card padding, form field gaps |
| lg | `p-6` / `gap-6` | 24px | Section gaps, card outer padding |
| xl | `p-8` / `gap-8` | 32px | Page section vertical spacing |
| 2xl | `p-12` / `gap-12` | 48px | Major page section breaks |

---

### 2.4 Border Radius Scale

| Name | Tailwind | Value | Usage |
|------|---------|-------|-------|
| sm | `rounded` | 4px | Small badges, subtle rounding |
| md | `rounded-lg` | 8px | Input fields, buttons |
| lg | `rounded-xl` | 12px | Cards, panels |
| xl | `rounded-2xl` | 16px | Modals, large surfaces |
| full | `rounded-full` | 9999px | Mood pills, avatar, streak badge |

---

### 2.5 Shadow Scale

| Name | Tailwind | Usage |
|------|---------|-------|
| None | — | Form inputs (use border instead) |
| sm | `shadow-sm` | Cards at rest |
| md | `shadow-md` | Dropdowns, popovers |
| lg | `shadow-lg` | Modals, AI feedback panel |

---

## 3. Layout & Navigation

### 3.1 Overall App Structure

Two layout groups, matching the Next.js App Router structure:

**Auth layout** (`app/(auth)/layout.tsx`) — Login and Signup:
- Full-screen centered layout
- No navigation header or sidebar
- Soft gray-50 background
- Content card is centered vertically and horizontally

**App layout** (`app/(app)/layout.tsx`) — all protected pages:
- Top navigation bar (fixed, white, border-bottom)
- Main content area with `max-w-3xl mx-auto px-4` container
- Bottom navigation bar on mobile (fixed, white, border-top)
- Page background: `gray-50`

---

### 3.2 Top Navigation Bar (Desktop)

Height: `64px`. White background (`bg-white`), bottom border (`border-b border-gray-200`), `shadow-sm`.

```
┌─────────────────────────────────────────────────────────────┐
│  🌿 AI English Journal    Dashboard  Journal  Vocabulary     │
│                                                   [Settings] │
└─────────────────────────────────────────────────────────────┘
```

| Slot | Content |
|------|---------|
| Left | Logo mark (leaf icon, green-600) + app name in `font-semibold text-gray-900` |
| Center | Navigation links: Dashboard, Journal, Vocabulary |
| Right | Settings icon button + user email (truncated) |

**Active nav link style:** `text-green-600 font-medium` with a `border-b-2 border-green-600` underline indicator.

**Inactive nav link style:** `text-gray-500 hover:text-gray-900`.

---

### 3.3 Bottom Navigation Bar (Mobile only, hidden on md+)

Height: `64px`. Fixed to bottom. White background, top border.

| Icon | Label | Route |
|------|-------|-------|
| `LayoutDashboard` | Home | `/dashboard` |
| `BookOpen` | Journal | `/journal` |
| `BookMarked` | Words | `/vocabulary` |
| `Settings` | Settings | `/settings` |

Active icon: `text-green-600`. Inactive: `text-gray-400`.

---

### 3.4 Page Container

All main content is wrapped in:

```html
<main class="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
  <!-- pb-24 on mobile to clear the bottom nav bar -->
</main>
```

---

## 4. Pages

---

### 4.1 Login Page — `/login`

**Purpose:** Allow existing users to sign in with email and password.

**Layout:** Centered card on full-screen gray-50 background.

```
┌──────────────────────────────────────────┐
│                                          │
│       🌿  AI English Journal             │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Welcome back                      │  │
│  │  Sign in to continue writing       │  │
│  │                                    │  │
│  │  Email address                     │  │
│  │  [______________________________]  │  │
│  │                                    │  │
│  │  Password                          │  │
│  │  [______________________________]  │  │
│  │                                    │  │
│  │  [      Log In      ]              │  │
│  │                                    │  │
│  │  Don't have an account? Sign up →  │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

**Components:**
- Logo mark + app name (centered above card)
- shadcn/ui `Card` (`rounded-xl shadow-sm`, max-width `400px`)
- `CardHeader`: heading "Welcome back", subtext "Sign in to continue writing"
- shadcn/ui `Input` for email (`type="email"`, placeholder `you@example.com`)
- shadcn/ui `Input` for password (`type="password"`)
- shadcn/ui `Button` (full-width, `bg-green-600 hover:bg-green-700`) — "Log In"
- Signup link: `text-sm text-green-600 hover:underline`

**Error state:** Inline below the button inside a red-50 `Alert` component:
```
⚠  Invalid email or password. Please try again.
```

**Loading state:** Button text changes to "Logging in…" and is disabled. No spinner — keep it simple.

---

### 4.2 Signup Page — `/signup`

**Purpose:** Allow new users to create an account.

**Layout:** Identical structure to Login.

**Components:**
- Heading: "Create your account", subtext: "Start your English writing journey"
- Email input
- Password input (placeholder: "At least 8 characters")
- Confirm Password input
- "Create Account" button (full-width, green-600)
- Login link: "Already have an account? Log in →"

**Error states:**
- Passwords do not match → red `Alert` below confirm field
- Email already registered → red `Alert` below button
- Weak password → red `Alert` below button

**Success state:** Brief green `Alert` — "Account created! Redirecting…" then redirect to `/dashboard`.

---

### 4.3 Dashboard Page — `/dashboard`

**Purpose:** Give the user a motivating daily overview — their streak, stats, and a prominent call to action to write today's entry.

**Layout:**

```
┌───────────────────────────────────────────────┐
│  Good morning!  Keep up your great work 🌱    │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 🔥 7     │  │ ✍ 8,340  │  │ 📓 42    │   │
│  │ Day streak│  │ words    │  │ entries  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  [ ✏  Write Today's Entry ]  ← green button  │
│                                               │
│  Recent Entries                               │
│  ┌─────────────────────────────────────────┐ │
│  │ My first day at work     Jun 14  😊  →  │ │
│  ├─────────────────────────────────────────┤ │
│  │ Weekend market trip       Jun 13  🤩  →  │ │
│  ├─────────────────────────────────────────┤ │
│  │ Feeling tired today       Jun 12  😴  →  │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  View all entries →                           │
└───────────────────────────────────────────────┘
```

**Components:**
- `GreetingBanner`: "Good morning!" (time-based greeting) + motivational sub-line
- 3× `StatsCard`: streak (with 🔥), total words (✍), total entries (📓)
- Primary CTA `Button` (full-width on mobile, auto-width on desktop): "✏ Write Today's Entry" → `/journal/new`
- "Recent Entries" section heading
- 3× `JournalCard` (compact variant, no body preview)
- "View all entries →" link to `/journal`

**Empty state** (new user, no entries yet):

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   📓  Welcome to AI English Journal                 │
│   Write your first entry to start your journey.    │
│                                                     │
│   [ ✏  Write Your First Entry ]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Loading state:** Three `StatsCard` skeletons (gray-100 animated pulse) + three `JournalCard` skeletons.

---

### 4.4 Journal List Page — `/journal`

**Purpose:** Browse, search, and filter all past journal entries.

**Layout:**

```
┌───────────────────────────────────────────────────────┐
│  My Journal                         [ ✏ New Entry ]   │
│                                                       │
│  🔍 [Search your entries…                          ]  │
│                                                       │
│  Filters:  [Mood ▼]  [Date range ▼]  [Tag ▼]        │
│                                                       │
│  42 entries                                           │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │ My first day at work               Jun 14     │   │
│  │ 😊 happy  · work  · 142 words              →  │   │
│  ├───────────────────────────────────────────────┤   │
│  │ Weekend market trip                Jun 13     │   │
│  │ 🤩 excited  · travel  · 220 words          →  │   │
│  └───────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

**Components:**
- Page heading "My Journal" + `Button` "✏ New Entry" (green-600, top right)
- `SearchBar` (full-width, with magnifying glass icon, calls `/api/entries/search`)
- Filter row: `MoodFilter` (dropdown), `DateRangePicker` (popover with two date inputs), `TagFilter` (dropdown)
- Entry count label (`text-sm text-gray-500`)
- Scrollable list of `JournalCard` (full variant with mood, tags, word count)
- Each card is fully clickable (navigates to `/journal/[id]`)

**Empty state (no entries):**

```
📓  You haven't written anything yet.
Write your first journal entry and start your journey!
[ Write First Entry ]
```

**Empty state (search returns no results):**

```
🔍  No entries match your search.
Try different keywords or clear the filters.
[ Clear Filters ]
```

**Loading state:** 5× `JournalCard` skeleton placeholders (animated gray-100 pulse).

**Error state:** Red `Alert` — "Could not load entries. Please refresh the page."

---

### 4.5 New Entry Page — `/journal/new`

**Purpose:** The primary writing screen. Users write their journal entry here. The AI guided-question flow is also triggered from this page.

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  ← Back           New Journal Entry                     │
│                                                         │
│  Date:  [ June 14, 2026  ▼ ]                           │
│                                                         │
│  Title                                                  │
│  [___________________________________________________]  │
│                                                         │
│  How are you feeling?                                   │
│  [ 😊 Happy ] [ 😢 Sad ] [ 😐 Neutral ] [ 🤩 Excited ] [ 😴 Tired ]
│                                                         │
│  Tags  (press Enter to add)                             │
│  [work ×]  [family ×]  [___________]                   │
│                                                         │
│  What happened today?                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │                                                 │   │
│  │                                                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│  💡 Not sure what to write?  Get writing prompts →     │
│                                                         │
│  [ Save Entry ]         [ Cancel ]                      │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- Back link (`← Back` to `/journal`, `text-sm text-gray-500 hover:text-gray-900`)
- Page heading "New Journal Entry"
- `DatePicker` (shadcn/ui Popover + Calendar, defaults to today)
- Title `Input` (placeholder: "Give your entry a title…")
- `MoodSelector` (5 pill buttons — see Section 6)
- `TagInput` (tag pills with ×, Enter-to-add)
- Body `Textarea` (min-height `240px` on desktop, `180px` on mobile; placeholder: "Write about your day…"; `leading-relaxed`)
- Guided questions trigger link (below textarea): `💡 Not sure what to write? Get writing prompts →` — `text-sm text-green-600`
- `GuidedQuestionsPanel` (hidden by default — see Section 7)
- "Save Entry" `Button` (green-600) + "Cancel" `Button` (ghost/outline)

**Validation errors** (shown inline beneath each field):
- Empty title → `text-sm text-red-600` "Title is required"
- Empty body → `text-sm text-red-600` "Please write something in your entry"

**Loading state (saving):** "Save Entry" button shows "Saving…" and is disabled.

**Success state:** After save, navigate immediately to `/journal/[id]` (the new entry view page).

---

### 4.6 View Entry Page — `/journal/[id]`

**Purpose:** Read a single journal entry in full. Trigger AI feedback. Navigate to edit.

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  ← My Journal                                           │
│                                                         │
│  My first day at work                                   │
│  June 14, 2026  ·  😊 happy  ·  142 words             │
│  [work]  [life]                                         │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Today I started my new job. I was very nervous but    │
│  my colleagues were very friendly and help me a lot.   │
│  I think I will like this job…                         │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [ ✏ Edit ]   [ 🗑 Delete ]   [ ✨ Check my English ]  │
│                                                         │
│  ┌─── AI Feedback Panel (collapsed or expanded) ─────┐ │
│  │  (see Section 7)                                   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- Back link (`← My Journal`)
- Entry title (`text-3xl font-bold text-gray-900`)
- Meta row: date, mood badge, word count (`text-sm text-gray-500`, separated by `·`)
- Tag badges (small `rounded-full bg-green-100 text-green-800 text-xs px-2 py-0.5`)
- Divider (`<hr class="border-gray-200">`)
- Body text (`.journal-body` — see typography)
- Action bar: "✏ Edit" `Button` (outline), "🗑 Delete" `Button` (outline, red text), "✨ Check my English" `Button` (green-600)
- `AiFeedbackPanel` (see Section 7)
- Delete confirmation `AlertDialog` (shadcn/ui AlertDialog — "Are you sure? This cannot be undone.")

**Loading state (initial page load):** Title and body show skeleton bars.

**Error state:** "Entry not found." with link back to `/journal`.

---

### 4.7 Edit Entry Page — `/journal/[id]/edit`

**Purpose:** Modify an existing journal entry.

**Layout:** Identical to New Entry page form, but pre-populated with existing values.

**Differences from New Entry:**
- Page heading: "Edit Entry" (not "New Journal Entry")
- Form pre-filled with: title, body, entry_date, mood, tags
- Buttons: "Save Changes" (green-600) + "Cancel" (ghost, navigates back to `/journal/[id]`)
- No guided questions trigger (body is already written)

**Loading state (fetching entry data):** All input fields show skeleton placeholders while fetching.

**Success state:** After save, navigate to `/journal/[id]`.

---

### 4.8 Vocabulary Page — `/vocabulary`

**Purpose:** Browse and manage the personal vocabulary book.

**Layout:**

```
┌───────────────────────────────────────────────────────┐
│  My Vocabulary Book                                   │
│  12 words saved                                       │
│                                                       │
│  🔍 [Search words…                               ]    │
│                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ delighted           │  │ furthermore         │   │
│  │ Very pleased and    │  │ In addition to that │   │
│  │ happy.              │  │                     │   │
│  │ ─────────────────── │  │ ─────────────────── │   │
│  │ "She was delighted  │  │ "Furthermore, the   │   │
│  │  to hear the news." │  │  weather was nice." │   │
│  │            [ 🗑 ]   │  │            [ 🗑 ]   │   │
│  └─────────────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

**Components:**
- Page heading "My Vocabulary Book"
- Word count label (`text-sm text-gray-500`)
- `SearchBar` (searches word and definition via `q` query param)
- 2-column grid on desktop (`grid grid-cols-1 md:grid-cols-2 gap-4`), 1-column on mobile
- `WordCard` for each saved word (see Section 5)
- Delete confirmation is inline on the card (single click, with a brief "Deleted" toast notification — no full modal needed for a word)

**Empty state (no words saved):**

```
📖  Your vocabulary book is empty.
When you check your English, you can save
new words here to study later.
```

**Empty state (search no results):**

```
🔍  No words match your search.
[ Clear search ]
```

**Loading state:** 4× `WordCard` skeleton placeholders.

---

### 4.9 Settings Page — `/settings`

**Purpose:** Let users control their experience, specifically the AI features toggle.

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│  Settings                                            │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  AI Features                                 │   │
│  │  ─────────────────────────────────────────── │   │
│  │  AI English Teacher                          │   │
│  │  Grammar checking, vocabulary suggestions,   │   │
│  │  and writing prompts.            [ ●  ON ]   │   │
│  │                                              │   │
│  │  When AI is off, the "Check my English"      │   │
│  │  button will not appear on your entries.     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Account                                             │
│  ┌──────────────────────────────────────────────┐   │
│  │  htetlynnko27@gmail.com                      │   │
│  │                            [ Log Out ]       │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Components:**
- Page heading "Settings"
- "AI Features" `Card`:
  - Row with label ("AI English Teacher"), description (`text-sm text-gray-500`), and shadcn/ui `Switch`
  - Helper text below: explains what happens when AI is turned off
  - Toggle updates immediately via `PUT /api/settings` on change; brief "Saved" toast on success
- "Account" `Card`:
  - User email (`text-sm text-gray-700`)
  - "Log Out" `Button` (outline) — calls `supabase.auth.signOut()` then redirects to `/login`

**Loading state:** Switch shows in a disabled/loading state while fetching current setting.

**Error state (toggle fails):** Switch reverts to previous value; red `Alert` — "Could not save settings. Please try again."

---

## 5. Reusable Components

---

### `JournalCard`

**What it does:** Displays a summary of a journal entry as a clickable card. Used in the journal list and dashboard.

**Variants:**
- `full` — shows title, date, mood, tags, word count
- `compact` — shows title, date, mood only (dashboard recent entries)

**Props:**

```ts
{
  id:          string
  title:       string
  entry_date:  string       // "YYYY-MM-DD"
  mood:        string | null
  tags:        string[]
  word_count:  number
  variant?:    "full" | "compact"   // default: "full"
}
```

**Visual design:**
- White card, `rounded-xl shadow-sm border border-gray-200`
- Hover: `hover:shadow-md hover:border-green-200 transition-shadow`
- Entire card is a `<Link>` to `/journal/[id]`
- Right side: chevron icon `→` in `gray-400`
- Bottom row: tags as small green-100 pills; word count in `text-xs text-gray-400`

**Where used:** `JournalList`, Dashboard recent entries section.

---

### `MoodSelector`

**What it does:** 5-button mood picker for selecting the journal entry mood.

**Props:**

```ts
{
  value:    string | null
  onChange: (mood: string | null) => void
}
```

See full visual specification in Section 6.

**Where used:** New Entry page, Edit Entry page.

---

### `TagInput`

**What it does:** Allows users to add and remove tags as pills. Pressing Enter or comma adds the tag.

**Props:**

```ts
{
  value:    string[]
  onChange: (tags: string[]) => void
  max?:     number   // default: 10
}
```

**Visual design:**
- Flex-wrap container with gray-100 border
- Existing tags: green-100 pill with word + `×` button
- Active input field embedded in the same row
- Placeholder: "Add a tag…" (disappears when tags exist)

**Where used:** New Entry page, Edit Entry page.

---

### `SearchBar`

**What it does:** A controlled search input with debounced query updates (300ms debounce).

**Props:**

```ts
{
  value:        string
  onChange:     (value: string) => void
  placeholder?: string
}
```

**Visual design:**
- Full-width input with magnifying glass icon on the left (Lucide `Search`, `text-gray-400`)
- Clear button (Lucide `X`) appears when value is non-empty
- `rounded-lg border border-gray-200 bg-white`

**Where used:** Journal List page, Vocabulary page.

---

### `AiFeedbackPanel`

**What it does:** The AI English teacher panel. Shows grammar corrections and vocabulary suggestions for a specific journal entry. Contains the full guided-questions flow on the New Entry page.

See full specification in Section 7.

**Where used:** View Entry page (feedback), New Entry page (guided questions).

---

### `CorrectionCard`

**What it does:** Displays a single grammar correction with the original error, corrected version, and a bilingual (English + Myanmar) explanation.

**Props:**

```ts
{
  original:        string
  corrected:       string
  explanation:     string
  explanation_my?: string   // optional — older feedback rows don't have it
}
```

**Bilingual layout.** The English explanation is shown first (the primary line — these users are learning English). The Myanmar explanation sits directly below it, visually subordinate so the eye reaches for English first. When `explanation_my` is absent (legacy feedback), the Myanmar line is omitted entirely — no placeholder, no "translation unavailable" copy.

**Visual design:** See Section 7.2.

**Where used:** Inside `AiFeedbackPanel`.

---

### `SuggestionCard`

**What it does:** Displays a vocabulary or expression suggestion with a "Save word" button for vocabulary type. The reason is shown in both English and Myanmar.

**Props:**

```ts
{
  type:             "vocabulary" | "expression"
  original:         string
  suggestion:       string
  reason:           string
  reason_my?:       string   // optional — older feedback rows don't have it
  definition:       string
  example_sentence: string
  onSave?:          () => Promise<"saved" | "error">  // only used for vocabulary type
}
```

**Bilingual layout.** The `reason` line gets the same treatment as `CorrectionCard.explanation`: English first, Myanmar directly below in a softer style. If `reason_my` is missing, render English only with no placeholder. The `definition` shown inside the card stays English-only here — the Myanmar definition (`definition_my`) is captured server-side from the same suggestion when the user clicks "Save word" and surfaces later in `WordCard`.

The parent (`AiFeedbackPanel`) closes over the full suggestion when wiring `onSave`, so the card itself doesn't need `entry_id` or the suggestion object as arguments. The card uses the returned `"saved" | "error"` to drive its own button state (`idle → saving → saved | error`); the `400 "already in your vocabulary book"` case is treated as `"saved"` by the parent.

**Where used:** Inside `AiFeedbackPanel`.

---

### `WordCard`

**What it does:** Displays a saved vocabulary word with a bilingual definition, example sentence, and a delete button.

**Props:**

```ts
{
  id:               string
  word:             string
  definition:       string
  definition_my?:   string   // optional — older saved words and any future non-AI-sourced words may not have it
  example_sentence: string
  onDelete:         (id: string) => void
}
```

**Visual design:**
- White card, `rounded-xl border border-gray-200 shadow-sm p-4`
- Word: `text-lg font-semibold text-gray-900`
- English definition: `text-sm text-gray-600`
- Myanmar definition (when present): `text-sm text-gray-500` on the line directly under the English definition, with `mt-0.5` for a tight pair. No icon, no label prefix — the script change is enough to signal language.
- Horizontal divider
- Example sentence in italics: `text-sm text-gray-500 italic`
- Delete button: small icon button (Lucide `Trash2`, `text-red-400 hover:text-red-600`) pinned to bottom-right

When `definition_my` is missing, render the English definition alone — the divider and example sentence flow up naturally with no gap.

**Where used:** Vocabulary page.

---

### `StatsCard`

**What it does:** Displays a single stat (number + label + icon) for the dashboard.

**Props:**

```ts
{
  icon:  ReactNode  // emoji or Lucide icon
  value: string | number
  label: string
}
```

**Visual design:**
- White card, `rounded-xl border border-gray-200 shadow-sm`
- Large centered value: `text-3xl font-bold text-gray-900`
- Label below: `text-sm text-gray-500`
- Icon above: emoji or Lucide icon at `text-2xl`

**Where used:** Dashboard page.

---

### `LoadingSpinner`

**What it does:** Generic centered loading indicator. Used inside panels or full-page loaders.

**Props:**

```ts
{
  size?:  "sm" | "md" | "lg"   // default: "md"
  label?: string                // optional accessible label
}
```

**Visual design:** Tailwind `animate-spin` circle with `border-green-500 border-t-transparent`.

**Where used:** Any async loading state where a skeleton is not used.

---

### `EmptyState`

**What it does:** A consistent empty state display with an icon, message, and optional action button.

**Props:**

```ts
{
  icon:        string       // emoji
  title:       string
  description: string
  action?:     { label: string; href: string }
}
```

**Visual design:** Vertically centered, `text-center py-16`, muted colors.

**Where used:** Journal list, Vocabulary page, Dashboard (new user).

---

### `Navbar`

**What it does:** The top navigation bar (desktop) and bottom navigation bar (mobile).

**Props:** None — reads auth state from Supabase client session internally.

**Where used:** `app/(app)/layout.tsx`.

---

## 6. Mood Selector UI

The mood selector appears on the New Entry and Edit Entry pages. It presents 5 choices as interactive pill buttons in a single scrollable row.

### 6.1 The Five Moods

| Value | Emoji | Label |
|-------|-------|-------|
| `happy` | 😊 | Happy |
| `sad` | 😢 | Sad |
| `neutral` | 😐 | Neutral |
| `excited` | 🤩 | Excited |
| `tired` | 😴 | Tired |

### 6.2 Visual Design

Each mood is a `<button>` styled as a pill:

```
┌────────────┐
│  😊        │
│  Happy     │
└────────────┘
```

**Default (unselected) state:**
```css
background: white;
border: 1px solid #e5e7eb;   /* gray-200 */
border-radius: 9999px;        /* rounded-full */
padding: 8px 16px;
color: #6b7280;               /* gray-500 */
font-size: 14px;
```

**Selected state:**
```css
background: #dcfce7;          /* green-100 */
border: 2px solid #16a34a;   /* green-600 */
color: #166534;               /* green-800 */
font-weight: 500;
```

**Hover (unselected) state:**
```css
background: #f9fafb;          /* gray-50 */
border-color: #9ca3af;        /* gray-400 */
```

### 6.3 Layout

Desktop: All 5 pills in a single horizontal row with `gap-2`.

Mobile: Pills wrap naturally (`flex-wrap gap-2`). 2–3 per row depending on screen width.

### 6.4 Clearing the Selection

A selected mood can be deselected by clicking it again — `onChange` is called with `null`. No "clear" button is needed; the interaction is self-explanatory.

### 6.5 Mood Badge (Read-only display)

On the View Entry page and JournalCard, mood is shown as a read-only badge:

```
😊 happy
```

Style: `inline-flex items-center gap-1 text-sm text-gray-600`.

---

## 7. AI Feedback Panel UI

The AI Feedback Panel is the UI home of the AI English teacher. It appears in two contexts:
- On the **View Entry page**: grammar feedback and vocabulary suggestions
- On the **New Entry page**: guided questions and draft generation

---

### 7.1 Feedback Panel — Entry View

The panel lives below the entry action bar. It starts collapsed (idle state).

**States:**

#### Idle (not yet requested)

```
┌──────────────────────────────────────────────────┐
│  ✨  [ Check my English ]                        │
│  Get grammar feedback and vocabulary tips.       │
└──────────────────────────────────────────────────┘
```

Background: `bg-green-50`, border: `border border-green-200 rounded-xl`.

---

#### Loading

```
┌──────────────────────────────────────────────────┐
│  ✨  Checking your English…                      │
│  ○  (animated spinner)                           │
└──────────────────────────────────────────────────┘
```

---

#### Loaded — with corrections

```
┌──────────────────────────────────────────────────┐
│  ✨  Your English Feedback                       │
│                                                  │
│  Grammar Corrections  (2 found)                  │
│  ──────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────┐  │
│  │ ~~my colleagues were very friendly and~~   │  │
│  │ ~~help me a lot.~~                         │  │
│  │                                            │  │
│  │ → my colleagues were very friendly and     │  │
│  │   helped me a lot.                         │  │
│  │                                            │  │
│  │ 💡 After "were", we use past tense verbs. │  │
│  │    "Help" should be "helped".              │  │
│  │    "were" နောက်မှာ past tense verb         │  │
│  │    ကိုသုံးပါ။ "Help" က "helped"            │  │
│  │    ဖြစ်ရပါမယ်။                              │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Vocabulary Suggestions  (1 found)               │
│  ──────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────┐  │
│  │  very friendly  →  welcoming               │  │
│  │  💬 "Welcoming" sounds more natural and    │  │
│  │     expresses the same idea more precisely.│  │
│  │     "Welcoming" က ပိုသဘာဝကျပြီး အဓိပ္ပါယ်  │  │
│  │     ကို ပိုတိကျစွာဖော်ပြပါတယ်။              │  │
│  │                      [ + Save "welcoming" ]│  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  [ ↻ Refresh feedback ]                          │
└──────────────────────────────────────────────────┘
```

---

### 7.2 CorrectionCard Visual Design

```
┌──────────────────────────────────────────────────────────┐
│  Original (red, line-through):                           │
│  ~~my colleagues were very friendly and help me a lot.~~ │
│                                                          │
│  Corrected (green, slightly indented with → prefix):     │
│  → my colleagues were very friendly and helped me a lot. │
│                                                          │
│  Explanation (English, gray, 💡 prefix):                 │
│  💡 After "were", we use past tense verbs.              │
│     "Help" should be "helped".                           │
│  Myanmar translation (softer gray, sits under English,   │
│  no prefix — script change signals the language):        │
│     "were" နောက်မှာ past tense verb ကိုသုံးပါ။          │
│     "Help" က "helped" ဖြစ်ရပါမယ်။                       │
└──────────────────────────────────────────────────────────┘
```

- Card: `bg-white rounded-lg border border-gray-200 p-4`
- Original text: `text-red-500 line-through text-sm`
- Corrected text: `text-green-700 text-sm font-medium`
- Explanation (English): `text-gray-600 text-sm mt-2` — slightly darker than before so English remains the visual anchor
- Explanation (Myanmar, `explanation_my`): `text-gray-500 text-sm mt-1 leading-relaxed` — tight `mt-1` keeps the bilingual pair together; `leading-relaxed` gives Myanmar script room to breathe (combining marks need a bit more vertical space than Latin)
- When `explanation_my` is absent, the Myanmar line is omitted entirely — no fallback copy, no extra spacing.

**Why English-first, Myanmar-second.** Users are here to *learn English*. Reading the English explanation first reinforces the target language; the Myanmar line is a comprehension safety net, not the primary information. Visually subordinating it (softer color, no icon) keeps the focus on English without hiding the safety net from learners who need it.

**Same treatment in `SuggestionCard`.** The `reason` (💬 prefix) line uses the same English-then-Myanmar pairing with identical typography — `text-gray-600` for English, `text-gray-500 leading-relaxed mt-1` for Myanmar.

---

#### Loaded — no corrections (perfect entry)

```
┌──────────────────────────────────────────────────┐
│  ✨  Your English Feedback                       │
│                                                  │
│  ✅  Great job! No grammar mistakes found.       │
│      Your writing looks correct.                 │
│                                                  │
│  Vocabulary Suggestions  (1 found)               │
│  …                                               │
└──────────────────────────────────────────────────┘
```

The "no mistakes" message uses green-600 text and a ✅ to make it feel encouraging, not empty.

---

#### AI Disabled

```
┌──────────────────────────────────────────────────┐
│  AI features are turned off.                     │
│  Go to Settings to enable them.  [ Settings → ]  │
└──────────────────────────────────────────────────┘
```

---

### 7.3 Guided Questions Flow — New Entry Page

Triggered when the user clicks **"💡 Not sure what to write? Get writing prompts →"**.

**Step 1: Topic hint input**

The panel slides in below the textarea:

```
┌──────────────────────────────────────────────────────────┐
│  💡  Get writing prompts                                 │
│                                                          │
│  What happened today? (optional)                         │
│  [____________________________________________]          │
│  e.g. "work", "family dinner", "I felt tired"            │
│                                                          │
│  [ Get prompts ]    [ Cancel ]                           │
└──────────────────────────────────────────────────────────┘
```

**Step 2: Loading (calling `/api/ai/guide`)**

```
┌──────────────────────────────────────────────────────────┐
│  💡  Thinking of questions for you…  ○                   │
└──────────────────────────────────────────────────────────┘
```

**Step 3: Questions displayed**

```
┌──────────────────────────────────────────────────────────┐
│  💡  Answer these questions and we'll write a draft      │
│                                                          │
│  1. What happened today that made you feel something?    │
│     [____________________________________________]       │
│                                                          │
│  2. Was there a moment where you made a decision?        │
│     [____________________________________________]       │
│                                                          │
│  3. How do you feel right now compared to this morning?  │
│     [____________________________________________]       │
│                                                          │
│  [ ✨ Create my draft ]    [ Cancel ]                    │
└──────────────────────────────────────────────────────────┘
```

- Each question has its own small `Textarea` (`min-height: 60px`)
- "Create my draft" is disabled until at least one answer is filled

**Step 4: Loading (calling `/api/ai/draft`)**

```
┌──────────────────────────────────────────────────────────┐
│  ✨  Writing your draft…  ○                              │
└──────────────────────────────────────────────────────────┘
```

**Step 5: Draft created**

The generated draft text is inserted directly into the main body `Textarea`. The guided questions panel closes. A small green `Alert` flashes briefly at the top:

```
✅  Draft created! Review and edit it before saving.
```

The user then continues writing and editing naturally.

---

## 8. Mobile Responsiveness

### 8.1 Breakpoints

Tailwind CSS breakpoints:

| Name | Min-width | Description |
|------|-----------|-------------|
| *(default)* | 0px | Mobile, single-column |
| `sm` | 640px | Large mobile / small tablet |
| `md` | 768px | Tablet — desktop nav appears |
| `lg` | 1024px | Desktop — wider layout |

The app is designed **mobile-first**. Every component is built for mobile first, then enhanced for larger screens.

---

### 8.2 Navigation Changes

| Breakpoint | Navigation |
|-----------|-----------|
| `< md` | Bottom navigation bar (4 icons), top bar shows only logo |
| `≥ md` | Top navigation bar with text links, bottom bar hidden |

---

### 8.3 Layout Changes by Page

| Element | Mobile | Desktop (`md+`) |
|---------|--------|----------------|
| Page container | `px-4` | `max-w-3xl mx-auto px-4` |
| Dashboard stats | Stack vertically (1 column) | 3 columns side-by-side |
| Journal list | Full-width cards | Full-width cards (max-w-3xl) |
| New entry textarea | `min-h-[180px]` | `min-h-[240px]` |
| Mood selector | Wrap to 2–3 per row | All 5 in one row |
| Vocabulary grid | 1 column | 2 columns |
| AI feedback panel | Full-width below content | Full-width below content |
| Guided questions panel | Full-width, scrollable | Full-width |

---

### 8.4 Touch-Friendly Targets

- All interactive elements (buttons, nav icons, tags) have a minimum tap target of **44×44px**.
- Tag `×` delete buttons have `p-1` padding to increase their tap area.
- Bottom nav icons have `py-3` padding.

---

### 8.5 Mobile Writing Experience

The journal body textarea is the most important interaction on mobile:

- On focus, the textarea grows to fill the visible viewport above the keyboard (`min-h-[200px]`)
- Font size is `16px` minimum to prevent iOS auto-zoom
- The "Save Entry" button is sticky at the bottom of the screen on mobile:

```css
/* Mobile only */
.entry-actions {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
```

This ensures the save button is always reachable without scrolling.
