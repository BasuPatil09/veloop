# VELOOP Rewards — Giveaway Platform

A full-stack giveaway/rewards platform, per the VELOOP Rewards internship assignment.
See `VELOOP_Architecture.md` for the complete system design (routes, API map, DB schema,
security/fraud plan, and the full phase-by-phase roadmap).

> **Status: Phases 0–6 complete** — scaffold, auth, giveaway core, the join flow, winner
> selection + claims, fraud scoring + audit logging, and full UX polish (How It Works, Trust,
> Rules, FAQ, winner-reveal and scroll-in animations). Testing (Phase 7) and deployment
> (Phase 8) remain.

> **Database note:** the assignment spec names MongoDB/Mongoose specifically. This project
> uses **MySQL + Sequelize** instead — a deliberate, documented substitution (see
> `VELOOP_Architecture.md`, section 0). **If graded against the original spec, flag this to
> the reviewer up front.**

> **Design note:** entry fees, currencies, and `/giveaway/:slug` are scoped **per prize**
> (matching the spec's own routing examples), not per campaign — a `Giveaway` is the shared
> container its `Prize` rows belong to. See `VELOOP_Architecture.md`, section 0.

## What works right now

- **Auth**: register/login/refresh/logout, JWT access+refresh, bcrypt hashing.
- **Giveaways**: admin-created (API), public read endpoints, live status derived from the
  clock (never trusted from the frontend), a real Home page with hero/stats/prize cards.
- **Join flow**: the full guarded transaction — status/duplicate/balance checks server-side,
  idempotency keys, row-locked atomic balance deduction.
- **Winners & claims**: admin-triggered random winner selection (respects each prize's
  `winnerCount`, idempotent), masked public winner identities, ownership-checked claim
  submission with claim-type-specific required fields (physical address vs. email).
- **Fraud & audit**: every join scored against device-reuse and request-velocity signals
  (no single signal blocks alone), `FraudEvent` and `AuditLog` rows written for flagged/
  blocked attempts and every balance-affecting action.
- **UX**: How to Participate, Trust section, Rules (clearly marked demo/placeholder where
  real policy isn't defined), FAQ accordion, winner-reveal and scroll-in animations, full
  loading/error/empty states throughout.
- **66 passing backend tests**, all against a real MySQL/MariaDB database. `npm run build`
  (client) and `npm test` / `npm run lint` (both) pass clean.

## Setup

```bash
cd server
cp .env.example .env   # fill in DB_HOST/DB_NAME/DB_USER/DB_PASSWORD, JWT_SECRET, REFRESH_SECRET
npm install && npm run dev
npm run seed             # admin@veloop.local / AdminPass123 + demo giveaways
```

```bash
cd client
cp .env.example .env
npm install && npm run dev
```

### Testing the full lifecycle locally

New accounts start at 0 balance:

```sql
UPDATE users SET balanceVe = 1000, balanceSve = 1000, balanceToken = 5000
WHERE email = 'your-email@example.com';
```

To see winner selection and claims, end a giveaway and trigger selection:

```sql
UPDATE giveaways SET endAt = NOW() - INTERVAL 1 HOUR, status = 'ended'
WHERE slug = 'summer-rewards-giveaway';
```

```powershell
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@veloop.local","password":"AdminPass123"}'
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/giveaways/<giveawayId>/select-winners" -Method Post -Headers @{ Authorization = "Bearer $($login.data.accessToken)" }
```

## Testing

```bash
cd server && npm test    # Jest + Supertest, --runInBand, needs DB_NAME=veloop_test (or similar)
```
```bash
cd client && npm run build && npm run lint
```

## Known limitations

- No admin UI — giveaway creation and winner selection are API-only.
- No way to earn/purchase currency in-app — balances are set directly in the DB for testing.
- Fraud enforcement is skipped under `NODE_ENV=test` (a test harness has no real device/IP
  diversity — every request shares one loopback IP) — the scoring logic itself is covered
  directly by `fraud.integration.test.js`, calling the service without going through HTTP.
- Schema via `sequelize.sync({ alter: true })` in development, not formal migrations yet.

## Deployment (planned — Phase 8)

Frontend → Vercel · Backend → Render/Railway · Database → a managed MySQL host. Not yet deployed.
