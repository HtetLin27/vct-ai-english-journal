# Changelog

Notable decisions, deviations, and deferred work. Each entry is dated and tagged with the affected phase or area.

---

## 2026-06-20 — Disabled Supabase email confirmation (dev only)

**Phase:** 2 (Authentication)
**Status:** Temporary — MUST be re-enabled before production deployment (Phase 10).

Email confirmation was turned off in the Supabase project to speed up local sign-up testing. New users sign in immediately after `supabase.auth.signUp()` without clicking a verification link.

**Toggle location:** Supabase Dashboard → Authentication → Providers → Email → Confirm email.

**Before going live (Phase 10):** flip the toggle back on, then re-test the signup flow end-to-end to confirm verification emails are sent and the redirect-after-confirmation works.
