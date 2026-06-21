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

The app must feel **calm, focused, and quietly distinctive**. Language learning is vulnerable work — users are putting imperfect writing in front of an AI judge. The UI should never feel clinical, graded, or pressured, but it should also not look like every other AI-wrapper SaaS. The visual language is grounded in the bilingual correction/teaching mechanic that defines this product.

**Design principles:**

- **Dark canvas, light content.** The page is a charcoal `#16181C` reading surface, not a generic white app shell. The user's writing is what glows on it.
- **Margin / annotation as identity.** Corrections, suggestions, and Myanmar glosses live in a dedicated right-hand column separated by a 3px coral divider — the signature pattern of the app. The mechanic *is* the brand.
- **Mint means growth, coral means attention.** Mint (`#5EE39B`) carries success, correction, and progress; coral (`#FF6B4A`) marks mistakes and the annotation divider. The pair is intentional — never use red for errors or amber for warnings.
- **Bilingual is first-class, never an afterthought.** Myanmar glosses get their own warm color (`#C99A82`) so they sit visually beside — not below — the English. The script change carries the meaning; no flag icons, no "MY:" prefixes.
- **Feedback without shame.** Grammar mistakes get a soft `#3D2218` background and a coral underline, not red strikethroughs in the original text. The AI is a teacher writing in the margin, not a judge marking up the page.
- **Mobile-first writing experience.** Many users will write on their phone. The two-column annotation grid collapses to a single column with annotations inline directly after the content they describe — never hidden behind a tab or accordion.

---

## 2. Design System

> **Supersedes the original light/green theme.** Early development called for a generic green-on-white SaaS palette with Inter. This section replaces it. The new direction is **dark mode, margin/annotation**: a charcoal canvas with mint and coral accents, paired with a Bricolage Grotesque + Manrope type system. The change is deliberate — we are moving away from the "AI-generated SaaS" aesthetic toward a look grounded in the bilingual correction/teaching mechanic that defines this product. Corrections, suggestions, and Myanmar glosses are the protagonists of the interface, not afterthoughts; the visual system is built around showcasing them.

### 2.1 Color Palette

The app ships **dark-first** — there is no light theme. Hex values are authoritative. Tailwind utilities are written using arbitrary-value syntax (e.g. `bg-[#16181C]`) since these colors do not map to a default Tailwind palette; teams may register them as theme tokens (`bg-ink`, `bg-surface`, etc.) in `tailwind.config.ts` once components are built.

#### Surfaces & Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | `#16181C` | Page background — the canvas behind every screen |
| `surface` | `#1E2026` | Card / panel / input background — every elevated surface |
| `surface-border` | `#2C2F38` | Default border on cards, inputs, dividers |

#### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#F2F3F5` | Headings, primary text, high-emphasis values |
| `text-body` | `#D8DAE0` | Journal body, descriptions, paragraph copy (slightly softer than primary) |
| `text-secondary` | `#8B8F98` | Secondary text, metadata, inactive nav labels |
| `text-secondary-strong` | `#9A9DA6` | Slightly higher-contrast variant for small captions that need to stay legible on `surface` |
| `text-muted` | `#6E7280` | Tertiary text, decorative icons, very low-emphasis labels |
| `text-bilingual` | `#C99A82` | Myanmar / bilingual glosses — warm tone keeps them distinct from English secondary text without screaming |

#### Mint (Success / Correction Accent)

| Token | Hex | Usage |
|-------|-----|-------|
| `mint` | `#5EE39B` | Corrected text, success messaging, "CORRECTION" labels, mint-dot markers |
| `mint-button` | `#3DDC84` | Primary button background — slightly punchier on dark |
| `mint-button-text` | `#0A1A12` | Text/icon color on `mint-button` (dark green-black for AA contrast) |
| `mood-bg` | `#1F3D2E` | Mood badge and "selected" pill background |
| `mood-text` | `#5EE39B` | Text on `mood-bg` |

#### Coral (Error / Highlight Accent)

