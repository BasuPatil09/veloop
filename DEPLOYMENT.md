# Deployment Guide — Phase 8

I can't create accounts or deploy on your behalf — this is a copy-pasteable walkthrough for
the stack the architecture doc committed to: **Vercel** (frontend) + **Render** (backend) +
a managed MySQL host. Railway or Fly.io work as drop-in substitutes for Render if you prefer.

## 1. Database — PlanetScale or Railway MySQL

Either works; PlanetScale's free tier is the easiest to set up with no card required.

1. Create a database (e.g. `veloop_prod`).
2. Get the connection details: host, port, username, password, database name.
3. Keep these handy for step 3 — you'll paste them into Render's environment variables,
   never into a committed file.

## 2. Backend — Render

1. Push this repo to GitHub (see "GitHub" below if you haven't already).
2. On [render.com](https://render.com): **New → Web Service** → connect the repo.
3. Settings:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Node version**: 18+ (matches the `engines` field in `server/package.json`)
4. Environment variables (Render dashboard → Environment), using the values from step 1 plus
   fresh secrets — **do not reuse the dev secrets from `.env.example`**:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | from your MySQL host |
   | `JWT_SECRET` / `REFRESH_SECRET` | generate fresh, e.g. `openssl rand -base64 48` |
   | `CLIENT_URL` | your Vercel URL, filled in *after* step 3 (e.g. `https://veloop.vercel.app`) — no trailing slash |
   | `COOKIE_SECRET` | generate fresh |
   | `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` / `BCRYPT_SALT_ROUNDS` | defaults from `.env.example` are fine |

5. Deploy. Once live, run the seed script once against production from your own machine
   (point your local `.env` at the production DB temporarily, run `npm run seed`, then put
   your local `.env` back) — or reproduce the seed data manually. Either way, **change the
   seeded admin password** before leaving it live.
6. Confirm `https://<your-render-url>/api/health` returns `{"success":true,...}`.

**Why `CLIENT_URL` must be exact:** CORS is a strict allow-list (`cors({ origin: env.clientUrl })`)
— not a wildcard, per the architecture doc's security plan. A mismatched value (wrong scheme,
trailing slash, wrong subdomain) will silently break every frontend request with a CORS error.

## 3. Frontend — Vercel

1. On [vercel.com](https://vercel.com): **New Project** → import the repo.
2. Settings:
   - **Root directory**: `client`
   - **Framework preset**: Vite (auto-detected)
   - **Build command**: `npm run build` (default)
   - **Output directory**: `dist` (default)
3. Environment variable — **this is baked in at build time**, not read at runtime, so it must
   be set in Vercel's project settings, not just a local `.env` file:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-url>/api` |
   | `VITE_ENABLE_MOCK_FALLBACK` | `false` |

4. Deploy. Copy the resulting `https://....vercel.app` URL.
5. Go back to Render and set `CLIENT_URL` to that exact URL, then redeploy the backend so
   CORS picks up the change.

## 4. Verify the deployed stack

- Open the Vercel URL, register an account, confirm you land on the Home page logged in
  (this exercises the full chain: frontend → backend → DB → cookie round-trip).
- Refresh the page — you should stay logged in (silent session restore via the refresh
  cookie). This is the step most likely to break from a `CLIENT_URL` mismatch or a cookie
  `SameSite`/`Secure` misconfiguration — both are already handled correctly in this codebase
  (`authController.js` uses `SameSite=None; Secure` specifically for the cross-domain
  Vercel↔Render case), but any deploy that swaps hosts should double-check this step.

## GitHub

```bash
# from the repo root, if not already a git repo pushed somewhere
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.env`, and build output — confirm
`git status` is clean before pushing (no `.env` files should ever show as tracked).

## Known limitations of this deployment

- No CI/CD pipeline (manual deploy on push, via each platform's own GitHub integration).
- No CDN/caching strategy beyond what Vercel provides by default for static assets.
- `sequelize.sync({ alter: true })` runs automatically outside production (see
  `server/src/config/db.js`) — production does **not** auto-sync, so the schema must already
  exist (create it by running the app once against a fresh DB in a non-production `NODE_ENV`,
  or write proper `sequelize-cli` migrations before a real production launch).
