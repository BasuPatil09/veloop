# VELOOP Rewards — Giveaway Platform
## System Architecture & Implementation Plan

> Scope: Frontend Giveaway experience + Backend giveaway/fraud engine, per the attached VELOOP Rewards internship spec (frontend task + backend task).
> Status: **Architecture only** — implementation starts after this is approved, phase by phase.

---

## 0. Assumptions & Scope Decisions

The spec intentionally leaves some choices to the implementer. Decisions made here, to be revisited if you disagree:

| Decision | Choice | Why |
|---|---|---|
| Language | JavaScript (`.jsx`) on client, JS on server | Matches the folder structure given in the spec; faster to ship in a 23-day window; controllers/services are isolated enough to migrate to TS later without a rewrite |
| Winner selection | Admin-triggered (manual "select winners" action), enforcing `winnerCount` server-side | Spec says "backend-controlled," not "fully automated." Manual-with-enforcement is safer to build first; a `RANDOM` selection algorithm slots into the same `winnerService.selectWinners()` call later |
| Previous winners | **Not** a separate collection — same `GiveawayWinner` model, filtered by `giveaway.status` | Per spec §64: "winners remain associated with their original giveaway," avoids data duplication/migration bugs |
| Device fingerprinting | Lightweight hash of `IP + User-Agent + client-generated UUID (httpOnly cookie)` — a signal, not a lock | Spec explicitly says fingerprinting is "abuse-prevention, not identity" (§24) |
| Styling | Bootstrap (grid/utilities) + CSS Modules per component (no `react-bootstrap` dependency) | Spec requires both Bootstrap *and* CSS Modules; plain Bootstrap CSS + modules avoids fighting two component libraries |
| Deployment | Frontend → Vercel · Backend → Render/Railway · DB → MongoDB Atlas | Vercel is spec-recommended for frontend; backend needs a Node host since Vercel serverless doesn't suit long-lived Mongo transactions well |
| Timeline | 20 Aug – 12 Sep 2026 (23 days) | Matches actual assignment dates, not a generic estimate |

---

## A. Complete System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT — React + Vite                          │
│  Pages → Components → Hooks → Context → Services (Axios)           │
│  (Frontend NEVER computes: balance, fee, winner status, giveaway    │
│   status as authoritative — it only displays what backend returns) │
└───────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / JSON (REST), Bearer JWT + refresh cookie
┌───────────────────────────▼─────────────────────────────────────┐
│                     EXPRESS API — server/                          │
│  Helmet → CORS(allow-list) → express-rate-limit → JSON body parser │
│  → authMiddleware (JWT verify) → validationMiddleware (schema)     │
│  → fraudMiddleware (risk signals) → Controller                     │
└───────────────────────────┬─────────────────────────────────────┘
                             │
┌───────────────────────────▼─────────────────────────────────────┐
│  SERVICE LAYER (business logic — never in controllers/routes)      │
│  giveawayService · participationService · balanceService ·         │
│  winnerService · claimService · fraudService · auditService        │
└───────────────────────────┬─────────────────────────────────────┘
                             │  Mongoose sessions/transactions
┌───────────────────────────▼─────────────────────────────────────┐
│  MODELS — User, Giveaway, Prize, GiveawayParticipation,             │
│  GiveawayEntryTransaction, GiveawayWinner, PrizeClaim,              │
│  FraudEvent, AuditLog                                               │
└───────────────────────────┬─────────────────────────────────────┘
                             │
┌───────────────────────────▼─────────────────────────────────────┐
│                    MongoDB Atlas (replica set — required           │
│                    for multi-document transactions)                │
└──────────────────────────────────────────────────────────────────┘

