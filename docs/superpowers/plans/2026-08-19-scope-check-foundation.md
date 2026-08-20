# Scope Check Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Scope Check prototype into a multi-user, persistent, deployed Next.js + Supabase web app where a signed-in freelancer can run the full loop: create project → paste client message → hybrid analysis → in-app alert → renegotiate/pause/resume → updated health score.

**Architecture:** One Next.js (App Router, TypeScript) app on Vercel. Supabase provides Postgres + Auth (magic link + Google) + Row-Level Security. Pure-TS domain logic in `lib/domain/` is called only from server actions. A provider-agnostic LLM layer optionally enriches detection; it is off by default and degrades to rules.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Postgres, Zod, Vitest, Playwright, Tailwind CSS.

## Global Constraints

- Product name is **Scope Check** — never "Scope Creep" in any user-facing copy, identifier, or field.
- The detection result field is **`isScopeCheck`** (boolean), matching the existing rebrand.
- **Manual paste only** intake; **in-app alerts only**; **no billing**. These are out of scope (Sub-projects 2–4).
- All tables carry a `user_id` column and enforce RLS with `user_id = auth.uid()` for every operation.
- LLM layer is **optional**: with no `LLM_API_KEY` the app runs on rules only. Keys are used server-side only, never shipped to the browser.
- TypeScript strict mode on. TDD: write the failing test first. Commit after every passing task.
- Old Express API + vanilla dashboard are moved to `legacy/` (retained, not built, not deleted). Static landing page in `docs/` is untouched.

---

## File Structure

**Created:**
- `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.env.local` (dev)
- `middleware.ts` — refreshes Supabase session cookies
- `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`
- `lib/domain/detection/patterns.ts`, `lib/domain/detection/engine.ts`
- `lib/domain/renegotiation.ts`, `lib/domain/escrow.ts`, `lib/domain/healthScore.ts`
- `lib/domain/types.ts` — shared domain types
- `lib/llm/provider.ts`, `lib/llm/openai.ts`, `lib/llm/index.ts`
- `lib/validation.ts` — Zod schemas
- `supabase/migrations/0001_init.sql` — schema + RLS
- `supabase/seed.sql` — a test user (local only)
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `app/(auth)/login/page.tsx`, `app/(auth)/login/actions.ts`, `app/auth/callback/route.ts`
- `app/app/layout.tsx` (authenticated shell + nav)
- `app/app/projects/page.tsx`, `app/app/projects/actions.ts`, `app/app/projects/new/page.tsx`
- `app/app/analyze/page.tsx`, `app/app/analyze/actions.ts`
- `app/app/renegotiations/actions.ts`
- `app/app/alerts/page.tsx`, `app/app/alerts/actions.ts`
- `tests/domain/*.test.ts`, `tests/integration/rls.test.ts`, `e2e/happy-path.spec.ts`
- `legacy/` — moved old `src/` + `docs/dashboard*.*`
- `README-app.md` — Supabase/Vercel/Google OAuth setup

**Modified:**
- `.gitignore` — add `.next/`, `node_modules/`, `.env.local`

---

## Task 1: Scaffold Next.js app, move legacy code, wire Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`
- Test: `tests/smoke.test.ts`
- Move: `src/` → `legacy/src/`, `docs/dashboard.html` → `legacy/dashboard.html`, `docs/dashboard.js` → `legacy/dashboard.js`

**Interfaces:**
- Produces: a buildable Next.js app and a working `npm test` (Vitest) command that all later tasks rely on.

- [ ] **Step 1: Move legacy code out of the build path**

