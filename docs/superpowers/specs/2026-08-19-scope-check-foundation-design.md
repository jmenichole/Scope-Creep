# Scope Check — Sub-project 1: Foundation (Design Spec)

Date: 2026-08-19
Status: Approved (design); pending implementation plan
Owner: jmenichole

## 1. Context

Scope Check (formerly "Scope Creep") is an AI-assisted tool that helps freelancers
detect scope creep in client messages and manage renegotiation, pausing, and
milestone escrow. The current repository is a prototype: a Node/Express API with
**in-memory storage** (data is lost on restart), a vanilla-JS dashboard in `docs/`,
and rule/regex-based detection. There is no authentication, persistence, billing,
or deployment.

The goal is a **launchable SaaS**. That is too large for a single spec, so the work
is decomposed into sub-projects (see §11). **This spec covers Sub-project 1 —
Foundation only.**

## 2. Goal

Turn the prototype into a real, multi-user, persistent, deployed web app where a
signed-in freelancer can run the complete core loop end-to-end:

> create a project → paste a client message → get a hybrid (rules + optional LLM)
> analysis → receive an in-app alert → renegotiate / pause / resume → see an updated
> project health score.

"Done" means this loop works for real accounts, against a real database, deployed to
a public URL. Payment is intentionally excluded (that is Sub-project 2).

## 3. Non-goals (explicitly out of scope for Foundation)

- Billing / Stripe / plan tiers / plan limits (Sub-project 2).
- Email or real-time notifications; **alerts are in-app only** (Sub-project 3).
- Email-forwarding, Gmail/Slack, or browser-extension intake; **manual paste only**
  (Sub-project 4).
- Screenshot/contract OCR analysis, team seats/shared workspaces.
- Wiring the marketing landing page CTAs to signup (Sub-project 3).

## 4. Architecture & key decisions

- **App:** a single **Next.js (App Router, TypeScript)** project containing both the
  UI and server logic, deployed on **Vercel**.
- **Data & auth:** **Supabase** — managed Postgres, Auth (magic link + Google), and
  **Row-Level Security (RLS)** so every query is automatically scoped to the
  authenticated user.
- **Auth methods:** magic link + Google OAuth (lowest friction). Email/password may
  be added later; not required for Foundation.
- **Domain logic:** the existing detection / renegotiation / escrow / health-score
  logic is ported into a framework-agnostic **TypeScript module** under
  `lib/domain/`, unit-tested, and invoked only from the server.
- **Hybrid detection:** a `DetectionEngine` with a rules layer (always on, zero-cost)
  and an **optional** LLM layer behind a provider-agnostic `LLMProvider` interface.
  When `LLM_API_KEY` is configured the LLM enriches detection and produces the
  legal-English rewrite; otherwise (or on any error/timeout) it falls back silently
  to rules. API keys are used server-side only and never reach the browser.

### Accepted decisions

1. **TypeScript** replaces plain JS (type safety for a real SaaS; existing logic
   ports directly).
2. The new Next.js app **replaces** the Express API and vanilla dashboard as the
   product. The static marketing landing page in `docs/` is left untouched for now.
   The old Express server and vanilla dashboard are moved to a `legacy/` folder
   rather than deleted.

### Proposed repository structure

```
app/                      # Next.js App Router routes (marketing optional, /app product)
  (auth)/                 # sign-in, callback
  app/                    # authenticated product: projects, analyze, renegotiations, alerts
  api/                    # route handlers where server actions are not a fit
lib/
  domain/                 # ported, framework-agnostic domain logic (pure TS)
    detection/            # rules engine, patterns, hour estimation, confidence
    renegotiation.ts
    escrow.ts
    healthScore.ts
  llm/                    # LLMProvider interface + provider impls (optional)
  supabase/               # server/client helpers (@supabase/ssr)
supabase/
  migrations/             # SQL migrations (source of truth for schema + RLS)
legacy/                   # old Express API + vanilla dashboard (retained, not built)
docs/                     # existing static landing page (unchanged in Foundation)
```

## 5. Data model

All tables live in Postgres and are **RLS-protected**. Every row (including child
rows) carries a `user_id` so policies stay simple and index-friendly:
`user_id = auth.uid()` for select/insert/update/delete.

- **profiles** — mirrors the Supabase auth user. `id` (= `auth.users.id`), `email`,
  `display_name`, `created_at`.
- **projects** — `id`, `user_id`, `client_name`, `freelancer_name`, `scope` (text),
  `budget` (numeric), `status` (`active|paused|completed`), `escrow_status`,
  `scope_change_count` (int), `health_score` (int), `created_at`, `paused_at`,
  `pause_reason`, `resumed_at`.
- **milestones** — `id`, `project_id`, `user_id`, `title`, `amount`,
  `payment_locked` (bool), `payment_released` (bool), `created_at`. Minimal in
  Foundation; powers escrow status + health score.