Side process: node-cron job (every 60s) recomputes UPCOMING→ACTIVE→ENDED
transitions on the DB status field as a consistency sweep. Every read/write
path ALSO independently checks startAt/endAt against `now` — the cron is a
convenience, not the sole source of truth (defense in depth, per spec §5–6).
```

**Core principle carried through every layer:** the frontend requests intent ("join this giveaway"); the backend independently re-derives status, fee, currency, balance, and identity from the database and the authenticated session — never from the request body.

---

## B. Complete Folder Structure

```
veloop-giveaway/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar/
│   │   │   │   ├── Footer/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── giveaway/
│   │   │   │   ├── GiveawayHero/
│   │   │   │   ├── GiveawayStats/
│   │   │   │   ├── PrizeCard/
│   │   │   │   ├── FeaturedGiveaways/
│   │   │   │   ├── HowToParticipate/
│   │   │   │   ├── Countdown/
│   │   │   │   ├── GiveawayRules/
│   │   │   │   ├── FAQAccordion/
│   │   │   │   └── TrustSection/
│   │   │   ├── winners/
│   │   │   │   ├── WinnerSlider/
│   │   │   │   ├── WinnersTabs/
│   │   │   │   ├── WinnerCard/
│   │   │   │   └── PreviousWinnerCard/
│   │   │   ├── participation/
│   │   │   │   ├── ParticipationCTA/
│   │   │   │   ├── ConfirmJoinModal/
│   │   │   │   ├── JoinSuccessState/
│   │   │   │   └── LoginRequiredModal/
│   │   │   ├── claim/
│   │   │   │   ├── PrizeClaimModal/
│   │   │   │   ├── PhysicalClaimForm/
│   │   │   │   ├── GiftCardClaimForm/
│   │   │   │   └── ClaimStatusBadge/
│   │   │   └── common/
│   │   │       ├── VeloopLoader/
│   │   │       ├── Skeletons/ (CardSkeleton, StatSkeleton, WinnerSkeleton)
│   │   │       ├── ErrorState/
│   │   │       ├── EmptyState/
│   │   │       └── Toast/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── GiveawayDetails/          → /giveaway/:slug
│   │   │   ├── Login/  Register/
│   │   │   ├── MyParticipations/
│   │   │   └── admin/ (Dashboard, GiveawayForm, ParticipantsList, ClaimsQueue)
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useGiveaways.js
│   │   │   ├── useGiveaway.js
│   │   │   ├── useParticipation.js
│   │   │   ├── useClaim.js
│   │   │   ├── useCountdown.js
│   │   │   └── useWinners.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── services/
│   │   │   ├── apiClient.js         (axios instance + refresh-token interceptor)
│   │   │   ├── authService.js
│   │   │   ├── giveawayService.js
│   │   │   ├── participationService.js
│   │   │   ├── claimService.js
│   │   │   └── adminService.js
│   │   ├── utils/
│   │   │   ├── currencyFormatter.js
│   │   │   ├── maskUserId.js
│   │   │   ├── dateUtils.js
│   │   │   └── prizeTypeConfig.js    (single source for PHYSICAL/GIFT_CARD/DIGITAL → form + copy)
│   │   ├── data/
│   │   │   └── giveawayMock.js       (dev-only fallback, behind VITE_ENABLE_MOCK_FALLBACK)
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── styles/
│   │   │   └── variables.css / globals.css
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── giveawayController.js
│   │   │   ├── participationController.js
│   │   │   ├── winnerController.js
│   │   │   ├── claimController.js
│   │   │   └── adminGiveawayController.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Giveaway.js
│   │   │   ├── Prize.js
│   │   │   ├── GiveawayParticipation.js
│   │   │   ├── GiveawayEntryTransaction.js
│   │   │   ├── GiveawayWinner.js
│   │   │   ├── PrizeClaim.js
│   │   │   ├── FraudEvent.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── giveawayRoutes.js
│   │   │   ├── participationRoutes.js
│   │   │   ├── winnerRoutes.js
│   │   │   ├── claimRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       (verify JWT, attach req.user)
│   │   │   ├── requireRole.js          (RBAC)
│   │   │   ├── rateLimitMiddleware.js
│   │   │   ├── validationMiddleware.js
│   │   │   ├── fraudMiddleware.js
│   │   │   └── errorMiddleware.js      (centralized error → clean API response)
│   │   ├── services/
│   │   │   ├── giveawayService.js      (status derivation, lifecycle)
│   │   │   ├── participationService.js (the join transaction)
│   │   │   ├── balanceService.js
│   │   │   ├── winnerService.js
│   │   │   ├── claimService.js
│   │   │   ├── fraudService.js         (risk scoring)
│   │   │   └── auditService.js
│   │   ├── validators/
│   │   │   ├── authValidators.js
│   │   │   ├── giveawayValidators.js
│   │   │   ├── participationValidators.js
│   │   │   └── claimValidators.js
│   │   ├── utils/
│   │   │   ├── deviceHash.js
│   │   │   ├── apiResponse.js          (consistent {success, data, error} shape)
│   │   │   └── errorCodes.js           (GIVEAWAY_ENDED, INSUFFICIENT_VE_BALANCE, etc.)
│   │   ├── jobs/
│   │   │   └── giveawayStatusSweep.js  (node-cron, every 60s)
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   └── app.js
│   ├── .env.example
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## C. Frontend Route Map

