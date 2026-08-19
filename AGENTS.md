# AGENTS.md

## Cursor Cloud specific instructions

Boundari.ai ("Scope-Creep") is a small Node.js project with two runnable pieces:

- **Backend API** (`src/index.js`): Node.js + Express (ESM, `"type": "module"`). Storage is in-memory only — no database, cache, or external services. No `.env` or secrets are required (the only env var read is `PORT`).
- **Frontend** (`docs/`): static HTML/CSS/vanilla JS. `docs/index.html` is the marketing/landing page; `docs/dashboard.html` + `docs/dashboard.js` is an interactive dashboard that calls the API.

Standard commands live in `package.json` (`start`, `dev`, `test`) and the README. There is no lint script.

### Non-obvious caveats

- **Port alignment for the dashboard:** the API defaults to port `3000`, but `docs/dashboard.js` hardcodes the API URL to `http://localhost:3001` when served from `localhost`. To exercise the full UI → API flow, start the API on `3001`, e.g. `PORT=3001 npm run dev`. The API sends permissive CORS headers, so serving `docs/` from a different port (e.g. `python3 -m http.server 8080`) works fine.
- **Serving the frontend:** `cd docs && python3 -m http.server 8080`, then open `http://localhost:8080/dashboard.html`. A `favicon.ico` 404 in the console is expected and harmless.
- **Tests** use Node's built-in runner (`node --test`); no test framework/deps to install. In-memory storage means each server restart resets all data.