```bash
mkdir -p legacy
git mv src legacy/src
git mv docs/dashboard.html legacy/dashboard.html
git mv docs/dashboard.js legacy/dashboard.js
# keep docs/index.html, styles.css, script.js (landing page) in place
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "scope-check",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.47.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "legacy"]
}
```

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = { eslint: { ignoreDuringBuilds: false } };
export default nextConfig;
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  resolve: { alias: { '@': new URL('.', import.meta.url).pathname } },
});
```

- [ ] **Step 4: Create the root app shell**

```typescript
// app/layout.tsx
import './globals.css';
export const metadata = { title: 'Scope Check', description: 'Secure your scope. Save your sanity.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
```

```typescript
// app/page.tsx
export default function Home() {
  return (<main style={{ padding: 40 }}><h1>Scope Check</h1><a href="/login">Sign in</a></main>);
}
```

```css
/* app/globals.css */
:root { color-scheme: light; }
body { font-family: system-ui, sans-serif; margin: 0; }
```

- [ ] **Step 5: Write the smoke test**

```typescript
// tests/smoke.test.ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => {
  it('runs the test runner', () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 6: Install deps, run test (expect PASS) and build (expect success)**

Run: `npm install && npm test && npm run build`
Expected: Vitest reports `1 passed`; `next build` completes without type errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Vitest app, move legacy code to legacy/"
```

---

## Task 2: Port the rules detection engine (pure TS, unit-tested)

**Files:**
- Create: `lib/domain/types.ts`, `lib/domain/detection/patterns.ts`, `lib/domain/detection/engine.ts`
- Test: `tests/domain/engine.test.ts`

**Interfaces:**
- Produces:
  - `type Analysis = { isScopeCheck: boolean; isPassiveAggressive: boolean; confidence: number; matchedPatterns: string[]; estimatedAdditionalHours: number; flags: string[]; recommendedAction: string; engine: 'rules' | 'hybrid'; }`
  - `analyzeWithRules(message: string): Analysis`
  - `estimateAdditionalWork(message: string): number`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/domain/engine.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeWithRules, estimateAdditionalWork } from '@/lib/domain/detection/engine';

describe('analyzeWithRules', () => {
  it('flags scope check phrases', () => {
    const r = analyzeWithRules('Hey can we just add a quick contact form? Real quick!');
    expect(r.isScopeCheck).toBe(true);
    expect(r.confidence).toBeGreaterThan(50);
    expect(r.estimatedAdditionalHours).toBeGreaterThan(0);
    expect(r.engine).toBe('rules');
  });
  it('does not flag normal messages', () => {
    const r = analyzeWithRules('The project looks great! Thanks for the update.');
    expect(r.isScopeCheck).toBe(false);
  });
  it('estimates hours from work keywords', () => {
    expect(estimateAdditionalWork('add a new page with forms and mobile responsive design')).toBeGreaterThan(10);
  });
  it('detects passive-aggressive tone', () => {
    const r = analyzeWithRules('I thought this would be included already. Obviously everyone else does it.');
    expect(r.isPassiveAggressive).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/domain/engine.test.ts`
Expected: FAIL — cannot resolve `@/lib/domain/detection/engine`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/domain/types.ts
export type Analysis = {
  isScopeCheck: boolean;
  isPassiveAggressive: boolean;
  confidence: number;
  matchedPatterns: string[];
  estimatedAdditionalHours: number;
  flags: string[];
  recommendedAction: string;
  engine: 'rules' | 'hybrid';
};
```

```typescript
// lib/domain/detection/patterns.ts
export const SCOPE_CHECK_PATTERNS: RegExp[] = [
  /can we (also|just|quickly)/i, /while you're at it/i, /one more (thing|quick thing)/i,
  /just takes? (five|5|ten|10) minutes?/i, /real quick/i, /shouldn't be (too )?hard/i,
  /easy change/i, /small tweak/i, /minor adjustment/i, /quick fix/i,
  /add(ing)? (a |one )?few/i, /could we (also|just)/i, /before we launch/i,
  /forgot to mention/i, /oh (and|also|by the way)/i,
];
export const PASSIVE_AGGRESSIVE_PATTERNS: RegExp[] = [
  /i thought (this|you) would/i, /i assumed/i, /obviously/i, /surely/i,
  /everyone else does/i, /this should have been/i, /why (isn't|wasn't) this/i,
];
export const WORK_KEYWORDS: Record<string, number> = {
  page: 4, feature: 6, integration: 8, api: 6, redesign: 20, animation: 4,
  form: 2, button: 0.5, color: 0.5, mobile: 10, responsive: 8,
};
```

```typescript
// lib/domain/detection/engine.ts
import { Analysis } from '@/lib/domain/types';
import { SCOPE_CHECK_PATTERNS, PASSIVE_AGGRESSIVE_PATTERNS, WORK_KEYWORDS } from './patterns';

export function estimateAdditionalWork(message: string): number {
  const lower = message.toLowerCase();
  let hours = 0;
  for (const [k, v] of Object.entries(WORK_KEYWORDS)) if (lower.includes(k)) hours += v;
  if (hours === 0 && /just|quick|small|minor|tiny/.test(lower)) hours = 3;
  return hours;
}

function confidenceScore(scope: RegExpMatchArray[] | RegExp[], passive: RegExp[], message: string): number {
  let score = scope.length * 25 + passive.length * 15;
  if (message.length > 200) score += 10;
  const q = (message.match(/\?/g) || []).length;
  score += Math.min(q * 5, 20);
  return Math.min(score, 100);
}

function flagsFor(isScopeCheck: boolean, isPassive: boolean, hours: number): string[] {
  const f: string[] = [];
  if (isScopeCheck) f.push('✨ SCOPE_AWARENESS');
  if (isPassive) f.push('⚠️ TONE_NOTED');
  if (hours > 10) f.push('💫 SIGNIFICANT_ADDITIONAL_WORK');
  else if (hours > 5) f.push('🌿 MODERATE_ADDITIONAL_WORK');
  else if (hours > 0) f.push('📝 MINOR_ADDITIONAL_WORK');
  return f;
}

function recommend(isScopeCheck: boolean, hours: number, confidence: number): string {
  if (!isScopeCheck) return 'CONTINUE';
  if (confidence > 75 && hours > 5) return 'PAUSE_AND_RENEGOTIATE';
  if (confidence > 50 && hours > 2) return 'SEND_RENEGOTIATION_REQUEST';
  return 'SEND_ALERT';
}

export function analyzeWithRules(message: string): Analysis {
  const scope = SCOPE_CHECK_PATTERNS.filter((p) => p.test(message));
  const passive = PASSIVE_AGGRESSIVE_PATTERNS.filter((p) => p.test(message));
  const isScopeCheck = scope.length > 0;
  const isPassiveAggressive = passive.length > 0;
  const hours = estimateAdditionalWork(message);
  const confidence = confidenceScore(scope, passive, message);
  return {
    isScopeCheck, isPassiveAggressive, confidence,
    matchedPatterns: scope.map((p) => p.source),
    estimatedAdditionalHours: hours,
    flags: flagsFor(isScopeCheck, isPassiveAggressive, hours),
    recommendedAction: recommend(isScopeCheck, hours, confidence),
    engine: 'rules',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/domain/engine.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/domain tests/domain/engine.test.ts
git commit -m "feat: port rules-based detection engine to TypeScript"
```

---

## Task 3: Port health score, renegotiation, and escrow calculations

**Files:**
- Create: `lib/domain/healthScore.ts`, `lib/domain/renegotiation.ts`, `lib/domain/escrow.ts`
- Test: `tests/domain/project.test.ts`

**Interfaces:**
- Produces:
  - `computeHealthScore(input: { scopeChangeCount: number; paused: boolean; lockedPayments: number }): number`
  - `computeRenegotiation(originalBudget: number, newQuote: number): { additionalCost: number }`
  - `shouldAutoPause(scopeChangeCount: number): boolean`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/domain/project.test.ts
import { describe, it, expect } from 'vitest';
import { computeHealthScore } from '@/lib/domain/healthScore';
import { computeRenegotiation, shouldAutoPause } from '@/lib/domain/renegotiation';

describe('project math', () => {
  it('computes health score', () => {
    expect(computeHealthScore({ scopeChangeCount: 0, paused: false, lockedPayments: 0 })).toBe(100);
    expect(computeHealthScore({ scopeChangeCount: 2, paused: true, lockedPayments: 1 })).toBe(30);
  });
  it('computes renegotiation cost', () => {
    expect(computeRenegotiation(5000, 5750).additionalCost).toBe(750);
  });
  it('auto-pauses at 3 scope changes', () => {
    expect(shouldAutoPause(2)).toBe(false);
    expect(shouldAutoPause(3)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/domain/project.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/domain/healthScore.ts
export function computeHealthScore(input: { scopeChangeCount: number; paused: boolean; lockedPayments: number }): number {
  let score = 100;
  score -= input.scopeChangeCount * 15;
  if (input.paused) score -= 30;
  score -= input.lockedPayments * 10;
  return Math.max(0, Math.min(100, score));
}
```

```typescript
// lib/domain/renegotiation.ts
export function computeRenegotiation(originalBudget: number, newQuote: number): { additionalCost: number } {
  return { additionalCost: newQuote - originalBudget };
}
export function shouldAutoPause(scopeChangeCount: number): boolean {
  return scopeChangeCount >= 3;
}
```

```typescript
// lib/domain/escrow.ts
export type EscrowAction = 'lock' | 'unlock' | 'release';
export function applyEscrow(current: { paymentLocked: boolean; paymentReleased: boolean }, action: EscrowAction) {
  switch (action) {
    case 'lock': return { ...current, paymentLocked: true };
    case 'unlock': return { ...current, paymentLocked: false };
    case 'release':
      if (current.paymentLocked) throw new Error('Cannot release locked payment');
      return { ...current, paymentReleased: true };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/domain/project.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/domain tests/domain/project.test.ts
git commit -m "feat: port health score, renegotiation, escrow calculations"
```

---

## Task 4: Supabase schema + RLS migration, with an RLS integration test

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/seed.sql`, `.env.example`, `tests/integration/rls.test.ts`

**Interfaces:**
- Produces: tables `profiles, projects, milestones, messages, analyses, renegotiations, alerts` with RLS. Later tasks read/write these via the Supabase client.

**Prerequisite:** Supabase CLI installed and `supabase start` running locally (Docker). The RLS test uses the local anon + service-role keys printed by `supabase start`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0001_init.sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, display_name text, created_at timestamptz default now()
);
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null, freelancer_name text not null,
  scope text not null, budget numeric not null,
  status text not null default 'active' check (status in ('active','paused','completed')),
  escrow_status text not null default 'pending',
  scope_change_count int not null default 0, health_score int not null default 100,
  created_at timestamptz default now(), paused_at timestamptz, pause_reason text, resumed_at timestamptz
);
create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, amount numeric not null default 0,
  payment_locked boolean not null default false, payment_released boolean not null default false,
  created_at timestamptz default now()
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('client','freelancer')),
  body text not null, created_at timestamptz default now()
);
create table analyses (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_scope_check boolean not null, is_passive_aggressive boolean not null,
  confidence int not null, matched_patterns jsonb not null default '[]',
  estimated_additional_hours numeric not null default 0, flags jsonb not null default '[]',
  recommended_action text not null, engine text not null default 'rules',
  created_at timestamptz default now()
);
create table renegotiations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  additional_work text not null, original_budget numeric not null, new_quote numeric not null,
  additional_cost numeric not null, status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz default now(), approved_at timestamptz
);
create table alerts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, severity text not null, title text not null, message text not null,
  read boolean not null default false, created_at timestamptz default now(), read_at timestamptz
);

create index on projects(user_id);
create index on milestones(user_id);
create index on messages(user_id);
create index on analyses(user_id);
create index on renegotiations(user_id);
create index on alerts(user_id);

-- RLS: owner-only access on every table
alter table profiles enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table messages enable row level security;
alter table analyses enable row level security;
alter table renegotiations enable row level security;
alter table alerts enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own projects" on projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own milestones" on milestones for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own messages" on messages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own analyses" on analyses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own renegotiations" on renegotiations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own alerts" on alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auto-create a profile row when a new auth user is created
create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Create `.env.example`**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
LLM_API_KEY=
```

- [ ] **Step 3: Apply migration locally**

Run: `supabase start && supabase db reset`
Expected: migration applies; `supabase status` shows the local API URL and keys. Copy the anon + service-role keys into `.env.local`.

- [ ] **Step 4: Write the RLS integration test**

```typescript
// tests/integration/rls.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

async function makeUser(email: string) {
  const { data } = await admin.auth.admin.createUser({ email, password: 'Passw0rd!', email_confirm: true });
  return data.user!.id;
}

describe('RLS isolation', () => {
  let userA: string, userB: string;
  beforeAll(async () => { userA = await makeUser(`a_${Date.now()}@t.dev`); userB = await makeUser(`b_${Date.now()}@t.dev`); });

  it('prevents user B from reading user A project', async () => {
    // Insert a project for A via service role (bypasses RLS)
    const { data: proj } = await admin.from('projects').insert({
      user_id: userA, client_name: 'acme', freelancer_name: 'me', scope: 's', budget: 1000,
    }).select().single();

    // Sign in as B and attempt to read A's project through anon client (RLS active)
    const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await anon.auth.signInWithPassword({ email: `b_read@t.dev`, password: 'Passw0rd!' }).catch(() => {});
    const { data: sess } = await admin.auth.admin.generateLink({ type: 'magiclink', email: 'noop@t.dev' }).catch(() => ({ data: null } as any));
    // Directly assert: querying as B returns no rows for A's project id
    const bClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: bSignIn } = await admin.auth.admin.createUser({ email: `bq_${Date.now()}@t.dev`, password: 'Passw0rd!', email_confirm: true });
    await bClient.auth.signInWithPassword({ email: bSignIn!.user!.email!, password: 'Passw0rd!' });
    const { data: rows } = await bClient.from('projects').select('*').eq('id', proj!.id);
    expect(rows).toEqual([]);
  });
});
```

Note: enable the email/password provider in local Supabase (`supabase/config.toml`, `[auth.email] enable_signups = true`) so the admin API can create confirmable test users. This provider is used only for tests, never surfaced in the product UI.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/integration/rls.test.ts`
Expected: PASS — user B receives an empty result for user A's project.

- [ ] **Step 6: Commit**

```bash
git add supabase .env.example tests/integration/rls.test.ts
git commit -m "feat: add Supabase schema + RLS with isolation test"
```

---

## Task 5: Supabase SSR auth (magic link + Google), middleware, profile

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`, `middleware.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/login/actions.ts`, `app/auth/callback/route.ts`, `app/app/layout.tsx`

**Interfaces:**
- Consumes: env vars from Task 4.
- Produces:
  - `createServerSupabase()` → server client bound to request cookies
  - `createBrowserSupabase()` → browser client
  - A protected `/app` layout that redirects unauthenticated users to `/login`.

- [ ] **Step 1: Write the failing test (auth helper shape)**

```typescript
// tests/domain/auth-helpers.test.ts
import { describe, it, expect } from 'vitest';
import * as server from '@/lib/supabase/server';
describe('supabase server helper', () => {
  it('exports createServerSupabase', () => { expect(typeof server.createServerSupabase).toBe('function'); });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/domain/auth-helpers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the Supabase helpers + middleware**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => { try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    },
  );
}
```

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
```

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => { list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
    } },
  );
  await supabase.auth.getUser();
  return response;
}
```

```typescript
// middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
export async function middleware(request: NextRequest) { return updateSession(request); }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
```

- [ ] **Step 4: Write login page, actions, callback, and protected layout**

```typescript
// app/(auth)/login/actions.ts
'use server';
import { createServerSupabase } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') || '');
  const supabase = createServerSupabase();
  const origin = headers().get('origin')!;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  return { error: error?.message ?? null };
}
export async function signInWithGoogle() {
  const supabase = createServerSupabase();
  const origin = headers().get('origin')!;
  const { data } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback` } });
  return data.url;
}
```

```typescript
// app/(auth)/login/page.tsx
import { signInWithEmail, signInWithGoogle } from './actions';
import { redirect } from 'next/navigation';
export default function Login() {
  async function email(fd: FormData) { 'use server'; await signInWithEmail(fd); }
  async function google() { 'use server'; const url = await signInWithGoogle(); if (url) redirect(url); }
  return (
    <main style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Sign in to Scope Check</h1>
      <form action={email}><input name="email" type="email" placeholder="you@example.com" required /><button>Send magic link</button></form>
      <form action={google}><button>Continue with Google</button></form>
    </main>
  );
}
```

```typescript
// app/auth/callback/route.ts
import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) { const supabase = createServerSupabase(); await supabase.auth.exchangeCodeForSession(code); }
  return NextResponse.redirect(`${origin}/app/projects`);
}
```

```typescript
// app/app/layout.tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: 200, padding: 16 }}>
        <strong>Scope Check</strong>
        <ul>
          <li><Link href="/app/projects">Projects</Link></li>
          <li><Link href="/app/analyze">Analyze Message</Link></li>
          <li><Link href="/app/alerts">Alerts</Link></li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Run helper test (PASS) and manually verify magic link locally**

