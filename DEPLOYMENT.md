# Deployment Guide

I can't create accounts or deploy on your behalf — this is a copy-pasteable walkthrough.
**Primary path below: everything on one Vercel project** (frontend + API, one URL, one
dashboard). A database still has to live somewhere else — Vercel has no MySQL offering at
all (its native databases are Postgres and Redis) — so an external MySQL host is the one
piece that can't be avoided. Verified current as of September 2026: PlanetScale killed its
free tier in 2024, Railway is trial-credit-only now, Aiven's free MySQL tier exists but
wasn't available for this account/region, Oracle Cloud's Always Free MySQL requires manual
VCN networking config to be reachable from outside Oracle at all, and db4free.net — a small
hobbyist site — turned out to no longer be what it used to be by the time this was tried.
**TiDB Cloud** is the option that held up: a real company (PingCAP) behind it, a genuinely
generous free tier, and MySQL-wire-protocol compatible so nothing else in this codebase needs
to change. If it doesn't work out either, **Railway** (confirmed real and currently active,
$5 one-time trial credit, no card required to start) is the documented fallback — see the end
of this section.

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

## 1. Database — TiDB Cloud (free MySQL-compatible)

1. Go to [tidbcloud.com](https://tidbcloud.com) → sign up.
2. Create a cluster → choose **Starter** (their free consumption-based tier — you may see it
   labeled "Serverless" in some places, same thing under a renamed tier). Pick any AWS region.
   Provisioning is typically near-instant for this tier.
3. Open the cluster → **Connect**. This is where the exact connection details are shown —
   copy them directly rather than guessing:
   - **Host**: a long AWS-style hostname (e.g. `gateway01.us-east-1.prod.aws.tidbcloud.com`)
   - **Port**: **4000** — not MySQL's usual 3306, easy to miss
   - **User**: often a compound value like `xxxxxxxx.root`, not just `root` — copy it exactly
   - **Password**: set one when prompted, or use the one shown
   - **Database name**: use whatever default is offered, or create one (e.g. `veloop`)
4. TLS is required. Set `DB_SSL=true`. You should **not** need `DB_SSL_CA` — TiDB Cloud's
   Serverless/Starter tier uses a Let's Encrypt-issued certificate, which is already in
   Node's default trusted certificate list. If the connection fails specifically with a TLS/
   certificate error (not a different error), that's the first thing to revisit.

**If TiDB Cloud doesn't work out:** [railway.app](https://railway.app) → sign up (no card for
the trial) → New Project → Provision MySQL. Railway gives standard connection details (host,
port — the normal 3306 this time, user, password, database) directly on the service's
"Connect" tab, no SSL required. The trial's one-time $5 credit should comfortably cover a
database this small for weeks to months; past that, Railway's minimum paid tier is about
$5/month.

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
   | `DB_HOST` | your TiDB Cloud host (or Railway's, if using the fallback) |
   | `DB_PORT` | `4000` for TiDB Cloud, `3306` for Railway |
   | `DB_NAME` / `DB_USER` / `DB_PASSWORD` | from your database's Connect panel |
   | `DB_SSL` | `true` for TiDB Cloud, `false` for Railway |
   | `JWT_SECRET` / `REFRESH_SECRET` / `COOKIE_SECRET` | generate fresh, e.g. `openssl rand -base64 48` |
   | `CLIENT_URL` | your Vercel URL once you know it (e.g. `https://veloop.vercel.app`, no trailing slash) — safe to leave blank for the very first deploy and fill in right after |
   | `CRON_SECRET` | generate fresh — Vercel automatically sends this as a bearer token when it invokes your cron job, and `api/cron/status-sweep.js` checks it |
   | `VITE_API_BASE_URL` | `/api` — a **relative** path, since frontend and API now share one domain |
   | `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` / `BCRYPT_SALT_ROUNDS` | defaults from `.env.example` are fine |

4. Deploy. **First-deploy schema creation:** production never auto-syncs the DB schema (see
   `server/src/config/db.js`) — that's true on every platform, not just Vercel. With
   `NODE_ENV=development` set for this first deploy, the app will create all the tables
   against your database on startup. Once you've confirmed it worked (see step 5), change
   `NODE_ENV` to `production` in the environment variables and redeploy.
5. Confirm `https://<your-vercel-url>/api/health` returns `{"success":true,...}`.
6. Now that you know the real URL, set `CLIENT_URL` to it exactly and redeploy.
7. Seed demo data — from your own machine, point a temporary local `.env` at your database's
   credentials (matching `DB_SSL`/`DB_PORT` above) and run `npm run seed` from inside
   `server/`. **Change the seeded admin password before leaving this live.**

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
- TiDB Cloud's free Starter tier has real usage caps (row storage, request units) — generous
  for a demo, but worth knowing they exist if this ever needs to handle real traffic.
- The daily cron minimum is a Hobby-plan restriction — a paid Vercel plan allows more
  frequent schedules, not that it matters much anymore given the live-status fix above.
- Free-tier pricing/availability changes over time — everything above was verified in
  September 2026, and multiple earlier recommendations in this guide's history (PlanetScale,
  Aiven, db4free.net) turned out not to work by the time they were actually tried — worth
  re-verifying anything here that's more than a few months old.
