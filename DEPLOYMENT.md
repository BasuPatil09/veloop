# Deployment Guide — Phase 8

I can't create accounts or deploy on your behalf — this is a copy-pasteable walkthrough for
**Vercel** (frontend) + **Render** (backend) + **Aiven** (MySQL). All three have a genuine
free tier as of August 2026 — verified freshly for this guide, since two of the "usual"
recommendations no longer are: **PlanetScale killed its free tier in April 2024**, and
**Railway** now only offers a one-time $5 trial credit, not an ongoing free plan.

## 1. Database — Aiven (free MySQL)

1. Sign up at [aiven.io](https://aiven.io) (no credit card required for the free plan).
2. Create a service → **MySQL** → select the **Free** plan (1 CPU, 1GB RAM, 5GB storage —
   single node, no failover, which is fine for a project like this).
3. Once it's provisioned, open the service overview page and copy: **Host**, **Port**,
   **User**, **Password**, **Default database name**.
4. Note: Aiven's free-tier services auto-power-off after a period of inactivity. That's
   fine for demoing this project, but expect the first request after idle time to be slow
   while it wakes up — don't mistake that for a bug.

## 2. Backend — Render

1. Push this repo to GitHub (see "GitHub" below if you haven't yet).
2. On [render.com](https://render.com): **New → Web Service** → connect the repo.
3. Settings:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
4. Environment variables (Render dashboard → Environment) — use Aiven's values from step 1,
   plus fresh secrets. **Do not reuse the dev secrets from `.env.example`.**

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | from Aiven |
   | `DB_SSL` | `true` — Aiven requires TLS and rejects plain connections without this |
   | `JWT_SECRET` / `REFRESH_SECRET` | generate fresh, e.g. `openssl rand -base64 48` |
   | `CLIENT_URL` | your Vercel URL, filled in *after* step 3 below (no trailing slash) |
   | `COOKIE_SECRET` | generate fresh |
   | `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` / `BCRYPT_SALT_ROUNDS` | defaults from `.env.example` are fine |

5. Deploy. **Schema creation:** production does *not* auto-sync (see `server/src/config/db.js`
   — `sequelize.sync()` only runs outside `NODE_ENV=production`). Before your first real
   deploy, either:
   - Run the app once locally with `NODE_ENV=development` pointed at the Aiven DB (put the
     Aiven credentials + `DB_SSL=true` in a temporary local `.env`) to create the tables, then
     switch back to your local DB for day-to-day dev, or
   - Temporarily set `NODE_ENV=development` on Render for the very first deploy only, confirm
     the tables were created, then switch it to `production` and redeploy.
6. Run `npm run seed` the same way (temporarily pointed at the Aiven DB) to get demo data in.
   **Change the seeded admin password before leaving this live.**
7. Confirm `https://<your-render-url>/api/health` returns `{"success":true,...}`.

**Why `CLIENT_URL` must be exact:** CORS is a strict allow-list, not a wildcard. A mismatched
value (wrong scheme, trailing slash, wrong subdomain) silently breaks every frontend request.

## 3. Frontend — Vercel

1. On [vercel.com](https://vercel.com): **New Project** → import the repo.
2. Settings: **Root directory**: `client` — everything else auto-detects (Vite).
3. Environment variable — **baked in at build time**, so it must be set in Vercel's project
   settings, not just a local `.env` file:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-url>/api` |
   | `VITE_ENABLE_MOCK_FALLBACK` | `false` |

4. Deploy. Copy the resulting `https://....vercel.app` URL.
5. Back in Render, set `CLIENT_URL` to that exact URL and redeploy the backend.

## 4. Verify the deployed stack

- Open the Vercel URL, register an account, confirm you land on the Home page logged in.
- Refresh the page — you should stay logged in (silent session restore via the refresh
  cookie). This is the step most likely to break from a `CLIENT_URL` mismatch — already
  handled correctly here (`authController.js` uses `SameSite=None; Secure` specifically for
  the cross-domain Vercel↔Render case), but worth double-checking on any deploy.

## GitHub

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.env`, and build output — confirm
`git status` is clean before pushing.

## Known limitations of this deployment

- No CI/CD pipeline (manual deploy on push, via each platform's own GitHub integration).
- `sequelize.sync({ alter: true })` doesn't run in production — see step 2.5/2.6 above for
  the one-time workaround; proper `sequelize-cli` migrations are the right long-term fix.
- Aiven's free plan auto-powers-off when idle — fine for a demo, not for something that
  needs to always be instantly responsive.
- Free-tier pricing/availability changes — everything above was verified in August 2026, and
  is exactly the kind of thing that's worth re-checking if you're reading this months later.