- **messages** — `id`, `project_id`, `user_id`, `sender` (`client|freelancer`),
  `body` (text), `created_at`.
- **analyses** — one per analyzed message: `id`, `message_id`, `project_id`,
  `user_id`, `is_scope_check` (bool), `is_passive_aggressive` (bool),
  `confidence` (int 0–100), `matched_patterns` (jsonb), `estimated_additional_hours`
  (numeric), `flags` (jsonb), `recommended_action` (text), `engine`
  (`rules|hybrid`), `created_at`.
- **renegotiations** — `id`, `project_id`, `user_id`, `additional_work`,
  `original_budget`, `new_quote`, `additional_cost`, `status` (`pending|approved`),
  `created_at`, `approved_at`.
- **alerts** — in-app only in Foundation: `id`, `project_id`, `user_id`, `type`,
  `severity`, `title`, `message`, `read` (bool), `created_at`, `read_at`.

Indexes: `user_id` on every table; `project_id` on child tables. Schema and RLS
policies ship as SQL migrations under `supabase/migrations/`.

## 6. Core flows (server-side, RLS-enforced)

1. **Auth.** Magic link or Google → Supabase session cookie via `@supabase/ssr`. A
   `profiles` row is upserted on first login. Requests to `/app/*` without a session
   redirect to sign-in.
2. **Create project.** Form → insert a `projects` row for the current user.
3. **Analyze message.** Paste message + choose sender → server action runs the hybrid
   engine → inserts a `messages` row + an `analyses` row → if scope check is detected,
   inserts an `alerts` row → returns the analysis to the UI.
4. **Renegotiate.** Insert a `renegotiations` row, increment `scope_change_count`, and
   **auto-pause at 3** (existing rule); insert an alert.
5. **Pause / resume.** Flip project status; lock/unlock milestone payments; insert an
   alert.
6. **Approve renegotiation.** Update project budget, append to scope, mark approved.
7. **Health score.** Recomputed from `scope_change_count`, paused state, and locked
   payments using the existing formula.
8. **Dashboard views.** Projects (with stats), Analyze Message, Renegotiations, and an
   Alerts inbox.

## 7. Hybrid detection

- **Rules layer (always on).** Ported patterns, passive-aggressive detection,
  work-hour estimation, and confidence scoring — behavior identical to today, so the
  product works with zero configuration or cost.
- **LLM layer (optional).** When `LLM_API_KEY` is set, the message is sent
  server-side to a provider (behind `LLMProvider`) requesting structured JSON:
  `{ isScopeCheck, confidence, estimatedHours, rationale, formalRewrite }`. Results
  are **merged** with the rules output (take the stronger signal; use the LLM rewrite
  for the legal-English translator). On a missing key, timeout, or any error, the
  engine falls back to rules-only. The `analyses.engine` column records which path
  ran (`rules` or `hybrid`).

## 8. Error handling

- **Zod validation** on every server action; friendly toast errors in the UI.
- **RLS** is the security backstop: even a bug that leaks a row ID cannot expose
  another user's data.
- **LLM failures never block** — they degrade to rules and surface a subtle
  "AI enhancement unavailable" note.
- **DB/auth errors** show a generic user-facing message and are logged server-side.
- **Basic rate limiting** on the analyze action to cap LLM cost and abuse.

## 9. Testing

- **Unit (Vitest):** ported domain logic — detection, confidence, hour estimation,
  health score, renegotiation math.
- **Integration:** server actions against a local Supabase, including an **RLS test**
  proving user A cannot read user B's project.
- **E2E (Playwright):** sign in with a **seeded email/password test user** (to avoid
  magic-link flakiness) → create project → analyze → see the alert.
- **Manual E2E** in the running app for the walkthrough/demo.

## 10. Deployment & external setup

- Supabase project (managed Postgres + auth); schema/RLS applied via Supabase CLI
  migrations committed to the repo.
- Vercel project linked to the repo for CI/CD deploys.
- **Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), and
  optional `LLM_API_KEY`.
- **User-performed external steps (documented, not automatable by the agent):**
  create the Supabase project, create Google OAuth credentials and paste them into
  Supabase Auth, and connect the Vercel project. Development and testing can proceed
  locally against a local Supabase instance in the meantime.

## 11. Sub-project roadmap (context)

1. **Foundation** — this spec.
2. **Billing & plans** — Stripe, Solo/Pro/Studio tiers, plan limits, checkout,
   customer portal.
3. **Notifications & polish** — real-time + email alerts, severity ranking, alerts
   inbox polish, analytics, and landing-page CTA wiring.
4. **Intake & AI expansion** — email-forwarding intake, later Gmail/Slack, deeper LLM
   features.

Each sub-project gets its own spec → implementation plan → build cycle.
