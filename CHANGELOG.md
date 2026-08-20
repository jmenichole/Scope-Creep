# Changelog

All notable changes to **Scope Check** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Next.js (App Router) + TypeScript product scaffold with Vitest.
- Legacy Express API and vanilla dashboard moved to `legacy/` (retained, not built).
- Rules-based Scope Check detection engine (patterns, hour estimates, confidence, flags).
- Project math: health score, renegotiation cost, auto-pause at 3 changes, escrow lock/unlock/release.
- Optional LLM provider interface (OpenAI example) with hybrid merge and graceful rules fallback.
- Supabase schema + owner-only RLS for profiles, projects, messages, analyses, renegotiations, alerts, milestones.
- Magic-link and Google sign-in (Supabase Auth) with a protected `/app` shell.
- Signed-in flows: create/list projects, analyze pasted messages, in-app alerts, pause/resume, renegotiate/approve.
- `MANUAL_STEPS.md` — numbered checklist for hosted Supabase, Google OAuth, and Vercel (accounts the agent cannot create).

### Changed
- Product name is **Scope Check** (replacing "Scope Creep" / Boundari.ai in the new app).

## [1.0.0] - 2024-12-01

Prototype Express API + static dashboard (in-memory storage). See `legacy/` after this release.

---

## Historical notes (pre-Foundation)

The original repository was a blockchain prototype that was later reimplemented as a Node.js/Express SaaS prototype (in-memory storage, vanilla dashboard). Foundation (Unreleased) replaces that Express app as the product; the Express code lives in `legacy/`.
