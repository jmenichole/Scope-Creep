# Manual steps (things the agent cannot do for you)

Do these **in order**. Check each box as you go. Nothing here can be completed from this Cloud Agent VM because it needs *your* accounts (GitHub, Google Cloud, Supabase, Vercel).

Estimated time: about 20–30 minutes if you already have a Google and GitHub login.

---

## 0. Merge the Foundation PR

- [ ] Open the Foundation pull request on GitHub and merge it into `main`.
- [ ] (Optional) Rename the GitHub repository from `Scope-Creep` to `Scope-Check`:
  GitHub → **Settings** → **General** → **Repository name** → `Scope-Check` → **Rename**.
  GitHub keeps a redirect from the old name.

---

## 1. Create a hosted Supabase project (database + auth)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in (GitHub is fine).
2. Click **New project**.
3. Fill in:
   - **Name:** `scope-check`
   - **Database password:** generate a strong one and **save it in a password manager** (you will not see it again).
   - **Region:** pick the closest to you (or `East US` if unsure).
4. Wait until the project shows **Active**.
5. Open **Project Settings → API** and copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → this is `SUPABASE_SERVICE_ROLE_KEY` (**secret — never put this in the browser or commit it**)

---

## 2. Push the database schema to the hosted project

On your laptop, from this repo:

```bash
npm install -g supabase   # if you don't already have the CLI
supabase login            # browser login
supabase link --project-ref <YOUR_PROJECT_REF>
# Project ref is the short id in the Supabase URL: https://supabase.com/dashboard/project/<ref>
supabase db push
```

Confirm in the Supabase dashboard: **Table Editor** shows `profiles`, `projects`, `milestones`, `messages`, `analyses`, `renegotiations`, `alerts`.

---

## 3. Turn on Auth providers

In the Supabase dashboard → **Authentication → Providers**:

### Magic link (email)
- [ ] **Email** is enabled (default).
- [ ] For production, configure a custom SMTP under **Authentication → Emails** (otherwise magic-link emails may land in spam or be rate-limited).

### Google sign-in
- [ ] Open [Google Cloud Console](https://console.cloud.google.com/) → create (or pick) a project.
- [ ] **APIs & Services → Credentials → Create credentials → OAuth client ID**.
- [ ] Application type: **Web application**.
- [ ] **Authorized JavaScript origins:** your Vercel URL, e.g. `https://YOUR-APP.vercel.app` (add it after step 4 if you don't have it yet).
- [ ] **Authorized redirect URIs:** `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] Copy the **Client ID** and **Client Secret**.
- [ ] Back in Supabase → **Authentication → Providers → Google** → enable, paste Client ID + Secret, **Save**.

### Site URL
- [ ] Supabase → **Authentication → URL Configuration**:
  - **Site URL:** `https://YOUR-APP.vercel.app` (set this after Vercel gives you a URL; use `http://localhost:3000` until then).
  - **Redirect URLs:** add `https://YOUR-APP.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.

---

## 4. Deploy on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New → Project** → import this repository (the `main` branch after you merge).
3. Framework preset: **Next.js** (auto-detected).
4. Add environment variables (Production + Preview):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from step 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 1 (server only) |
| `LLM_API_KEY` | leave blank for now, or paste an OpenAI key later |

5. Click **Deploy**.
6. Copy the deployment URL and finish the **Site URL / Redirect URLs / Google origins** in step 3.
7. Redeploy once those URLs are saved (Vercel → **Deployments → Redeploy**) so Auth redirects match.

---

## 5. Smoke-test the live app (hello-world)

1. Open `https://YOUR-APP.vercel.app`.
2. Click **Sign in** → request a magic link to your email (or Google).
3. After landing on **Projects**, click **+ New Project**.
4. Create a project (e.g. client `acme`, scope `Build a 5-page site`, budget `6000`).
5. Go to **Analyze Message**, paste: `Can we also just add a quick blog? Real quick!`
6. You should see **Scope Check Detected!** and an item under **Alerts**.

If that loop works, Foundation is live. Billing (Stripe) is Sub-project 2 and is not part of this release.

---

## 6. Optional later

- [ ] Add `LLM_API_KEY` (OpenAI) in Vercel env vars and redeploy to turn on hybrid AI. Without it, detection still works via rules.
- [ ] Point a custom domain at Vercel, then add that domain to Supabase Auth URLs and Google origins.
- [ ] Restrict the `service_role` key to server-only (already the case if you never prefix it with `NEXT_PUBLIC_`).

---

## What you do **not** need to do

- You do **not** need to rewrite the database schema (it is in `supabase/migrations/0001_init.sql`).
- You do **not** need to build auth from scratch (magic link + Google are already wired).
- You do **not** need Stripe, email forwarding, or Slack for this release.