| Route | Access | Page | Purpose |
|---|---|---|---|
| `/` | Public | `Home` | Hero, stats, featured giveaways, how-it-works, winner slider, winners/previous-winners tabs, trust, rules, FAQ, CTA |
| `/giveaway/:slug` | Public (join gated) | `GiveawayDetails` | Full prize info, entry fee, T&Cs, join flow, winner/claim state if applicable |
| `/login` | Public | `Login` | Redirect target when join is attempted unauthenticated |
| `/register` | Public | `Register` | — |
| `/my-participations` | Protected (user) | `MyParticipations` | User's own join history + claim status |
| `/admin` | Protected (admin) | `AdminLayout > Dashboard` | Overview |
| `/admin/giveaways` | Protected (admin) | `GiveawayList` | CRUD entry point |
| `/admin/giveaways/new` \| `/admin/giveaways/:id/edit` | Protected (admin) | `GiveawayForm` | Create/update giveaway + prizes |
| `/admin/giveaways/:id/participants` | Protected (admin) | `ParticipantsList` | View participation, trigger winner selection |
| `/admin/claims` | Protected (admin) | `ClaimsQueue` | Process claims |
| `*` | Public | `NotFound` | — |

`ProtectedRoute` wraps user/admin routes and checks `AuthContext`; unauthenticated access to a join action opens `LoginRequiredModal` instead of a hard redirect where it improves UX (per spec §98), with `/login` as the fallback route.

---

## D. Backend API Map

**Auth**

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, hash password |
| POST | `/api/auth/login` | — | Issue access token + refresh cookie |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate access token |
| POST | `/api/auth/logout` | Access token | Invalidate refresh token |
| GET | `/api/auth/me` | Access token | Current user + balances |

**Giveaways (read)**

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/giveaways/current` | Public | Active/upcoming giveaway(s) for Home |
| GET | `/api/giveaways/:id` | Public | Full detail for individual page |
| GET | `/api/giveaways/slug/:slug` | Public | Resolve `/giveaway/:slug` |
| GET | `/api/giveaways/previous` | Public | Ended/archived giveaways |
| GET | `/api/giveaways/:id/winners` | Public | Masked winner list (empty/blocked if still active) |
| GET | `/api/giveaways/previous/winners` | Public | Aggregated history for Previous Winners tab |

**Participation**

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/giveaways/:id/my-status` | User | `joined \| not_joined`, entry details if joined |
| POST | `/api/giveaways/:id/join` | User | The guarded join transaction (body: `{}` — server derives everything) |

**Claim**

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/giveaways/:id/my-claim` | User | Own claim status, if a winner |
| POST | `/api/giveaways/:id/claim` | User (must be winner) | Submit physical/gift-card claim data |

**Admin**

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/admin/giveaways` | Admin | Create giveaway + prizes |
| PUT | `/api/admin/giveaways/:id` | Admin | Update |
| PATCH | `/api/admin/giveaways/:id/status` | Admin | Manual override (rare; normally lifecycle-driven) |
| POST | `/api/admin/giveaways/:id/select-winners` | Admin | Enforces `winnerCount` per prize |
| GET | `/api/admin/giveaways/:id/participants` | Admin | Participation list |
| GET | `/api/admin/claims` | Admin | Claims queue |
| PATCH | `/api/admin/claims/:id/status` | Admin | Move claim through Processing → Completed |
| GET | `/api/admin/fraud-events` | Admin | Review flagged activity |

All responses use a consistent envelope: `{ success: boolean, data?: any, error?: { code, message } }`, with `code` values from `errorCodes.js` (`GIVEAWAY_ENDED`, `ALREADY_PARTICIPATING`, `INSUFFICIENT_VE_BALANCE`, `LOGIN_REQUIRED`, `SUSPICIOUS_ACTIVITY`, `RATE_LIMITED`, `CLAIM_NOT_ALLOWED`, etc.) so the frontend can map codes to friendly copy without parsing raw error strings.

---

## E. MongoDB Schema Design

