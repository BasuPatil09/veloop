# VELOOP Rewards — Giveaway Platform

A full-stack giveaway/rewards platform, per the VELOOP Rewards internship assignment.
See `VELOOP_Architecture.md` for the complete system design (routes, API map, DB schema,
security/fraud plan, and the full phase-by-phase roadmap).

> **Status: Phases 0–8 complete.** Full giveaway platform: auth, giveaway core, the join
> flow, winner selection + claims, fraud scoring + audit logging, UX polish, an expanded test
> suite (see `TESTING.md`), and a deployment guide (see `DEPLOYMENT.md`). The guide is
> copy-pasteable but **not yet executed** — I don't have Vercel/Render/database credentials
> to deploy this myself; follow `DEPLOYMENT.md` to actually put it live.

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
- **66 passing backend tests + 39 passing frontend tests**, all against a real MySQL/MariaDB
  database. `npm run build` (client) and `npm test` / `npm run lint` (both) pass clean. See
  `TESTING.md` for the full coverage matrix and `DEPLOYMENT.md` for going live.

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

See `TESTING.md` for the full matrix mapping the spec's required test coverage to actual
automated tests and manual verification.

```bash
cd server && npm test    # Jest + Supertest, --runInBand, needs DB_NAME=veloop_test (or similar)
                          # 66 tests: auth, giveaways, join flow, winners, claims, fraud scoring
```
```bash
cd client && npm test    # Vitest + React Testing Library — 39 tests
cd client && npm run build && npm run lint
```

## Known limitations

- No admin UI — giveaway creation and winner selection are API-only.
- No way to earn/purchase currency in-app — balances are set directly in the DB for testing.
- Fraud enforcement is skipped under `NODE_ENV=test` (a test harness has no real device/IP
  diversity — every request shares one loopback IP) — the scoring logic itself is covered
  directly by `fraud.integration.test.js`, calling the service without going through HTTP.
- Schema via `sequelize.sync({ alter: true })` in development, not formal migrations yet.

## Deployment

See `DEPLOYMENT.md` for the full step-by-step guide: Vercel (frontend) + Render (backend) +
a managed MySQL host, including the exact environment variables each platform needs and a
cross-domain cookie configuration detail (`SameSite=None; Secure`) that's easy to miss.
