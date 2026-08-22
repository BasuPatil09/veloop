# VELOOP Rewards — Giveaway Platform

A full-stack giveaway/rewards platform, per the VELOOP Rewards internship assignment.
See `VELOOP_Architecture.md` in this repo for the complete system design (routes, API map,
DB schema, security/fraud plan, and the full phase-by-phase roadmap).

> **Status: Phase 0 (scaffold) + Phase 1 (authentication) + Phase 2 (giveaway core) complete.**
> Home page (hero, stats, prize cards) now renders real data from the database — no mock
> arrays. The join flow, individual giveaway page, winners, and claims land in Phases 3–4.

> **Database note:** the assignment spec names MongoDB/Mongoose specifically. This project
> uses **MySQL + Sequelize** instead — a deliberate, documented substitution (see
> `VELOOP_Architecture.md`, section 0), not an oversight. **If this is graded against the
> original spec, flag this substitution to the reviewer up front.**

> **Design note (Phase 2):** the spec's routing examples name individual prizes
> (`/giveaway/iphone-15-pro`, `/giveaway/apple-watch`), so entry fees, currencies, and
> `/giveaway/:slug` are scoped **per prize**, not per campaign — a `Giveaway` is the shared
> container (one countdown, one set of rules) that its `Prize` rows belong to. See
> `VELOOP_Architecture.md`, section 0 ("Entry scope"), for the reasoning.

## What works right now

- **Backend**: full auth system (Phase 1) plus `Giveaway`/`Prize` models, a minimal admin
  endpoint to create a giveaway with its prizes in one transaction, and public read endpoints
  (`/giveaways/current`, `/previous`, `/stats`, `/slug/:slug`, `/:id`). Giveaway status
  (upcoming/active/ended) is derived from `startAt`/`endAt` on every read AND kept in sync by
  a once-a-minute cron sweep — never trusted from the frontend. **30 passing tests**
  (`npm test` in `server/`), all running against a real MySQL/MariaDB database, not mocks.
- **Frontend**: the real Home page — hero, live stats (from the DB, not fake numbers),
  and a Featured Giveaways grid of prize cards, each with its own live countdown, entry fee,
  and a "Join Now" that links to `/giveaway/:slug` (never joins directly, per spec). Full
  loading/error/empty states throughout — a failed API call shows a retry button, not a stack
  trace; zero giveaways shows "No current giveaway," not a silently-faked stat block.
- Both `npm run build` (client) and `npm test` / `npm run lint` (server) pass clean.

## Prerequisites

- Node.js 18+
- A MySQL-compatible database — MySQL 8 or MariaDB.

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env   # then fill in DB_HOST/DB_NAME/DB_USER/DB_PASSWORD, JWT_SECRET, REFRESH_SECRET
npm install
npm run dev             # starts on http://localhost:5000
```

On startup in development, Sequelize syncs the schema automatically — no manual migration
step needed. Then seed some demo data so the Home page has something to show:

```bash
npm run seed
```

This creates an admin user (`admin@veloop.local` / `AdminPass123` — change/remove before this
ever goes near production) and two giveaways: an active "Summer Rewards Giveaway" with six
prizes (matching the spec's exact examples — iPhone, Apple Watch, AirPods, three Amazon
vouchers) and an upcoming "September Rewards".

`GET http://localhost:5000/api/health` should return `{ success: true, data: { status: "ok" } }`.

### 2. Frontend

```bash
cd client
cp .env.example .env    # defaults already point at http://localhost:5000/api
npm install
npm run dev              # starts on http://localhost:5173
```

Open it — the Home page should show live stats and the seeded prize cards. Register an
account at `/register` and it should log you straight in.

## Project structure

```
client/   React + Vite frontend
server/   Express + MySQL (Sequelize) backend
VELOOP_Architecture.md   Full architecture doc (routes, API map, schema, roadmap)
```

See `VELOOP_Architecture.md` for the detailed folder structure inside each of `client/src`
and `server/src`.

## Testing

```bash
cd server
npm test     # Jest + Supertest, NODE_ENV=test, --runInBand (tests share one live DB,
             # so they run serially, not in parallel workers)
             # Real integration tests against a live MySQL database — set
             # DB_NAME=veloop_test (or your own test DB) first.
```

```bash
cd client
npm run build   # production build sanity check
npm run lint
```

## Known limitations at this checkpoint

- No join/claim flow yet, no individual giveaway detail page content, no winners/previous
  winners UI — `Participation`/`Winner`/`Claim` tables and routes land in Phases 3–4.
- No admin UI yet — giveaways are created via `POST /api/admin/giveaways` directly (or the
  seed script) rather than a form.
- Refresh token is a JWT verified against a stored hash (not a separate opaque-token table) —
  sufficient for revocation-on-logout; a full session table is a reasonable future upgrade if
  per-device session management is needed.
- Schema is managed via `sequelize.sync({ alter: true })` in development, not formal
  migrations yet — fine for a single developer at this stage, but `sequelize-cli` migrations
  are the right call before this goes anywhere near production or a team.

## Deployment (planned — Phase 8)

Frontend → Vercel · Backend → Render/Railway · Database → a managed MySQL host
(PlanetScale/Railway/RDS). Not yet deployed.