```js
// User
{
  name: String,
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balances: {
    ve: { type: Number, default: 0, min: 0 },
    sve: { type: Number, default: 0, min: 0 },
    token: { type: Number, default: 0, min: 0 }
  },
  refreshTokenHash: String,
  isVerified: { type: Boolean, default: false },
  timestamps: true
}

// Giveaway
{
  title: String,
  slug: { type: String, unique: true, index: true },
  description: String,
  status: { type: String, enum: ['upcoming','active','ended','archived'], index: true },
  startAt: { type: Date, index: true },
  endAt: { type: Date, index: true },
  bannerImage: String,
  eligibility: [String],
  rules: [String],
  participationSettings: {
    allowMultipleEntries: { type: Boolean, default: false }
  },
  prizes: [{ type: ObjectId, ref: 'Prize' }],
  createdBy: { type: ObjectId, ref: 'User' },
  timestamps: true
}
// index: { status: 1, startAt: 1, endAt: 1 }

// Prize
{
  giveaway: { type: ObjectId, ref: 'Giveaway', index: true },
  name: String,                 // "iPhone 15 Pro"
  position: String,             // "1st Prize"
  image: String,
  description: String,
  type: { type: String, enum: ['PHYSICAL','GIFT_CARD','DIGITAL'] },
  claimType: { type: String, enum: ['PHYSICAL_ADDRESS','EMAIL'] },
  entryCurrency: { type: String, enum: ['VE','SVE','TOKEN'] },
  entryAmount: Number,          // e.g. 250
  winnerCount: Number,          // e.g. 1
  value: String                 // optional, e.g. "₹2,000" — display only
}

// GiveawayParticipation — the core anti-duplicate guard
{
  user: { type: ObjectId, ref: 'User', index: true },
  giveaway: { type: ObjectId, ref: 'Giveaway', index: true },
  prize: { type: ObjectId, ref: 'Prize' },
  entryCurrency: String,
  entryAmount: Number,
  deviceHash: String,
  ipHash: String,
  status: { type: String, enum: ['SUCCESS','FAILED','BLOCKED'] },
  transaction: { type: ObjectId, ref: 'GiveawayEntryTransaction' },
  joinedAt: Date
}
// UNIQUE COMPOUND INDEX — enforced at the DB, not just app logic:
// index({ user: 1, giveaway: 1 }, { unique: true })

// GiveawayEntryTransaction
{
  user: { type: ObjectId, ref: 'User' },
  giveaway: { type: ObjectId, ref: 'Giveaway' },
  prize: { type: ObjectId, ref: 'Prize' },
  currency: String,
  amount: Number,
  type: { type: String, enum: ['ENTRY_FEE','REVERSAL'] },
  status: { type: String, enum: ['PENDING','SUCCESS','FAILED','REVERSED'] },
  balanceBefore: Number,
  balanceAfter: Number,
  idempotencyKey: { type: String, unique: true, sparse: true },
  timestamps: true
}

// GiveawayWinner
{
  giveaway: { type: ObjectId, ref: 'Giveaway', index: true },
  prize: { type: ObjectId, ref: 'Prize' },
  user: { type: ObjectId, ref: 'User' },
  selectionMethod: { type: String, enum: ['MANUAL','RANDOM'] },
  selectedAt: Date,
  status: { type: String, enum: ['PENDING_CLAIM','CLAIMED','EXPIRED'] },
  claimDeadline: Date
}
// index({ prize: 1, user: 1 }, { unique: true }) — prevents duplicate winner record

// PrizeClaim — sensitive, never exposed on public endpoints
{
  winner: { type: ObjectId, ref: 'GiveawayWinner', unique: true },
  user: { type: ObjectId, ref: 'User' },
  prize: { type: ObjectId, ref: 'Prize' },
  claimType: { type: String, enum: ['PHYSICAL','EMAIL'] },
  submittedData: {
    name: String, phone: String, address: String, city: String, state: String, pin: String,
    email: String
  },
  status: { type: String, enum: ['NOT_SUBMITTED','SUBMITTED','PROCESSING','COMPLETED','EXPIRED'] },
  submittedAt: Date,
  processedAt: Date
}

// FraudEvent
{
  user: { type: ObjectId, ref: 'User' },
  giveaway: { type: ObjectId, ref: 'Giveaway' },
  deviceHash: String,
  ipHash: String,
  riskScore: Number,           // 0–100
  reason: String,
  signals: [String],
  action: { type: String, enum: ['ALLOWED','FLAGGED','BLOCKED'] },
  createdAt: Date
}

// AuditLog
{
  user: { type: ObjectId, ref: 'User' },
  action: { type: String, enum: [
    'JOIN_GIVEAWAY','ENTRY_FEE_DEDUCTED','JOIN_REJECTED','DUPLICATE_ATTEMPT',
    'FRAUD_FLAGGED','CLAIM_SUBMITTED','WINNER_SELECTED'
  ]},
  giveaway: { type: ObjectId, ref: 'Giveaway' },
  amount: Number,
  currency: String,
  result: String,
  requestId: String,
  meta: Object,
  createdAt: Date
}
```