| Token | Hex | Usage |
|-------|-----|-------|
| `coral` | `#FF6B4A` | Mistake underlines, error text, the 3px divider in margin/annotation layouts |
| `coral-soft` | `#FF8A6E` | "MISTAKE" labels and other small coral text where pure coral is too hot |
| `mistake-bg` | `#3D2218` | Background highlight behind mistake words in the original entry text |

#### Suggestion Card

| Token | Hex | Usage |
|-------|-----|-------|
| `suggestion-bg` | `#142420` | Suggestion card background — dark green tint, distinct from `surface` |
| `suggestion-border` | `#234032` | Suggestion card border |

#### Semantic Mapping

| Purpose | Background | Text | Border |
|---------|-----------|------|--------|
| Error | `#3D2218` (mistake-bg) | `#FF8A6E` (coral-soft) | `#FF6B4A` (coral) |
| Success | `#1F3D2E` (mood-bg) | `#5EE39B` (mint) | `#234032` (suggestion-border) |
| Info / neutral | `#1E2026` (surface) | `#D8DAE0` (text-body) | `#2C2F38` (surface-border) |

There is intentionally no separate warning color: hierarchy is carried by the mint/coral pair plus the bilingual warm tone. If a future surface needs a warning state, derive it from `coral-soft` rather than introducing an amber.

---

### 2.2 Typography

Two web fonts, both from Google Fonts. No serifs — an earlier exploration of an editorial serif for headings was deliberately dropped in favor of the Bricolage Grotesque + Manrope sans pairing, which holds up better at the small sizes the margin/annotation layout demands.

