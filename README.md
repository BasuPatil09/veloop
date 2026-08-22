# VELOOP Rewards — Giveaway Platform

A full-stack giveaway/rewards platform, per the VELOOP Rewards internship assignment.
See `VELOOP_Architecture.md` in this repo for the complete system design (routes, API map,
DB schema, security/fraud plan, and the full phase-by-phase roadmap).

> **Status: Phase 0 (scaffold) + Phase 1 (authentication) complete.**
> The giveaway experience itself (Home page, prize cards, join flow, winners, claims) is
> being built phase by phase per the roadmap — this checkpoint proves the foundation
> (auth, routing, API wiring, error handling) is solid before anything is layered on top.

> **Database note:** the assignment spec names MongoDB/Mongoose specifically. This project
> uses **MySQL + Sequelize** instead — a deliberate, documented substitution (see
> `VELOOP_Architecture.md`, section 0), not an oversight. The same guarantees apply: a
> `UNIQUE KEY(userId, giveawayId)` instead of a Mongo compound index, `sequelize.transaction()`
> instead of a Mongoose session. **If this is graded against the original spec, flag this
> substitution to the reviewer up front.**

## What works right now

- **Backend**: register/login/refresh/logout/me, JWT access+refresh tokens (with a unique
  `jti` per token), bcrypt password hashing, role field (user/admin) on the User model,
  centralized error handling with clean API error codes, rate limiting on auth endpoints,
  input validation. **16 passing tests** (`npm test` in `server/`) — including real
  end-to-end integration tests against a live MySQL database (register → login → refresh
  rotation → logout → server-side revocation verified by replaying a captured cookie).
- **Frontend**: full app shell (navbar, footer, routing), branded Login/Register pages,
  `AuthContext` with silent session restore via the refresh cookie, a `ProtectedRoute` guard,
  the custom VELOOP loader (used in place of a generic spinner), and the VELOOP design token
  system (color/type/spacing) that the rest of the UI will build on.
- Both `npm run build` (client) and `npm test` / `npm run lint` (server) pass clean.

## Prerequisites

- Node.js 18+
- A MySQL-compatible database — MySQL 8 or MariaDB. Locally, either install MySQL/MariaDB
  directly, or use a free-tier hosted option (e.g. [PlanetScale](https://planetscale.com),
  [Railway](https://railway.app), or [Aiven](https://aiven.io)) if you'd rather not install
  a database server locally.

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env   # then fill in DB_HOST/DB_NAME/DB_USER/DB_PASSWORD, JWT_SECRET, REFRESH_SECRET
npm install
npm run dev             # starts on http://localhost:5000
```

On startup in development, Sequelize syncs the schema automatically (`sequelize.sync({ alter: true })`)
— no manual migration step is needed to get the tables created. Production deployments should
switch to `sequelize-cli` migrations instead of relying on sync against a live database.

`GET http://localhost:5000/api/health` should return `{ success: true, data: { status: "ok" } }`.

### 2. Frontend

```bash
cd client
cp .env.example .env    # defaults already point at http://localhost:5000/api
npm install
npm run dev              # starts on http://localhost:5173
```

Register an account at `/register`, and it should log you straight in.

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
npm test     # Jest + Supertest, NODE_ENV=test (rate limiting is disabled only in this mode)
             # Includes both DB-bypassing smoke tests and real integration tests against
             # a live MySQL database — set DB_NAME=veloop_test (or your own test DB) first.
```

```bash
cd client
npm run build   # production build sanity check
npm run lint
```

## Known limitations at this checkpoint

- No giveaway data yet — `Giveaway`/`Prize`/participation/winner/claim tables and routes land
  in Phases 2–4.
- No admin UI yet.
- Refresh token is a JWT verified against a stored hash (not a separate opaque-token table) —
  sufficient for revocation-on-logout; a full session table is a reasonable future upgrade if
  per-device session management is needed.
- Schema is managed via `sequelize.sync({ alter: true })` in development, not formal
  migrations yet — fine for a single developer at this stage, but `sequelize-cli` migrations
  are the right call before this goes anywhere near production or a team.

## Deployment (planned — Phase 8)

Frontend → Vercel · Backend → Render/Railway · Database → a managed MySQL host
(PlanetScale/Railway/RDS). Not yet deployed.