---

## F. Component Architecture

- **Presentation vs. logic split:** components in `components/` are dumb/reusable; all data fetching lives in `hooks/`, which call `services/`. No component calls `axios` directly.
- **Currency-agnostic UI:** `PrizeCard`, `ConfirmJoinModal`, and the entry-fee display all read `prize.entryCurrency` + `prize.entryAmount` from data and route through `utils/currencyFormatter.js` — no `if (prize.name === 'iPhone')` anywhere (per spec §11, §69, §85).
- **Prize-type-agnostic claim UI:** `PrizeClaimModal` picks `PhysicalClaimForm` or `GiftCardClaimForm` based on `prize.claimType` via a lookup table in `utils/prizeTypeConfig.js`, not inline branching per prize.
- **State ownership:**
  - `AuthContext` — user, tokens, login/logout
  - `useGiveaway(slug)` — current giveaway + prize + my-status, with `loading/success/error/empty`
  - `useCountdown(endAt)` — pure display timer; on reaching zero, re-fetches from backend rather than assuming "ended" (backend is authoritative, per spec §5)
  - `useParticipation()` — join mutation, confirm-modal state, success/error state
  - `useClaim()` — claim mutation + status polling
- **Loader system:** `VeloopLoader` (full-page) for initial load; `CardSkeleton` / `StatSkeleton` / `WinnerSkeleton` for section-level loading, per spec §23/§55.

---

## G. Authentication Architecture

```
Register → bcrypt hash (cost 12) → User created
Login → verify hash → issue:
   accessToken  (JWT, 15 min, payload { sub: userId, role })
   refreshToken (random token, 7 days, httpOnly + secure cookie,
                 SHA-256 hash stored on User.refreshTokenHash for revocation)

apiClient.js (axios):
   request interceptor  → attach `Authorization: Bearer <accessToken>`
   response interceptor → on 401 once, call /auth/refresh, retry original request;
                           on second 401, force logout

authMiddleware:
   verify JWT → req.user = { id, role }   (NEVER read identity from req.body)

requireRole(['admin']):
   403 if req.user.role !== 'admin'
```

Ownership checks (e.g. claim endpoint) always compare `req.user.id` against the DB record's `user` field — the request body is never trusted for identity, per spec §34, §70.

---

## H. Giveaway State Machine

```
        startAt reached           endAt reached          admin finalizes winners
UPCOMING ─────────────────► ACTIVE ─────────────────► ENDED ─────────────────► ARCHIVED
   │                           │                          │
   │ Join: blocked             │ Join: allowed if          │ Join: blocked
   │ (NOT_STARTED)             │ balance/eligibility OK    │ (GIVEAWAY_ENDED)
   │                           │                            Claims: opened for winners
```

- **Source of truth:** `Giveaway.status` field in DB, kept in sync by `jobs/giveawayStatusSweep.js` (cron, every 60s).
- **Defense in depth:** every service method that gates an action (join, claim) independently re-checks `startAt <= now <= endAt` against the *current* server time — it does not rely solely on the stored `status` field, so a stale cron tick can't create a window for abuse (spec §19–20).
- **Frontend never decides state:** `Countdown` is a display-only timer; reaching zero triggers a re-fetch, and the UI reacts to whatever `status` the backend returns.

---

## I. Join / Claim Flow

**Join**

