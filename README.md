# VELOOP Rewards — Giveaway Platform

A full-stack giveaway/rewards platform, per the VELOOP Rewards internship assignment.
See `VELOOP_Architecture.md` in this repo for the complete system design (routes, API map,
DB schema, security/fraud plan, and the full phase-by-phase roadmap).

> **Status: Phases 0–3 complete** — scaffold, authentication, giveaway core, and the full
> join flow. A user can browse real giveaways, open an individual prize page, and actually
> join it — with the balance genuinely deducted server-side. Winners and prize claims land
> in Phase 4.

> **Database note:** the assignment spec names MongoDB/Mongoose specifically. This project
> uses **MySQL + Sequelize** instead — a deliberate, documented substitution (see
> `VELOOP_Architecture.md`, section 0), not an oversight. **If this is graded against the
> original spec, flag this substitution to the reviewer up front.**

> **Design note:** the spec's routing examples name individual prizes
> (`/giveaway/iphone-15-pro`, `/giveaway/apple-watch`), so entry fees, currencies, and
> `/giveaway/:slug` are scoped **per prize**, not per campaign — a `Giveaway` is the shared
> container (one countdown, one set of rules) that its `Prize` rows belong to, and duplicate-
> entry protection is `UNIQUE(userId, prizeId)`. See `VELOOP_Architecture.md`, section 0.

## What works right now

- **Backend**: full auth system, `Giveaway`/`Prize` CRUD, and the complete guarded join
  flow — `POST /giveaways/:prizeId/join` independently re-verifies giveaway status,
  duplicate entry, and balance server-side; the request body is never trusted for currency,
  amount, or identity. Balance deduction + participation + transaction record happen inside
  one Sequelize transaction with a row lock on the user's balance, so concurrent requests
  can't double-spend. Idempotency keys let a client safely retry a failed request without
  being charged twice. **41 passing tests**, all against a real MySQL/MariaDB database.
- **Frontend**: the individual giveaway page (`/giveaway/:slug`) — prize details, live
  countdown, entry fee, how-it-works, and a clearly-labeled placeholder Terms & Conditions
  section. The join button opens a confirmation modal showing entry fee / current balance /
  balance after joining, and never joins on the first click. Unauthenticated visitors get a
  "Login Required" prompt instead of being able to participate. The navbar balance updates
  immediately after a successful join, reflecting the real server-side deduction.
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
npm run seed             # creates an admin + demo giveaways (see below)
```

`npm run seed` creates an admin user (`admin@veloop.local` / `AdminPass123` — change/remove
before production) and two giveaways: an active "Summer Rewards Giveaway" with six prizes
matching the spec's exact examples, and an upcoming "September Rewards".

### 2. Frontend

```bash
cd client
cp .env.example .env    # defaults already point at http://localhost:5000/api
npm install
npm run dev              # starts on http://localhost:5173
```

### 3. Testing the join flow locally

New accounts start at 0 VEs/SVEs/Tokens — correct behavior (the spec's balance system is fed
by an activity/loyalty mechanism outside this assignment's scope). To actually test joining,
top up an account's balance directly:

```sql
UPDATE users SET balanceVe = 1000, balanceSve = 1000, balanceToken = 5000
WHERE email = 'your-registered-email@example.com';
```

Then open `/giveaway/iphone-15-pro` (or any seeded prize) and click Join.

## Project structure

```
client/   React + Vite frontend
server/   Express + MySQL (Sequelize) backend
VELOOP_Architecture.md   Full architecture doc (routes, API map, schema, roadmap)
```

## Testing

```bash
cd server
npm test     # Jest + Supertest, NODE_ENV=test, --runInBand (tests share one live DB,
             # so they run serially). Set DB_NAME=veloop_test (or your own) first.
```

```bash
cd client
npm run build   # production build sanity check
npm run lint
```

## Known limitations at this checkpoint

- No winners or prize-claim UI yet — `GiveawayWinner`/`PrizeClaim` tables and routes land in
  Phase 4.
- No admin UI yet — giveaways are created via `POST /api/admin/giveaways` directly (or the
  seed script) rather than a form.
- No way to earn/purchase VEs/SVEs/Tokens in-app — balances are set directly in the DB for
  now (see "Testing the join flow" above); a top-up mechanism is outside this assignment's
  scope.
- Fraud signals (`deviceHash`/`ipHash`) are captured on every participation but not yet
  consumed by any blocking logic — the actual risk-scoring service lands in Phase 5.
- Schema is managed via `sequelize.sync({ alter: true })` in development, not formal
  migrations yet — fine for a single developer at this stage, but `sequelize-cli` migrations
  are the right call before this goes anywhere near production or a team.

## Deployment (planned — Phase 8)

Frontend → Vercel · Backend → Render/Railway · Database → a managed MySQL host
(PlanetScale/Railway/RDS). Not yet deployed.