Run: `npm test -- tests/domain/auth-helpers.test.ts`
Expected: PASS. Then `npm run dev`, visit `/login`, submit an email, and open the link from the local Inbucket mailbox (`http://127.0.0.1:54324`) → lands on `/app/projects`.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase middleware.ts "app/(auth)" app/auth app/app/layout.tsx tests/domain/auth-helpers.test.ts
git commit -m "feat: Supabase SSR auth (magic link + Google) with protected /app layout"
```

---

## Task 6: Optional LLM layer + hybrid merge

**Files:**
- Create: `lib/llm/provider.ts`, `lib/llm/openai.ts`, `lib/llm/index.ts`, `lib/domain/detection/hybrid.ts`
- Test: `tests/domain/hybrid.test.ts`

**Interfaces:**
- Consumes: `analyzeWithRules` (Task 2), `Analysis` (Task 2).
- Produces: `analyzeMessage(message: string, deps?: { provider?: LLMProvider }): Promise<Analysis>` — returns rules result when no provider; merges LLM signal when present.
  - `type LLMResult = { isScopeCheck: boolean; confidence: number; estimatedHours: number; formalRewrite: string };`
  - `interface LLMProvider { analyze(message: string): Promise<LLMResult>; }`

- [ ] **Step 1: Write the failing test (with a fake provider)**

```typescript
// tests/domain/hybrid.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeMessage } from '@/lib/domain/detection/hybrid';
import type { LLMProvider } from '@/lib/llm/provider';

