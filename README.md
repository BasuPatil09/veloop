# VELOOP Rewards — Giveaway Platform

A full-stack giveaway/rewards platform, per the VELOOP Rewards internship assignment.
See `VELOOP_Architecture.md` in this repo for the complete system design (routes, API map,
DB schema, security/fraud plan, and the full phase-by-phase roadmap).

> **Status: Phase 0 (scaffold) + Phase 1 (authentication) complete.**
> The giveaway experience itself (Home page, prize cards, join flow, winners, claims) is
> being built phase by phase per the roadmap — this checkpoint proves the foundation
> (auth, routing, API wiring, error handling) is solid before anything is layered on top.

## What works right now

- **Backend**: register/login/refresh/logout/me, JWT access+refresh tokens, bcrypt password
  hashing, role field (user/admin) on the User model, centralized error handling with clean
  API error codes, rate limiting on auth endpoints, input validation. 7 passing tests
  (`npm test` in `server/`).
- **Frontend**: full app shell (navbar, footer, routing), branded Login/Register pages,
  `AuthContext` with silent session restore via the refresh cookie, a `ProtectedRoute` guard,
  the custom VELOOP loader (used in place of a generic spinner), and the VELOOP design token
  system (color/type/spacing) that the rest of the UI will build on.
- Both `npm run build` (client) and `npm test` / `npm run lint` (server) pass clean.

## Prerequisites

- Node.js 18+
- A MongoDB instance — either [MongoDB Atlas](https://www.mongodb.com/atlas) (recommended,
  required for multi-document transactions used in later phases) or a local `mongod`.

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, REFRESH_SECRET
npm install
npm run dev             # starts on http://localhost:5000
```

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
server/   Express + MongoDB backend
VELOOP_Architecture.md   Full architecture doc (routes, API map, schema, roadmap)
```

See `VELOOP_Architecture.md` for the detailed folder structure inside each of `client/src`
and `server/src`.

## Testing

```bash
cd server
npm test     # Jest + Supertest — auth validation, protected-route rejection, error envelopes
```

```bash
cd client
npm run build   # production build sanity check
npm run lint
```

## Known limitations at this checkpoint

- No giveaway data yet — `Giveaway`/`Prize`/participation/winner/claim models and routes land
  in Phases 2–4.
- No admin UI yet.
- Refresh token is a JWT verified against a stored hash (not a separate opaque-token table) —
  sufficient for revocation-on-logout; a full session table is a reasonable future upgrade if
  per-device session management is needed.

## Deployment (planned — Phase 8)

Frontend → Vercel · Backend → Render/Railway · Database → MongoDB Atlas. Not yet deployed.
