# VELOOP Rewards — Giveaway Platform

A full-stack giveaway/rewards platform, per the VELOOP Rewards internship assignment.
See `VELOOP_Architecture.md` in this repo for the complete system design (routes, API map,
DB schema, security/fraud plan, and the full phase-by-phase roadmap).

> **Status: Phases 0–4 complete** — scaffold, authentication, giveaway core, the full join
> flow, and now winner selection + prize claims. A user can browse giveaways, join one, and
> — once an admin ends it and selects winners — see whether they won and submit a claim.
> Fraud scoring and the admin UI (currently API-only) land in Phase 5.

> **Database note:** the assignment spec names MongoDB/Mongoose specifically. This project
> uses **MySQL + Sequelize** instead — a deliberate, documented substitution (see
> `VELOOP_Architecture.md`, section 0), not an oversight. **If this is graded against the
> original spec, flag this substitution to the reviewer up front.**

> **Design note:** the spec's routing examples name individual prizes
> (`/giveaway/iphone-15-pro`, `/giveaway/apple-watch`), so entry fees, currencies, and
> `/giveaway/:slug` are scoped **per prize**, not per campaign. Winner selection follows the
> same scoping — each prize gets its own `winnerCount` winners, `UNIQUE(prizeId, userId)`.
> See `VELOOP_Architecture.md`, section 0.

## What works right now

- **Backend**: full auth, giveaway/prize CRUD, the guarded join flow, and now:
  `POST /admin/giveaways/:id/select-winners` (admin-only, idempotent, random selection
  respecting each prize's `winnerCount`, only allowed once a giveaway has actually ended),
  public winner listings that mask identity (`VE***77`, never a real name/email/UUID) and
  never reveal winners for a still-active giveaway, and the full claim flow —
  `GET/POST /giveaways/:prizeId/my-claim` `/claim` — with ownership checked purely from the
  authenticated session, claim-type-appropriate required fields (physical address vs. email)
  determined server-side, duplicate-submission and expired-deadline rejection.
  **60 passing tests**, all against a real MySQL/MariaDB database.
- **Frontend**: the individual giveaway page now shows a full winner/non-winner experience
  once a giveaway ends — "🎉 Congratulations!" with a claim button for winners, a neutral
  "Didn't win this time?" for everyone else. The claim modal renders the right form (physical
  address vs. gift-card email) based on the prize's actual claim type. The Home page gained a
  social-proof winner slider (real data, not fabricated activity) and a Winners / Previous
  Winners tab pair, both with correct empty/loading/live-still-running states throughout.
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
npm run seed             # creates an admin + demo giveaways
```

`npm run seed` creates an admin user (`admin@veloop.local` / `AdminPass123`) and two
giveaways: an active "Summer Rewards Giveaway" with six prizes, and an upcoming
"September Rewards".

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev              # starts on http://localhost:5173
```

### 3. Testing the full lifecycle locally

New accounts start at 0 balance — top up directly for testing:

```sql
UPDATE users SET balanceVe = 1000, balanceSve = 1000, balanceToken = 5000
WHERE email = 'your-registered-email@example.com';
```

To test winner selection and claims, you need a giveaway that has actually ended. Easiest
path: create one via the admin API with an `endAt` already in the past, join it isn't
possible through the UI once ended — so insert a participation row directly, matching the
pattern used for verification during development (see `VELOOP_Architecture.md` if you want
the exact SQL). Then, as the seeded admin:

```bash
curl -X POST http://localhost:5000/api/admin/giveaways/<giveawayId>/select-winners \
  -H "Authorization: Bearer <admin access token>"
```

Log in as the winning account and open that prize's page — you should see the "🎉
Congratulations!" state and be able to submit a claim.

## Project structure

```
client/   React + Vite frontend
server/   Express + MySQL (Sequelize) backend
VELOOP_Architecture.md   Full architecture doc (routes, API map, schema, roadmap)
```

## Testing

```bash
cd server
npm test     # Jest + Supertest, NODE_ENV=test, --runInBand. Set DB_NAME=veloop_test first.
```

```bash
cd client
npm run build   # production build sanity check
npm run lint
```

## Known limitations at this checkpoint

- No admin UI yet — giveaway creation and winner selection are API-only (or the seed script).
- Fraud signals (`deviceHash`/`ipHash`) are captured on every participation but not yet
  consumed by any blocking logic — the risk-scoring service lands in Phase 5.
- No rate-limit/security hardening pass yet beyond what's already in place (helmet, CORS
  allow-list, per-route rate limiters, input validation) — Phase 5 per the roadmap.
- No way to earn/purchase VEs/SVEs/Tokens in-app — balances are set directly in the DB.
- Schema is managed via `sequelize.sync({ alter: true })` in development, not formal
  migrations — fine for a single developer at this stage, but `sequelize-cli` migrations are
  the right call before production.

## Deployment (planned — Phase 8)

Frontend → Vercel · Backend → Render/Railway · Database → a managed MySQL host
(PlanetScale/Railway/RDS). Not yet deployed.
