# Scope Check (Foundation) — local run

The product is a Next.js app. The old Express API lives in `legacy/` and is not built by default.

## Local development

1. `npm install`
2. Install [Docker](https://docs.docker.com/get-docker/) and the [Supabase CLI](https://supabase.com/docs/guides/cli).
3. `supabase start` (first run downloads images).
4. Copy keys from `supabase status` into `.env.local` (see `.env.example`).
5. `supabase db reset` to apply `supabase/migrations/`.
6. `npm run dev` → [http://localhost:3000](http://localhost:3000)
7. `npm test` for unit tests. Integration/RLS tests run automatically when `.env.local` is present.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Unit tests | `npm test` |
| Production build | `npm run build` |
| E2E (needs local Supabase + `.env.local`) | `npx playwright install && npm run e2e` |

Hosted deploy, Google OAuth, and cloud Supabase project creation are **manual**. Follow **[MANUAL_STEPS.md](./MANUAL_STEPS.md)** in order.