**Headings:** [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), weight `600`.
**Body & UI:** [Manrope](https://fonts.google.com/specimen/Manrope), weights `400` / `500` / `600`.

```css
/* Root */
:root {
  --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-body:    'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 600; }
body            { font-family: var(--font-body);    font-weight: 400; }
```

| Role | Tailwind | Size | Weight | Color | Usage |
|------|---------|------|--------|-------|-------|
| `h1` | `font-display text-3xl` | 30px | 600 | `text-primary` `#F2F3F5` | Page titles |
| `h2` | `font-display text-2xl` | 24px | 600 | `text-primary` `#F2F3F5` | Section headings |
| `h3` | `font-display text-xl` | 20px | 600 | `text-primary` `#F2F3F5` | Card titles, sub-sections |
| `h4` | `font-display text-base` | 16px | 600 | `text-primary` `#F2F3F5` | Labels, form group titles |
| Body | `font-body text-base` | 16px | 400 | `text-body` `#D8DAE0` | Journal body, descriptions |
| Body emphasis | `font-body text-base` | 16px | 500 | `text-primary` `#F2F3F5` | Inline emphasis, corrected text |
| Small | `font-body text-sm` | 14px | 400 | `text-secondary` `#8B8F98` | Metadata, helper text |
| Caption | `font-body text-xs` | 12px | 400 | `text-muted` `#6E7280` | Timestamps, word counts |
| Link | `font-body text-sm` | 14px | 500 | `mint` `#5EE39B` | Inline links |
| Bilingual (Myanmar) | `font-body text-sm` | 14px | 400 | `text-bilingual` `#C99A82` | Myanmar glosses under English |
| Annotation label | `font-display text-xs uppercase tracking-wider` | 11px | 600 | `coral-soft` or `mint` | "CORRECTION" / "SUGGESTION" tags in the margin |

**Journal body text** uses a slightly increased line height for readability and to give Myanmar combining marks vertical room:

```css
.journal-body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.75;     /* leading-7 */
  color: #D8DAE0;        /* text-body */
}
```

---

### 2.3 Signature Layout — Margin / Annotation System

The single most distinctive pattern in this redesign. Anywhere AI corrections, suggestions, or bilingual explanations live alongside user content (journal entry view, AI feedback panel, future read-along views), the page uses a **two-column annotation grid** instead of stacking content above feedback.

**Grid (desktop, `md+`):**

```
┌──────────────────────────────────────────┐
│  CONTENT (1.3fr)  │  •  │  ANNOTATIONS   │
│                   │  •  │  (1fr)         │
│   today I went    │  •  │  CORRECTION    │
│   to the [market] │  •  │  went → went   │
│   and buy some    │  •  │  to the market │
│   [vegetable].    │  •  │  ...           │
│                   │  •  │                │
│                   │  •  │  SUGGESTION    │
│                   │  •  │  vegetable →   │
│                   │  •  │  vegetables    │
└──────────────────────────────────────────┘
```

```css
.annotation-grid {
  display: grid;
  grid-template-columns: 1.3fr 3px 1fr;
  gap: 24px;
  align-items: start;
}
```

**The divider (the 3px middle column):**
- Default: solid `#FF6B4A` (coral) bar running the full height of the grid
- Section dividers (when the grid spans long sections): linear gradient `linear-gradient(180deg, #5EE39B 0%, #FF6B4A 100%)` — mint at the top, coral at the bottom
- Never softer than 3px — the bar is a deliberate compositional element, not a hairline

**Highlights in the content column:**
- Mistake words get `background: #3D2218; border-bottom: 2px solid #FF6B4A; padding: 0 2px; border-radius: 2px;` — never plain red text
- The underline is the affordance; the background tint is the discovery cue
- On hover (desktop) or tap (mobile), the matching annotation in the right column gets a `#FF6B4A` left-border highlight so the pair is unambiguous

**Annotation cards in the right column:**
- Each annotation is a `surface` card with a small colored dot (6px) + uppercase label in the corner
- **Corrections:** dot `#FF6B4A`, label `CORRECTION` in `coral-soft #FF8A6E`. Body shows original text with `line-through` in `text-muted #6E7280`, then `→` in coral, then corrected text in `mint #5EE39B`
- **Suggestions:** card uses `suggestion-bg #142420` with `suggestion-border #234032`, a 💡 lightbulb glyph in `mint`, and `SUGGESTION` label in `mint`
- Both card variants include the English explanation followed by the Myanmar gloss in `text-bilingual #C99A82` — no icon, no prefix, the script change does the work

**Mobile (`< md`) collapse rule:**
- The two-column grid collapses to a single column
- Annotations appear **directly below** the content they relate to — never moved to a separate tab, accordion, or modal
- The mistake highlight (background + underline) stays in the content; the annotation card slots in immediately after the paragraph that contains the mistake
- The 3px coral divider becomes a horizontal 2px bar above each annotation cluster, preserving the mint→coral gradient on section breaks

This pattern applies to **every page**, not just the journal entry view. The dashboard uses it for AI tips next to the streak card; the journal list uses it for filter summaries beside entry groups; vocabulary cards mirror it for the English/Myanmar definition pairing; settings uses it for explanatory copy beside each toggle; auth pages use a single annotation in the right column ("Your entries stay private" etc.) as a brand reinforcement.

---

### 2.4 Spacing Scale

Base unit: `4px` (Tailwind's default). Use multiples consistently.

| Name | Tailwind | Value | Usage |
|------|---------|-------|-------|
| xs | `p-1` / `gap-1` | 4px | Tight icon padding, badge inner |
| sm | `p-2` / `gap-2` | 8px | Button padding (y), tag gaps |
| md | `p-4` / `gap-4` | 16px | Card padding, form field gaps |
| lg | `p-6` / `gap-6` | 24px | Annotation grid gap, card outer padding |
| xl | `p-8` / `gap-8` | 32px | Page section vertical spacing |
| 2xl | `p-12` / `gap-12` | 48px | Major page section breaks |

---

### 2.5 Border Radius Scale

| Name | Tailwind | Value | Usage |
|------|---------|-------|-------|
| sm | `rounded` | 4px | Small badges, mistake highlight rounding |
| md | `rounded-lg` | 8px | Input fields, buttons, annotation cards |
| lg | `rounded-xl` | 12px | Cards, panels, surface containers |
| xl | `rounded-2xl` | 16px | Modals, large surfaces |
| full | `rounded-full` | 9999px | Mood pills, avatar, streak badge |

---

### 2.6 Elevation

There are no traditional drop shadows on dark — they read as muddy halos. Elevation is expressed through **surface lightness plus border**.

| Level | Treatment | Usage |
|-------|-----------|-------|
| flat | `bg-ink` (no border) | Page canvas |
| raised | `bg-surface` + `border border-surface-border` | Cards, panels at rest |
| floating | `bg-surface` + `border border-surface-border` + `shadow-[0_8px_24px_rgba(0,0,0,0.45)]` | Modals, popovers, the AI feedback panel when expanded over content |
| highlight | `bg-surface` + `border border-coral` | Cards in an error or attention state |

---

## 3. Layout & Navigation

### 3.1 Overall App Structure

Two layout groups, matching the Next.js App Router structure:

**Auth layout** (`app/(auth)/layout.tsx`) — Login and Signup:
- Full-screen centered layout
- No navigation header or sidebar
- `ink` `#16181C` page background
- Content card is centered vertically and horizontally on a `surface` `#1E2026` card

**App layout** (`app/(app)/layout.tsx`) — all protected pages:
- Top navigation bar (fixed, `bg-ink #16181C`, `border-b border-surface-border #2C2F38`)
- Main content area with `max-w-3xl mx-auto px-4` container
- Bottom navigation bar on mobile (fixed, `bg-ink`, `border-t border-surface-border`)
- Page background: `ink` `#16181C`

---

### 3.2 Top Navigation Bar (Desktop)

Height: `64px`. `bg-ink #16181C` background, `border-b border-surface-border #2C2F38`. No drop shadow — elevation is carried by the border.

```
┌─────────────────────────────────────────────────────────────┐
│  🌿 AI English Journal    Dashboard  Journal  Vocabulary     │
│                                                   [Settings] │
└─────────────────────────────────────────────────────────────┘
```

| Slot | Content |
|------|---------|
| Left | Logo mark (leaf icon, `mint #5EE39B`) + app name in `font-display font-semibold text-primary #F2F3F5` |
| Center | Navigation links: Dashboard, Journal, Vocabulary |
| Right | Settings icon button + user email (truncated) |

**Active nav link style:** `text-mint #5EE39B font-medium` with a `border-b-2 border-mint` underline indicator.

**Inactive nav link style:** `text-secondary #8B8F98 hover:text-primary #F2F3F5`.

---

### 3.3 Bottom Navigation Bar (Mobile only, hidden on md+)

Height: `64px`. Fixed to bottom. `bg-ink #16181C` background, `border-t border-surface-border #2C2F38`.

| Icon | Label | Route |
|------|-------|-------|
| `LayoutDashboard` | Home | `/dashboard` |
| `BookOpen` | Journal | `/journal` |
| `BookMarked` | Words | `/vocabulary` |
| `Settings` | Settings | `/settings` |

Active icon: `text-mint #5EE39B`. Inactive: `text-muted #6E7280`.

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

**Layout:** Centered `surface` card on full-screen `ink #16181C` background. Uses the margin/annotation pattern (Section 2.3) at `md+`: the form on the left, a single quiet annotation in the right column reinforcing the brand promise (e.g. "Your entries stay private.") separated by the 3px coral divider. On mobile this collapses to a single column with the annotation below the card.

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
- shadcn/ui `Card` (`bg-surface border border-surface-border rounded-xl`, max-width `400px`) — no shadow at rest
- `CardHeader`: heading "Welcome back" in `font-display text-primary`, subtext "Sign in to continue writing" in `text-secondary`
- shadcn/ui `Input` for email (`type="email"`, placeholder `you@example.com`, `bg-ink border-surface-border text-primary placeholder:text-muted`)
- shadcn/ui `Input` for password (`type="password"`, same styling)
- shadcn/ui `Button` (full-width, `bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`) — "Log In"
- Signup link: `text-sm text-mint hover:underline`

**Error state:** Inline below the button inside an `Alert` styled with `bg-mistake-bg #3D2218 border border-coral text-coral-soft #FF8A6E`:
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
- Email input (same `bg-ink border-surface-border` styling as Login)
- Password input (placeholder: "At least 8 characters")
- Confirm Password input
- "Create Account" button (full-width, `bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`)
- Login link: `text-mint` "Already have an account? Log in →"

**Error states:**
- Passwords do not match → coral `Alert` (`bg-mistake-bg border border-coral text-coral-soft`) below confirm field
- Email already registered → coral `Alert` below button
- Weak password → coral `Alert` below button

**Success state:** Brief mint `Alert` (`bg-mood-bg #1F3D2E border border-suggestion-border text-mint`) — "Account created! Redirecting…" then redirect to `/dashboard`.

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
- `GreetingBanner`: "Good morning!" (time-based greeting, `font-display text-primary`) + motivational sub-line in `text-body`
- 3× `StatsCard`: streak (with 🔥), total words (✍), total entries (📓)
- Primary CTA `Button` (full-width on mobile, auto-width on desktop, `bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`): "✏ Write Today's Entry" → `/journal/new`
- "Recent Entries" section heading in `font-display text-primary`
- 3× `JournalCard` (compact variant, no body preview)
- "View all entries →" link to `/journal` in `text-mint`

The dashboard also uses the **margin/annotation grid** (Section 2.3) at `md+`: the stats + CTA + recent entries sit in the content column; the right column holds a single AI tip annotation card (e.g. "Yesterday you used 'although' twice — great connector!") with a mint dot and `TIP` label. On mobile the annotation drops in directly below the stats row.

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

**Loading state:** Three `StatsCard` skeletons (`bg-surface` animated pulse with `surface-border`) + three `JournalCard` skeletons.

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
- Page heading "My Journal" in `font-display text-primary` + `Button` "✏ New Entry" (`bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`, top right)
- `SearchBar` (full-width, with magnifying glass icon in `text-muted`, calls `/api/entries/search`)
- Filter row: `MoodFilter` (dropdown), `DateRangePicker` (popover with two date inputs), `TagFilter` (dropdown)
- Entry count label (`text-sm text-secondary`)
- Scrollable list of `JournalCard` (full variant with mood, tags, word count)
- Each card is fully clickable (navigates to `/journal/[id]`)

The journal list applies the **margin/annotation grid** at `md+`: cards in the content column, and an annotation in the right column summarizing the active filter set ("3 entries match · mood: happy") above a coral divider, then a short tip annotation below. On mobile the annotation appears as a single inline strip above the card list.

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

**Loading state:** 5× `JournalCard` skeleton placeholders (animated `bg-surface` pulse with `surface-border`).

**Error state:** Coral `Alert` (`bg-mistake-bg border border-coral text-coral-soft`) — "Could not load entries. Please refresh the page."

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
- Back link (`← Back` to `/journal`, `text-sm text-secondary hover:text-primary`)
- Page heading "New Journal Entry" in `font-display text-primary`
- `DatePicker` (shadcn/ui Popover + Calendar, defaults to today)
- Title `Input` (placeholder: "Give your entry a title…", `bg-ink border-surface-border text-primary placeholder:text-muted`)
- `MoodSelector` (5 pill buttons — see Section 6)
- `TagInput` (tag pills with ×, Enter-to-add)
- Body `Textarea` (min-height `240px` on desktop, `180px` on mobile; placeholder: "Write about your day…"; `leading-relaxed`; `bg-ink border-surface-border text-body`)
- Guided questions trigger link (below textarea): `💡 Not sure what to write? Get writing prompts →` — `text-sm text-mint`
- `GuidedQuestionsPanel` (hidden by default — see Section 7)
- "Save Entry" `Button` (`bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`) + "Cancel" `Button` (ghost — `text-secondary hover:text-primary hover:bg-surface`)

**Validation errors** (shown inline beneath each field):
- Empty title → `text-sm text-coral-soft #FF8A6E` "Title is required"
- Empty body → `text-sm text-coral-soft #FF8A6E` "Please write something in your entry"

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
- Back link (`← My Journal`, `text-secondary hover:text-primary`)
- Entry title (`font-display text-3xl font-semibold text-primary #F2F3F5`)
- Meta row: date, mood badge, word count (`text-sm text-secondary`, separated by `·`)
- Tag badges (small `rounded-full bg-mood-bg #1F3D2E text-mood-text #5EE39B text-xs px-2 py-0.5`)
- Divider (`<hr class="border-surface-border">`) — or, between sections, the mint-to-coral gradient divider from Section 2.3
- Body text (`.journal-body` — see typography). Mistake words use the highlight pattern from Section 2.3 (`bg-mistake-bg` + `border-b-2 border-coral`), not plain colored text.
- Action bar: "✏ Edit" `Button` (outline — `border-surface-border text-primary hover:bg-surface`), "🗑 Delete" `Button` (outline, `text-coral-soft border-surface-border hover:bg-mistake-bg`), "✨ Check my English" `Button` (`bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`)
- `AiFeedbackPanel` (see Section 7) — this is where the margin/annotation grid is most fully expressed
- Delete confirmation `AlertDialog` (shadcn/ui AlertDialog on `bg-surface`, "Are you sure? This cannot be undone.")

This is the **signature page** for the margin/annotation pattern. The entry body lives in the content column; corrections and suggestions render as annotation cards in the right column, paired with the highlighted mistakes via hover/tap. See Section 7 for the full specification.

**Loading state (initial page load):** Title and body show `bg-surface` skeleton bars.

**Error state:** "Entry not found." in `text-secondary` with link back to `/journal` in `text-mint`.

---

### 4.7 Edit Entry Page — `/journal/[id]/edit`

**Purpose:** Modify an existing journal entry.

**Layout:** Identical to New Entry page form, but pre-populated with existing values.

**Differences from New Entry:**
- Page heading: "Edit Entry" (not "New Journal Entry")
- Form pre-filled with: title, body, entry_date, mood, tags
- Buttons: "Save Changes" (`bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`) + "Cancel" (ghost — `text-secondary hover:text-primary hover:bg-surface`, navigates back to `/journal/[id]`)
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
- Page heading "My Vocabulary Book" in `font-display text-primary`
- Word count label (`text-sm text-secondary`)
- `SearchBar` (searches word and definition via `q` query param)
- 2-column grid on desktop (`grid grid-cols-1 md:grid-cols-2 gap-4`), 1-column on mobile
- `WordCard` for each saved word (see Section 5) — each card uses a mini margin/annotation pattern internally: English definition in the content area, Myanmar definition (`text-bilingual #C99A82`) directly under it
- Delete confirmation is inline on the card (single click, with a brief "Deleted" toast notification on `bg-surface border border-surface-border text-primary` — no full modal needed for a word)

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
- Page heading "Settings" in `font-display text-primary`
- "AI Features" `Card` (`bg-surface border border-surface-border rounded-xl`):
  - Row with label ("AI English Teacher" in `text-primary font-medium`), description (`text-sm text-secondary`), and shadcn/ui `Switch` (`data-[state=checked]:bg-mint`, thumb `bg-[#0A1A12]`)
  - Helper text below: explains what happens when AI is turned off (`text-sm text-secondary`)
  - Toggle updates immediately via `PUT /api/settings` on change; brief "Saved" toast on success (`bg-mood-bg border-suggestion-border text-mint`)
  - Explanatory copy lives in the right-hand annotation column at `md+` using the margin/annotation pattern, not stacked below
- "Account" `Card` (`bg-surface border border-surface-border rounded-xl`):
  - User email (`text-sm text-body`)
  - "Log Out" `Button` (outline — `border-surface-border text-primary hover:bg-mistake-bg hover:text-coral-soft hover:border-coral`) — calls `supabase.auth.signOut()` then redirects to `/login`

**Loading state:** Switch shows in a disabled/loading state while fetching current setting.

**Error state (toggle fails):** Switch reverts to previous value; coral `Alert` (`bg-mistake-bg border border-coral text-coral-soft`) — "Could not save settings. Please try again."

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
- `bg-surface #1E2026 rounded-xl border border-surface-border #2C2F38`
- Hover: `hover:border-mint/40 hover:bg-[#22252C] transition-colors` — no shadow, the border lift carries elevation
- Entire card is a `<Link>` to `/journal/[id]`
- Right side: chevron icon `→` in `text-muted #6E7280`
- Title in `font-display text-primary`; date in `text-sm text-secondary`
- Bottom row: tags as small `rounded-full bg-mood-bg #1F3D2E text-mood-text #5EE39B` pills; word count in `text-xs text-muted`

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
- Flex-wrap container with `bg-ink border border-surface-border rounded-lg`
- Existing tags: `bg-mood-bg #1F3D2E text-mood-text #5EE39B` pill with word + `×` button (`text-mood-text hover:text-coral-soft`)
- Active input field embedded in the same row, `bg-transparent text-primary placeholder:text-muted`
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
- Full-width input with magnifying glass icon on the left (Lucide `Search`, `text-muted #6E7280`)
- Clear button (Lucide `X`, `text-muted hover:text-primary`) appears when value is non-empty
- `rounded-lg border border-surface-border bg-ink text-primary placeholder:text-muted`
- Focus state: `focus:border-mint focus:ring-1 focus:ring-mint/40`

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
- `bg-surface #1E2026 rounded-xl border border-surface-border #2C2F38 p-4`
- Word: `font-display text-lg font-semibold text-primary #F2F3F5`
- English definition: `text-sm text-body #D8DAE0`
- Myanmar definition (when present): `text-sm text-bilingual #C99A82` on the line directly under the English definition, with `mt-0.5` for a tight pair. No icon, no label prefix — the script change plus the warm tone are enough to signal language.
- Horizontal divider: `border-surface-border`
- Example sentence in italics: `text-sm text-secondary #8B8F98 italic`
- Delete button: small icon button (Lucide `Trash2`, `text-muted hover:text-coral`) pinned to bottom-right

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
- `bg-surface #1E2026 rounded-xl border border-surface-border #2C2F38`
- Large centered value: `font-display text-3xl font-semibold text-primary #F2F3F5`
- Label below: `text-sm text-secondary #8B8F98`
- Icon above: emoji or Lucide icon at `text-2xl`, Lucide icons in `text-mint #5EE39B`

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

**Visual design:** Tailwind `animate-spin` circle with `border-mint #5EE39B border-t-transparent`.

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

**Visual design:** Vertically centered, `text-center py-16`. Title in `font-display text-primary`, description in `text-secondary`, optional action button in the primary mint style.

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
background: #1E2026;          /* surface */
border: 1px solid #2C2F38;    /* surface-border */
border-radius: 9999px;        /* rounded-full */
padding: 8px 16px;
color: #8B8F98;               /* text-secondary */
font-family: var(--font-body);
font-size: 14px;
```

**Selected state:**
```css
background: #1F3D2E;          /* mood-bg */
border: 2px solid #5EE39B;    /* mint */
color: #5EE39B;               /* mood-text / mint */
font-weight: 500;
```

**Hover (unselected) state:**
```css
background: #22252C;          /* surface, slightly lighter */
border-color: #6E7280;        /* text-muted */
color: #D8DAE0;               /* text-body */
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

Style: `inline-flex items-center gap-1 text-sm text-body #D8DAE0`. When rendered as a badge on a `JournalCard`, use the pill variant: `bg-mood-bg text-mood-text rounded-full px-2 py-0.5 text-xs`.

---

## 7. AI Feedback Panel UI

The AI Feedback Panel is the UI home of the AI English teacher. It appears in two contexts:
- On the **View Entry page**: grammar feedback and vocabulary suggestions
- On the **New Entry page**: guided questions and draft generation

---

### 7.1 Feedback Panel — Entry View

On the View Entry page, the feedback panel is **not a separate stacked panel below the body** the way the old spec described — it *is* the right column of the margin/annotation grid defined in Section 2.3. The user's entry body lives in the content column; corrections and suggestions render as annotation cards in the right column, paired with highlighted mistakes in the body. The "Idle" state described below is what the right column shows before the user has clicked "Check my English"; once feedback exists, the right column populates with annotation cards.

The states described below all live inside the right column at `md+` and collapse to inline blocks (directly after the paragraph containing each mistake) at mobile sizes.

**States:**

#### Idle (not yet requested)

```
┌──────────────────────────────────────────────────┐
│  ✨  [ Check my English ]                        │
│  Get grammar feedback and vocabulary tips.       │
└──────────────────────────────────────────────────┘
```

Background: `bg-suggestion-bg #142420`, border: `border border-suggestion-border #234032 rounded-xl`. Heading in `font-display text-primary`, supporting copy in `text-secondary`. "Check my English" button uses the primary mint button style.

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

- Card: `bg-surface #1E2026 rounded-lg border border-surface-border #2C2F38 p-4` with a 6px `bg-coral` dot + uppercase `CORRECTION` label in `coral-soft #FF8A6E` in the top-left corner
- Original text: `text-muted #6E7280 line-through text-sm` (muted, not red — coral is reserved for the divider and underline cues)
- `→` arrow: `text-coral text-sm`
- Corrected text: `text-mint #5EE39B text-sm font-medium`
- Explanation (English): `text-body #D8DAE0 text-sm mt-2` — English remains the visual anchor
- Explanation (Myanmar, `explanation_my`): `text-bilingual #C99A82 text-sm mt-1 leading-relaxed` — warm tone marks it as the gloss; `leading-relaxed` gives Myanmar combining marks vertical room
- When `explanation_my` is absent, the Myanmar line is omitted entirely — no fallback copy, no extra spacing.

**Why English-first, Myanmar-second.** Users are here to *learn English*. Reading the English explanation first reinforces the target language; the Myanmar line is a comprehension safety net, not the primary information. Visually subordinating it (warm bilingual tone, no icon) keeps the focus on English without hiding the safety net from learners who need it.

**Same treatment in `SuggestionCard`.** The `reason` (💬 prefix) line uses the same English-then-Myanmar pairing with identical typography — `text-body` for English, `text-bilingual leading-relaxed mt-1` for Myanmar — but on the `suggestion-bg #142420 border-suggestion-border #234032` card surface so the suggestion is visually distinct from the correction.

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

The "no mistakes" message uses `text-mint #5EE39B` and a ✅ to make it feel encouraging, not empty. It sits in the right column as a small `bg-mood-bg` card with a mint dot.

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

- Each question has its own small `Textarea` (`min-height: 60px`, `bg-ink border-surface-border text-body`)
- "Create my draft" is disabled until at least one answer is filled. Enabled: `bg-[#3DDC84] hover:bg-mint text-[#0A1A12]`.
- The whole guided questions panel uses `bg-suggestion-bg #142420 border border-suggestion-border #234032 rounded-xl` to match the AI feedback surface family

**Step 4: Loading (calling `/api/ai/draft`)**

```
┌──────────────────────────────────────────────────────────┐
│  ✨  Writing your draft…  ○                              │
└──────────────────────────────────────────────────────────┘
```

**Step 5: Draft created**

The generated draft text is inserted directly into the main body `Textarea`. The guided questions panel closes. A small mint `Alert` (`bg-mood-bg border-suggestion-border text-mint`) flashes briefly at the top:

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
| Page container | `px-4` | `max-w-5xl mx-auto px-4` — wider than before to accommodate the annotation column |
| Margin/annotation grid | Single column; annotation cards inline directly below the content they describe | Two columns `1.3fr 3px 1fr` with coral divider |
| Dashboard stats | Stack vertically (1 column) | 3 columns side-by-side; AI tip annotation moves to right column |
| Journal list | Full-width cards; filter summary as a strip above the list | Cards in content column; filter summary + tip in right column |
| New entry textarea | `min-h-[180px]` | `min-h-[240px]` |
| Mood selector | Wrap to 2–3 per row | All 5 in one row |
| Vocabulary grid | 1 column | 2 columns |
| AI feedback panel (View Entry) | Annotation cards inline after the paragraph that contains the matching mistake | Annotation cards in the right column of the margin/annotation grid |
| Guided questions panel | Full-width, scrollable, on `bg-suggestion-bg` | Full-width inside the New Entry content column |
| Auth pages | Card centered; brand annotation below | Card on the left, brand annotation in the right column |

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
  background: #16181C;                       /* ink */
  border-top: 1px solid #2C2F38;             /* surface-border */
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
```

This ensures the save button is always reachable without scrolling.