```
Click "Join Giveaway – 250 VEs" on /giveaway/:slug
  → not authenticated? → LoginRequiredModal → /login
  → authenticated → GET my-status (already joined? show "You're Already Participating")
  → ConfirmJoinModal shows: prize, entry fee, current balance (from /auth/me), balance after
  → "Confirm & Join" → POST /giveaways/:id/join  { idempotencyKey }
      Backend, inside a Mongoose transaction:
        1. authenticate (JWT)                     → 401 LOGIN_REQUIRED
        2. validate request shape                 → 400
        3. rate-limit check                       → 429 RATE_LIMITED
        4. load giveaway, recompute live status    → 409 GIVEAWAY_NOT_ACTIVE / GIVEAWAY_ENDED
        5. fraud signals → riskScore                → 403 SUSPICIOUS_ACTIVITY (if HIGH/CRITICAL)
        6. check existing participation (unique idx)→ 409 ALREADY_PARTICIPATING
        7. load prize → authoritative currency+fee  (ignores any client-sent amount/currency)
        8. check balance                            → 402 INSUFFICIENT_VE_BALANCE (etc.)
        9. deduct balance + create Participation +
           create EntryTransaction (all atomic)
       10. write AuditLog(JOIN_GIVEAWAY / ENTRY_FEE_DEDUCTED)
       11. commit → 200 { participation, transaction }
  → Frontend: success animation "You're In!" or maps error code → friendly message
```

**Claim**

```
Giveaway ends → admin runs "select winners" → GiveawayWinner records created (winnerCount enforced)
User visits their giveaway/profile → GET /my-claim
  → not a winner → normal non-winner UI (winners list, "explore next giveaway")
  → is a winner → "🎉 Congratulations!" → Claim Your Prize
  → PrizeClaimModal renders Physical or GiftCard form based on prize.claimType
  → Submit → POST /giveaways/:id/claim
      Backend:
        1. authenticate
        2. confirm req.user.id === winner.user (ownership) → 403 CLAIM_NOT_ALLOWED
        3. confirm claim not already submitted/expired
        4. validate fields server-side (name/phone/address/city/state/pin OR email)
        5. create/update PrizeClaim, status → SUBMITTED
        6. AuditLog(CLAIM_SUBMITTED)
  → Frontend shows claim status badge: Submitted → Processing → Completed (admin-driven) or Expired
```

---

## J. Security / Fraud Protection Plan

| Layer | Mechanism |
|---|---|
| Transport | HTTPS everywhere, Helmet security headers, CORS allow-list of `CLIENT_URL` only (never `cors('*')`) |
| AuthN | JWT access token (short-lived) + rotating refresh token (httpOnly cookie) |
| AuthZ | `authMiddleware` + `requireRole`; every write checks resource ownership, not just role |
| Input validation | `express-validator`/Joi schemas on every route body/params before it reaches a controller |
| Rate limiting | `express-rate-limit` on `/login`, `/join`, `/claim` — friendly `RATE_LIMITED` response, not a stack trace |
| Idempotency | Client sends a UUID `idempotencyKey`; unique index on `EntryTransaction.idempotencyKey` — repeated clicks/retries return the original result instead of double-charging |
| Atomicity | Mongoose session/transaction wraps balance deduction + participation + transaction record — all-or-nothing |
| Duplicate protection | Compound **unique DB index** `(user, giveaway)` on `GiveawayParticipation` — survives simultaneous requests, not just an `if (alreadyJoined)` check |
| Fraud scoring | `fraudService` computes a 0–100 `riskScore` from device-hash reuse, IP reuse, account age, and request velocity; LOW/MEDIUM allowed (medium flagged), HIGH/CRITICAL blocked and logged to `FraudEvent` — no single signal is treated as definitive proof (spec §21) |
| Audit trail | Every balance-affecting or winner/claim action writes to `AuditLog`; failed/rejected attempts are logged too (`JOIN_REJECTED`, `DUPLICATE_ATTEMPT`) |
| Data privacy | `PrizeClaim.submittedData` is excluded from every public/user-facing serializer; winner lists only ever return `maskUserId(user)` (`VE****42`) + prize + date |
| Reversal, not deletion | If a business reversal is ever needed, a compensating `REVERSAL` transaction is written — the original record is never deleted, preserving the audit trail (spec §68) |

---

## K. Implementation Roadmap

**Window: 20 Aug – 12 Sep 2026 (23 days) — mapped below, 1-day buffer before submission.**

