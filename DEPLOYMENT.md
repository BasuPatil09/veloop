# Deployment Guide

I can't create accounts or deploy on your behalf — this is a copy-pasteable walkthrough.
**Primary path below: everything on one Vercel project** (frontend + API, one URL, one
dashboard). A database still has to live somewhere else — Vercel has no MySQL offering at
all (its native databases are Postgres and Redis) — so an external MySQL host is the one
piece that can't be avoided. Verified current as of August 2026: PlanetScale killed its free
tier in 2024, Railway is trial-credit-only now, Aiven's free MySQL tier exists but wasn't
available for this account/region, and Oracle Cloud's Always Free MySQL requires manual VCN
networking config to be reachable from outside Oracle at all — **db4free.net** below
sidesteps all three problems.

## Why this needed real code changes, not just config

Vercel runs backend code as **serverless functions** — spun up per request, nothing persists
between invocations. Three things about the original design didn't fit that model, and are
now fixed in the codebase (not just documented around):

1. **The in-process cron job** (`node-cron`, ticked every 60s to keep giveaway status fresh)
   can't run on serverless at all — there's no "between requests" for it to tick in. It's
   replaced by `api/cron/status-sweep.js`, a scheduled Vercel Cron target. On the Hobby plan,
   Vercel caps cron frequency at **once a day**, not once a minute.
2. **That would have caused stale statuses to show for hours.** Fixed at the root instead of
   worked around: `giveawayService.listCurrent/listPrevious` now filter by `startAt`/`endAt`
   directly against the clock, and every serializer computes `status` live rather than
   trusting the stored column. The daily sweep is now pure housekeeping — a giveaway that
   ends at 2pm stops showing as "active" immediately, not whenever the next sweep happens to
   run.
3. **Sequelize's connection pool** is sized for a single long-running process by default. On
   serverless, many function instances can be alive simultaneously, each holding its own
   pool — `config/db.js` now caps the pool at 2 connections per instance specifically when
   `process.env.VERCEL` is set, to avoid exhausting a free-tier database's connection limit.

Also fixed as part of this work (applies to *any* deployment behind a reverse proxy, Vercel
or otherwise): `app.set('trust proxy', 1)` was missing entirely. Without it, `req.ip` — which
rate limiting and the fraud service's device/IP signals both depend on — resolves to the
*proxy's* address for every request, not the real client's.

## 1. Database — db4free.net (free MySQL, no networking setup)

Tried first: **Aiven** (regional free-tier availability turned out to be inconsistent — not
available for this account) and **Oracle Cloud Always Free** (does include MySQL, but Oracle
defaults it to a *private* network — reaching it from Vercel means manually configuring OCI's
VCN/subnet/security-list rules, a genuinely fiddly step). db4free.net avoids both problems: no
card, no networking config, reachable from any IP out of the box — important since Vercel's
serverless functions don't have a fixed IP to whitelist.

**The honest trade-off:** it's explicitly a *testing* service, not production-grade —
occasional outages, storage capped around 100–200MB. For a demo with a handful of users and
giveaways, that's a fine trade for zero setup friction.

1. Go to [db4free.net](https://www.db4free.net) → **Sign up** → pick a database name,
   username, and password (write these down — they *are* your credentials, there's no
   separate dashboard to look them up later) → submit → confirm via the email they send.
2. Once confirmed, your connection details are: **Host** `db4free.net`, **Port** `3306`,
   **Database name** / **User** / **Password** = whatever you chose in step 1.
3. No SSL needed here — set `DB_SSL=false` for this database (unlike Aiven, which would have
   required `DB_SSL=true`).

## 2. Push to GitHub

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

## 3. One Vercel project — frontend + API together

1. On [vercel.com](https://vercel.com): **New Project** → import the repo.
2. Vercel should detect `vercel.json` at the repo root and use it directly — it defines two
   builds (the Vite frontend, and the Express app as a serverless function) and the routing
   between them. You shouldn't need to override the framework preset.
3. Environment variables (Vercel project settings → Environment Variables) — set these for
   the **Production** environment. Generate fresh secrets; don't reuse anything from
   `.env.example`.

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `development` for the very first deploy only (see step 4), then `production` |
   | `DB_HOST` | `db4free.net` |
   | `DB_PORT` | `3306` |
   | `DB_NAME` / `DB_USER` / `DB_PASSWORD` | whatever you chose during db4free.net signup |
   | `DB_SSL` | `false` |
   | `JWT_SECRET` / `REFRESH_SECRET` / `COOKIE_SECRET` | generate fresh, e.g. `openssl rand -base64 48` |
   | `CLIENT_URL` | your Vercel URL once you know it (e.g. `https://veloop.vercel.app`, no trailing slash) — safe to leave blank for the very first deploy and fill in right after |
   | `CRON_SECRET` | generate fresh — Vercel automatically sends this as a bearer token when it invokes your cron job, and `api/cron/status-sweep.js` checks it |
   | `VITE_API_BASE_URL` | `/api` — a **relative** path, since frontend and API now share one domain |
   | `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` / `BCRYPT_SALT_ROUNDS` | defaults from `.env.example` are fine |

4. Deploy. **First-deploy schema creation:** production never auto-syncs the DB schema (see
   `server/src/config/db.js`) — that's true on every platform, not just Vercel. With
   `NODE_ENV=development` set for this first deploy, the app will create all the tables
   against your db4free.net database on startup. Once you've confirmed it worked (see step 5),
   change `NODE_ENV` to `production` in the environment variables and redeploy.
5. Confirm `https://<your-vercel-url>/api/health` returns `{"success":true,...}`.
6. Now that you know the real URL, set `CLIENT_URL` to it exactly and redeploy.
7. Seed demo data — from your own machine, point a temporary local `.env` at the db4free.net
   credentials (with `DB_SSL=false`) and run `npm run seed` from inside `server/`. **Change
   the seeded admin password before leaving this live.**

## 4. Verify

- Open the Vercel URL, register an account, confirm you land on the Home page logged in.
- Refresh the page — you should stay logged in. Same-origin deployment means the classic
  cross-domain cookie problem doesn't even come up here (that fix is still in the code for
  the alternative deployment path below, but it's moot when everything's one domain).
- Wait a day (or manually hit `/api/cron/status-sweep` with the right `Authorization: Bearer
  <CRON_SECRET>` header) to confirm the daily sweep runs — though as explained above, this
  is now just housekeeping, not something correctness depends on.

## Alternative: separate frontend/backend/database

The codebase still fully supports a 3-service split (Vercel/Render for the app, any MySQL
host for the database) — `server.js`, the in-process cron, and the traditional
`connectDB()` startup sequence are all unchanged and still used for that path and for local
dev. If you'd rather deploy that way instead (e.g. to avoid the once-a-day cron limit, or
because an always-on process feels simpler to reason about than serverless), ask and I can
write that version of the guide.

## Known limitations

- No CI/CD pipeline — manual redeploy on push via Vercel's GitHub integration.
- `sequelize.sync({ alter: true })` doesn't run in production on any platform — see step 4
  above for the one-time workaround; proper `sequelize-cli` migrations are the right
  long-term fix.
- db4free.net is explicitly a testing service — expect occasional downtime, and storage is
  capped around 100–200MB. Fine for a demo; not something to leave real users on long-term.
- The daily cron minimum is a Hobby-plan restriction — a paid Vercel plan allows more
  frequent schedules, not that it matters much anymore given the live-status fix above.
- Free-tier pricing/availability changes over time — everything above was verified in
  August 2026.