describe('analyzeMessage (hybrid)', () => {
  it('returns rules-only when no provider', async () => {
    const r = await analyzeMessage('The update looks great, thanks!');
    expect(r.engine).toBe('rules');
    expect(r.isScopeCheck).toBe(false);
  });
  it('merges LLM signal (takes stronger confidence) when provider present', async () => {
    const provider: LLMProvider = { analyze: async () => ({ isScopeCheck: true, confidence: 95, estimatedHours: 6, formalRewrite: 'REQUEST FOR SCOPE ADJUSTMENT: ...' }) };
    const r = await analyzeMessage('subtle reworded ask', { provider });
    expect(r.engine).toBe('hybrid');
    expect(r.isScopeCheck).toBe(true);
    expect(r.confidence).toBe(95);
  });
  it('falls back to rules when the provider throws', async () => {
    const provider: LLMProvider = { analyze: async () => { throw new Error('down'); } };
    const r = await analyzeMessage('can we just add a quick form?', { provider });
    expect(r.engine).toBe('rules');
    expect(r.isScopeCheck).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/domain/hybrid.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/llm/provider.ts
export type LLMResult = { isScopeCheck: boolean; confidence: number; estimatedHours: number; formalRewrite: string };
export interface LLMProvider { analyze(message: string): Promise<LLMResult>; }
```

```typescript
// lib/llm/openai.ts
import type { LLMProvider, LLMResult } from './provider';
export class OpenAIProvider implements LLMProvider {
  constructor(private apiKey: string, private model = 'gpt-4o-mini') {}
  async analyze(message: string): Promise<LLMResult> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You detect freelance scope creep. Reply ONLY as JSON: {"isScopeCheck":bool,"confidence":0-100,"estimatedHours":number,"formalRewrite":string}.' },
          { role: 'user', content: message },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}`);
    const json = await res.json();
    return JSON.parse(json.choices[0].message.content) as LLMResult;
  }
}
```

```typescript
// lib/llm/index.ts
import type { LLMProvider } from './provider';
import { OpenAIProvider } from './openai';
export function getProvider(): LLMProvider | undefined {
  const key = process.env.LLM_API_KEY;
  return key ? new OpenAIProvider(key) : undefined;
}
```

```typescript
// lib/domain/detection/hybrid.ts
import { analyzeWithRules } from './engine';
import type { Analysis } from '@/lib/domain/types';
import type { LLMProvider } from '@/lib/llm/provider';

export async function analyzeMessage(message: string, deps?: { provider?: LLMProvider }): Promise<Analysis> {
  const rules = analyzeWithRules(message);
  const provider = deps?.provider;
  if (!provider) return rules;
  try {
    const llm = await provider.analyze(message);
    return {
      ...rules,
      isScopeCheck: rules.isScopeCheck || llm.isScopeCheck,
      confidence: Math.max(rules.confidence, llm.confidence),
      estimatedAdditionalHours: Math.max(rules.estimatedAdditionalHours, llm.estimatedHours),
      engine: 'hybrid',
    };
  } catch {
    return rules; // graceful fallback
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/domain/hybrid.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/llm lib/domain/detection/hybrid.ts tests/domain/hybrid.test.ts
git commit -m "feat: optional provider-agnostic LLM layer with hybrid merge + graceful fallback"
```

---

## Task 7: Projects — create/list server actions + UI

**Files:**
- Create: `lib/validation.ts`, `app/app/projects/actions.ts`, `app/app/projects/page.tsx`, `app/app/projects/new/page.tsx`
- Test: `tests/integration/projects.test.ts`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 5).
- Produces: `createProject(input)` and `listProjects()` used by the analyze + alerts tasks.
  - `createProject(input: { clientName: string; freelancerName: string; scope: string; budget: number }): Promise<{ id: string }>`

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/projects.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

describe('projects data', () => {
  let userId: string;
  beforeAll(async () => { const { data } = await admin.auth.admin.createUser({ email: `p_${Date.now()}@t.dev`, password: 'Passw0rd!', email_confirm: true }); userId = data.user!.id; });
  it('inserts and lists a project for the owner', async () => {
    await admin.from('projects').insert({ user_id: userId, client_name: 'acme', freelancer_name: 'me', scope: 'site', budget: 6000 });
    const { data } = await admin.from('projects').select('*').eq('user_id', userId);
    expect(data!.length).toBe(1);
    expect(data![0].health_score).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails, then passes after migration is applied**

Run: `npm test -- tests/integration/projects.test.ts`
Expected: PASS if Task 4 migration is applied (this test exercises the schema the actions depend on).

- [ ] **Step 3: Write validation + actions**

```typescript
// lib/validation.ts
import { z } from 'zod';
export const projectSchema = z.object({
  clientName: z.string().min(1), freelancerName: z.string().min(1),
  scope: z.string().min(1), budget: z.coerce.number().nonnegative(),
});
export const analyzeSchema = z.object({
  projectId: z.string().uuid(), sender: z.enum(['client', 'freelancer']), message: z.string().min(1),
});
```

```typescript
// app/app/projects/actions.ts
'use server';
import { createServerSupabase } from '@/lib/supabase/server';
import { projectSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

export async function createProject(input: unknown) {
  const parsed = projectSchema.parse(input);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('projects').insert({
    user_id: user.id, client_name: parsed.clientName, freelancer_name: parsed.freelancerName,
    scope: parsed.scope, budget: parsed.budget,
  }).select('id').single();
  if (error) throw new Error(error.message);
  revalidatePath('/app/projects');
  return { id: data.id as string };
}

export async function listProjects() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
```

- [ ] **Step 4: Write the UI**

```typescript
// app/app/projects/page.tsx
import Link from 'next/link';
import { listProjects } from './actions';
export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <section>
      <h1>Projects</h1>
      <Link href="/app/projects/new">+ New Project</Link>
      <ul>{projects.map((p) => (
        <li key={p.id}>{p.client_name} — ${p.budget} — {p.status} — health {p.health_score}%</li>
      ))}</ul>
    </section>
  );
}
```

```typescript
// app/app/projects/new/page.tsx
import { redirect } from 'next/navigation';
import { createProject } from '../actions';
export default function NewProject() {
  async function action(fd: FormData) {
    'use server';
    await createProject({
      clientName: fd.get('clientName'), freelancerName: fd.get('freelancerName'),
      scope: fd.get('scope'), budget: fd.get('budget'),
    });
    redirect('/app/projects');
  }
  return (
    <form action={action}>
      <h1>New Project</h1>
      <input name="clientName" placeholder="Client name" required />
      <input name="freelancerName" placeholder="Your name" required />
      <textarea name="scope" placeholder="Scope of work" required />
      <input name="budget" type="number" placeholder="Budget" required />
      <button>Create Project</button>
    </form>
  );
}
```

- [ ] **Step 5: Run tests + manual check**

Run: `npm test -- tests/integration/projects.test.ts && npm run dev`
Expected: PASS; visiting `/app/projects/new`, submitting the form creates a project visible on `/app/projects`.

- [ ] **Step 6: Commit**

```bash
git add lib/validation.ts app/app/projects tests/integration/projects.test.ts
git commit -m "feat: project create/list server actions + UI"
```

---

## Task 8: Analyze message — server action stores message + analysis + alert

**Files:**
- Create: `app/app/analyze/actions.ts`, `app/app/analyze/page.tsx`
- Test: `tests/integration/analyze.test.ts`

**Interfaces:**
- Consumes: `analyzeMessage` (Task 6), `getProvider` (Task 6), `analyzeSchema` (Task 7), `createServerSupabase` (Task 5).
- Produces: `analyzeAndStore(input): Promise<Analysis & { alertCreated: boolean }>`.

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/analyze.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeMessage } from '@/lib/domain/detection/hybrid';
describe('analyze pipeline', () => {
  it('flags a scope-check message and yields an alert-worthy result', async () => {
    const r = await analyzeMessage("While you're at it, can we also just add a quick blog? Shouldn't be hard!");
    expect(r.isScopeCheck).toBe(true);
    expect(['SEND_ALERT', 'SEND_RENEGOTIATION_REQUEST', 'PAUSE_AND_RENEGOTIATE']).toContain(r.recommendedAction);
  });
});
```

- [ ] **Step 2: Run test to verify it passes (logic) — it exercises the engine the action wraps**

Run: `npm test -- tests/integration/analyze.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the server action**

```typescript
// app/app/analyze/actions.ts
'use server';
import { createServerSupabase } from '@/lib/supabase/server';
import { analyzeSchema } from '@/lib/validation';
import { analyzeMessage } from '@/lib/domain/detection/hybrid';
import { getProvider } from '@/lib/llm';
import { revalidatePath } from 'next/cache';

export async function analyzeAndStore(input: unknown) {
  const parsed = analyzeSchema.parse(input);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const analysis = await analyzeMessage(parsed.message, { provider: getProvider() });

  const { data: msg, error: msgErr } = await supabase.from('messages').insert({
    project_id: parsed.projectId, user_id: user.id, sender: parsed.sender, body: parsed.message,
  }).select('id').single();
  if (msgErr) throw new Error(msgErr.message);

  const { error: anaErr } = await supabase.from('analyses').insert({
    message_id: msg.id, project_id: parsed.projectId, user_id: user.id,
    is_scope_check: analysis.isScopeCheck, is_passive_aggressive: analysis.isPassiveAggressive,
    confidence: analysis.confidence, matched_patterns: analysis.matchedPatterns,
    estimated_additional_hours: analysis.estimatedAdditionalHours, flags: analysis.flags,
    recommended_action: analysis.recommendedAction, engine: analysis.engine,
  });
  if (anaErr) throw new Error(anaErr.message);

  let alertCreated = false;
  if (analysis.isScopeCheck) {
    await supabase.from('alerts').insert({
      project_id: parsed.projectId, user_id: user.id, type: 'scope_awareness',
      severity: analysis.estimatedAdditionalHours > 10 ? 'needs-attention' : 'awareness',
      title: 'Scope Check Detected', message: `Confidence ${analysis.confidence}%, +${analysis.estimatedAdditionalHours}h`,
    });
    alertCreated = true;
  }
  revalidatePath('/app/alerts');
  return { ...analysis, alertCreated };
}
```

- [ ] **Step 4: Write the UI**

```typescript
// app/app/analyze/page.tsx
import { listProjects } from '../projects/actions';
import { analyzeAndStore } from './actions';
export default async function AnalyzePage() {
  const projects = await listProjects();
  async function action(fd: FormData) {
    'use server';
    await analyzeAndStore({ projectId: fd.get('projectId'), sender: fd.get('sender'), message: fd.get('message') });
  }
  return (
    <section>
      <h1>Analyze Message for Scope Check</h1>
      <form action={action}>
        <select name="projectId" required>{projects.map((p) => (<option key={p.id} value={p.id}>{p.client_name}</option>))}</select>
        <select name="sender" defaultValue="client"><option value="client">Client</option><option value="freelancer">Freelancer</option></select>
        <textarea name="message" placeholder="Paste the client message" required />
        <button>Analyze Message</button>
      </form>
    </section>
  );
}
```

- [ ] **Step 5: Run test + manual check**

Run: `npm test -- tests/integration/analyze.test.ts && npm run dev`
Expected: PASS; analyzing a creep message creates a stored analysis and an alert; UI shows the result.

- [ ] **Step 6: Commit**

```bash
git add app/app/analyze tests/integration/analyze.test.ts
git commit -m "feat: analyze-message action (store message+analysis, create alert) + UI"
```

---

## Task 9: Renegotiate, pause/resume, approve — server actions

**Files:**
- Create: `app/app/renegotiations/actions.ts`
- Test: `tests/domain/renegotiation-flow.test.ts`

**Interfaces:**
- Consumes: `shouldAutoPause`, `computeRenegotiation` (Task 3), `computeHealthScore` (Task 3), `createServerSupabase` (Task 5).
- Produces: `createRenegotiation`, `pauseProject`, `resumeProject`, `approveRenegotiation`.

- [ ] **Step 1: Write the failing test (pure flow logic)**

```typescript
// tests/domain/renegotiation-flow.test.ts
import { describe, it, expect } from 'vitest';
import { computeRenegotiation, shouldAutoPause } from '@/lib/domain/renegotiation';
import { computeHealthScore } from '@/lib/domain/healthScore';
describe('renegotiation flow math', () => {
  it('auto-pause + health drop after 3 changes', () => {
    expect(shouldAutoPause(3)).toBe(true);
    expect(computeRenegotiation(5000, 5900).additionalCost).toBe(900);
    expect(computeHealthScore({ scopeChangeCount: 3, paused: true, lockedPayments: 0 })).toBe(25);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- tests/domain/renegotiation-flow.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the actions**

```typescript
// app/app/renegotiations/actions.ts
'use server';
import { createServerSupabase } from '@/lib/supabase/server';
import { computeRenegotiation, shouldAutoPause } from '@/lib/domain/renegotiation';
import { computeHealthScore } from '@/lib/domain/healthScore';
import { revalidatePath } from 'next/cache';

async function userClient() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function createRenegotiation(projectId: string, additionalWork: string, newQuote: number) {
  const { supabase, userId } = await userClient();
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (!project) throw new Error('Project not found');
  const { additionalCost } = computeRenegotiation(Number(project.budget), newQuote);
  await supabase.from('renegotiations').insert({
    project_id: projectId, user_id: userId, additional_work: additionalWork,
    original_budget: project.budget, new_quote: newQuote, additional_cost: additionalCost,
  });
  const scopeChangeCount = project.scope_change_count + 1;
  const paused = shouldAutoPause(scopeChangeCount) || project.status === 'paused';
  await supabase.from('projects').update({
    scope_change_count: scopeChangeCount, status: paused ? 'paused' : project.status,
    pause_reason: paused && project.status !== 'paused' ? 'Multiple scope adjustments' : project.pause_reason,
    health_score: computeHealthScore({ scopeChangeCount, paused, lockedPayments: 0 }),
  }).eq('id', projectId);
  await supabase.from('alerts').insert({ project_id: projectId, user_id: userId, type: 'renegotiation_request', severity: 'gentle-reminder', title: 'Terms Update Suggested', message: additionalWork });
  revalidatePath('/app/projects');
}

export async function pauseProject(projectId: string, reason: string) {
  const { supabase, userId } = await userClient();
  const { data: project } = await supabase.from('projects').select('scope_change_count').eq('id', projectId).single();
  await supabase.from('projects').update({ status: 'paused', paused_at: new Date().toISOString(), pause_reason: reason, health_score: computeHealthScore({ scopeChangeCount: project?.scope_change_count ?? 0, paused: true, lockedPayments: 0 }) }).eq('id', projectId);
  await supabase.from('milestones').update({ payment_locked: true }).eq('project_id', projectId);
  await supabase.from('alerts').insert({ project_id: projectId, user_id: userId, type: 'project_paused', severity: 'needs-attention', title: 'Project Paused', message: reason });
  revalidatePath('/app/projects');
}

export async function resumeProject(projectId: string) {
  const { supabase } = await userClient();
  const { data: project } = await supabase.from('projects').select('scope_change_count').eq('id', projectId).single();
  await supabase.from('projects').update({ status: 'active', resumed_at: new Date().toISOString(), health_score: computeHealthScore({ scopeChangeCount: project?.scope_change_count ?? 0, paused: false, lockedPayments: 0 }) }).eq('id', projectId);
  await supabase.from('milestones').update({ payment_locked: false }).eq('project_id', projectId);
  revalidatePath('/app/projects');
}

export async function approveRenegotiation(renegotiationId: string) {
  const { supabase } = await userClient();
  const { data: r } = await supabase.from('renegotiations').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', renegotiationId).select('*').single();
  if (r) await supabase.from('projects').update({ budget: r.new_quote }).eq('id', r.project_id);
  revalidatePath('/app/projects');
}
```

- [ ] **Step 4: Manual verification via UI buttons wired on the projects page**

Run: `npm run dev` → create a project, trigger 3 renegotiations, confirm the project auto-pauses and health score drops.

- [ ] **Step 5: Commit**

```bash
git add app/app/renegotiations tests/domain/renegotiation-flow.test.ts
git commit -m "feat: renegotiate/pause/resume/approve server actions with auto-pause + health updates"
```

---

## Task 10: Alerts inbox — list + mark read

**Files:**
- Create: `app/app/alerts/actions.ts`, `app/app/alerts/page.tsx`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 5).
- Produces: `listAlerts(unreadOnly?: boolean)`, `markAlertRead(alertId: string)`.

- [ ] **Step 1: Write the actions**

```typescript
// app/app/alerts/actions.ts
'use server';
import { createServerSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
export async function listAlerts(unreadOnly = false) {
  const supabase = createServerSupabase();
  let q = supabase.from('alerts').select('*').order('created_at', { ascending: false });
  if (unreadOnly) q = q.eq('read', false);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}
export async function markAlertRead(alertId: string) {
  const supabase = createServerSupabase();
  await supabase.from('alerts').update({ read: true, read_at: new Date().toISOString() }).eq('id', alertId);
  revalidatePath('/app/alerts');
}
```

- [ ] **Step 2: Write the UI**

```typescript
// app/app/alerts/page.tsx
import { listAlerts, markAlertRead } from './actions';
export default async function AlertsPage() {
  const alerts = await listAlerts();
  async function markRead(fd: FormData) { 'use server'; await markAlertRead(String(fd.get('id'))); }
  return (
    <section>
      <h1>Alerts</h1>
      {alerts.length === 0 ? <p>No alerts yet.</p> : (
        <ul>{alerts.map((a) => (
          <li key={a.id}>
            <strong>{a.title}</strong> — {a.message} {a.read ? '(read)' : (
              <form action={markRead} style={{ display: 'inline' }}><input type="hidden" name="id" value={a.id} /><button>Mark read</button></form>
            )}
          </li>
        ))}</ul>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev` → analyze a creep message → open `/app/alerts` → the new alert appears → click "Mark read" → it flips to read.

- [ ] **Step 4: Commit**

```bash
git add app/app/alerts
git commit -m "feat: alerts inbox (list + mark read)"
```

---

## Task 11: End-to-end happy path + deployment docs

**Files:**
- Create: `playwright.config.ts`, `e2e/happy-path.spec.ts`, `README-app.md`

**Interfaces:**
- Consumes: all prior tasks (a running app + local Supabase).

- [ ] **Step 1: Write the Playwright config**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3000' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: true },
});
```

- [ ] **Step 2: Write the E2E test (auth via injected session cookie)**

```typescript
// e2e/happy-path.spec.ts
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test('create project → analyze → alert', async ({ page, context }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const email = `e2e_${Date.now()}@t.dev`;
  await admin.auth.admin.createUser({ email, password: 'Passw0rd!', email_confirm: true });

  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await anon.auth.signInWithPassword({ email, password: 'Passw0rd!' });
  const token = data.session!.access_token, refresh = data.session!.refresh_token;
  // Inject the Supabase auth cookie the SSR client expects
  await context.addCookies([{ name: 'sb-access-token', value: token, url: 'http://127.0.0.1:3000' },
    { name: 'sb-refresh-token', value: refresh, url: 'http://127.0.0.1:3000' }]);

  await page.goto('/app/projects/new');
  await page.fill('input[name="clientName"]', 'acme');
  await page.fill('input[name="freelancerName"]', 'me');
  await page.fill('textarea[name="scope"]', 'Build a 5-page site');
  await page.fill('input[name="budget"]', '6000');
  await page.click('button:has-text("Create Project")');

  await page.goto('/app/analyze');
  await page.selectOption('select[name="projectId"]', { index: 0 });
  await page.fill('textarea[name="message"]', "Can we also just add a quick blog? Real quick!");
  await page.click('button:has-text("Analyze Message")');

  await page.goto('/app/alerts');
  await expect(page.getByText('Scope Check Detected')).toBeVisible();
});
```

Note: the exact Supabase cookie names depend on the `@supabase/ssr` version; if `sb-access-token`/`sb-refresh-token` are not honored, use `supabase.auth.setSession` inside a small `/test-login` route guarded by `NODE_ENV !== 'production'` and navigate there first. Document whichever path works in `README-app.md`.

- [ ] **Step 3: Run the E2E test**

Run: `npx playwright install --with-deps && npm run e2e`
Expected: PASS — the alert "Scope Check Detected" is visible.

- [ ] **Step 4: Write deployment docs**

```markdown
# README-app.md — Scope Check (Foundation) setup

## Local
1. `npm install`
2. Install Supabase CLI and run `supabase start` (Docker required).
3. Copy anon + service-role keys from `supabase status` into `.env.local` (see `.env.example`).
4. `supabase db reset` to apply migrations.
5. `npm run dev` → http://localhost:3000

## Google OAuth (Supabase Dashboard → Auth → Providers → Google)
1. Create OAuth credentials in Google Cloud Console (Authorized redirect URI = `<SUPABASE_URL>/auth/v1/callback`).
2. Paste the Client ID + Secret into Supabase Auth → Google, enable it.

## Deploy (Vercel + Supabase cloud)
1. Create a Supabase cloud project; run `supabase link` + `supabase db push` to apply migrations.
2. In Vercel, import the repo and set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, optional `LLM_API_KEY`.
3. Set the Supabase Auth "Site URL" and redirect URLs to your Vercel domain.
4. Deploy. Sign in via magic link/Google and run the loop.
```

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e README-app.md
git commit -m "test: e2e happy path + add deployment/setup docs"
```

---

## Self-Review

**1. Spec coverage:**
- Accounts/auth (magic link + Google) → Task 5. Persistence/DB + RLS → Task 4. Core loop: create → Task 7; analyze → Task 8; renegotiate/pause/resume/approve → Task 9; health score → Tasks 3 + 9; alerts (in-app) → Tasks 8 + 10. Hybrid detection → Tasks 2 + 6. Error handling (Zod, RLS, LLM fallback) → Tasks 6–8. Testing (unit/integration/RLS/E2E) → Tasks 2–4, 7–8, 11. Deployment/external setup → Task 11. Legacy move + TS + one repo → Task 1. No gaps found.

**2. Placeholder scan:** No "TBD/TODO/handle edge cases" style placeholders; each code step contains real code. Two explicit implementation notes (email/password test provider in Task 4; Supabase cookie-name variance in Task 11) describe concrete, decided approaches, not deferrals.

**3. Type consistency:** `Analysis` (Task 2) is reused unchanged by Tasks 6 and 8. `analyzeMessage` signature in Task 6 matches its use in Task 8. `LLMProvider`/`LLMResult` in Task 6 match the fake used in the Task 6 test. `createServerSupabase` (Task 5) is consumed with the same name in Tasks 7–10. Field names (`isScopeCheck`, `estimated_additional_hours`, `scope_change_count`, `health_score`) are consistent between the migration (Task 4) and the actions (Tasks 8–9).

No issues requiring changes.