| Phase | Days | Deliverable | Functional checkpoint |
|---|---|---|---|
| 0 — Scaffold | Day 1 (Aug 20) | Vite client + Express server skeletons, ESLint, Git repo, `.env.example` x2, Atlas cluster, folder structure, `/health` endpoint | `npm run dev` on both, health check returns 200 |
| 1 — Auth | Days 2–4 (Aug 21–23) | `User` model, register/login/refresh/logout, `authMiddleware`, `AuthContext`, `ProtectedRoute` | User can register/login; protected page redirects when logged out |
| 2 — Giveaway core | Days 5–7 (Aug 24–26) | `Giveaway`/`Prize` models, minimal admin CRUD, `GET /current /:id /previous`, Home page wired to real data with loading/error/empty states, `VeloopLoader`, `GiveawayHero`, `GiveawayStats`, `PrizeCard`, `FeaturedGiveaways` | Home page renders real giveaway data end-to-end, no mock fallback needed |
| 3 — Join flow | Days 8–11 (Aug 27–30) | `GiveawayDetails` page, `Countdown`, entry-fee card, `ConfirmJoinModal`, full `POST /join` transaction chain, `GiveawayParticipation` + `GiveawayEntryTransaction` with unique index + idempotency key | Join works end-to-end; duplicate/insufficient-balance/ended-giveaway all correctly rejected with clean error UI |
| 4 — Winners & claims | Days 12–15 (Aug 31–Sep 3) | `GiveawayWinner`/`PrizeClaim` models, admin "select winners" (enforces `winnerCount`), `GET /winners /previous/winners`, `WinnerSlider`, `WinnersTabs`, `PreviousWinnerCard`, `PrizeClaimModal` (Physical + GiftCard) | Non-winner cannot reach claim form; winner can submit and see status progress through states |
| 5 — Fraud/security | Days 16–17 (Sep 4–5) | Rate limiting, `deviceHash` capture, `fraudService` + `FraudEvent`, `AuditLog` wired into every sensitive action, input validation coverage pass | Malicious test cases (§70 of spec) all rejected correctly |
| 6 — UX polish | Days 18–19 (Sep 6–7) | How It Works, FAQ, Trust section, Rules, full responsive pass (320/768/1024/1440/1920), Framer Motion micro-interactions, winner reveal animation, accessibility pass | Lighthouse a11y check clean, no layout breaks at any breakpoint |
| 7 — Testing | Days 20–21 (Sep 8–9) | Manual test matrix from spec §33/§69/§70 executed and bugs fixed | Console-error-free production build |
| 8 — Deploy & docs | Days 22–23 (Sep 10–11) | Backend on Render/Railway, frontend on Vercel, prod env vars/CORS, README (overview/features/architecture/setup/API docs/limitations), required screenshots, final `git` history cleanup | Live URL works end-to-end in production |
| Buffer | Day 23–24 (Sep 12) | Final review only | Submission |

Each phase's checkpoint must pass before starting the next — matches the spec's explicit "ensure the previous phase is functional" instruction (§39).

---

## L. Dependencies / Package List

**client/package.json**

```
dependencies:
  react, react-dom, react-router-dom, axios,
  bootstrap, lucide-react, framer-motion, date-fns

devDependencies:
  vite, @vitejs/plugin-react, eslint, eslint-plugin-react,
  eslint-plugin-react-hooks, vitest, @testing-library/react
```

**server/package.json**

```
dependencies:
  express, mongoose, jsonwebtoken, bcryptjs, cors, helmet,
  express-rate-limit, express-validator, dotenv, morgan,
  cookie-parser, uuid, node-cron

devDependencies:
  nodemon, eslint, jest, supertest
```

---

## M. Environment Variable List

**server/.env**

| Variable | Description |
|---|---|
| `PORT` | API port (e.g. 5000) |
| `NODE_ENV` | `development` \| `production` |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | Access-token signing secret |
| `JWT_EXPIRES_IN` | e.g. `15m` |
| `REFRESH_SECRET` | Refresh-token signing/hash secret |
| `REFRESH_EXPIRES_IN` | e.g. `7d` |
| `CLIENT_URL` | Exact frontend origin for CORS allow-list |
| `COOKIE_SECRET` | For signed cookies |
| `RATE_LIMIT_WINDOW_MS` | e.g. `900000` |
| `RATE_LIMIT_MAX` | e.g. `100` |
| `BCRYPT_SALT_ROUNDS` | e.g. `12` |

**client/.env**

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_ENABLE_MOCK_FALLBACK` | `true` only in local dev, never in prod build |

Both directories commit `.env.example` with keys but no values; `.env` itself is git-ignored.

---

## Next Step

This covers A–M as requested. Nothing beyond this architecture has been implemented yet.

If this looks right, say the word and I'll start **Phase 0 (scaffold)** and **Phase 1 (auth)** — the two phases that need to be solid before anything else can be built on top of them.
