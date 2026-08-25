# Testing Matrix — Phase 7

Maps the spec's required test coverage (frontend doc §33/§69/§75, backend doc §70) to what
actually verifies it. "Automated" links to a real test file; "Manual" means it was exercised
by hand against a live server + MySQL during development (see chat history / commit messages
for the specific commands run).

**Totals: 66 backend tests (Jest+Supertest, live MariaDB) + 39 frontend tests (Vitest+RTL).**
Run with `npm test` in `server/` and `client/` respectively.

## Authentication

| Case | Coverage |
|---|---|
| Register / login / logout | Automated — `tests/auth.integration.test.js` |
| Duplicate email rejected | Automated |
| Wrong password rejected | Automated |
| Access token expiry → refresh rotation | Automated (full lifecycle test) |
| Logout revokes the refresh token server-side | Automated — replays a captured pre-logout cookie, confirms rejection |
| Protected route rejects missing/garbage token | Automated |

## Giveaway loading & lifecycle

| Case | Coverage |
|---|---|
| Current giveaway list (active + upcoming, excludes ended) | Automated — `tests/giveaway.integration.test.js` |
| Previous giveaways list (ended/archived only) | Automated |
| Status derived correctly from startAt/endAt at creation time | Automated — active vs. upcoming derivation |
| Slug resolution (prize-scoped) | Automated |
| 404 for unknown giveaway/slug/id | Automated |
| Stats reflect real counts, never fabricated | Automated — asserts exact counts, including zeros |
| Countdown ticks correctly, clamps at zero, never negative | Automated (frontend) — `useCountdown.test.js` |

## Join flow

| Case | Coverage |
|---|---|
| Unauthenticated join rejected | Automated — `tests/participation.integration.test.js` |
| Insufficient balance rejected, balance left untouched | Automated |
| Successful join deducts the correct currency/amount | Automated |
| Client-supplied amount/currency/userId ignored | Automated — asserts server-derived values win |
| Duplicate join rejected (same user + prize) | Automated, both the friendly pre-check path and the DB-constraint race path |
| Join on an ended giveaway rejected | Automated |
| Join on an upcoming giveaway rejected | Automated |
| Idempotency key replay — same result, charged once | Automated |
| Confirm-modal never joins on first click | Automated (frontend) — `ParticipationCTA.test.jsx` |
| Confirm-modal shows correct balance / balance-after | Automated (frontend) |
| Login-required prompt for unauthenticated visitor | Automated (frontend) |
| Real end-to-end: register → top up balance → join → balance deducted in DB → duplicate rejected | Manual, verified against live MariaDB (see Phase 3 commit) |

## Winner selection

| Case | Coverage |
|---|---|
| Admin/role guard on select-winners | Automated — `tests/winner.integration.test.js` |
| Rejected for a giveaway that hasn't ended | Automated |
| Exactly `winnerCount` winners selected, no more, from real participants | Automated |
| Idempotent — re-running doesn't create duplicates | Automated |
| Winners never shown for an active/upcoming giveaway | Automated |
| Public winner identity is masked, real email/UUID never leaked | Automated — asserts raw identity absent from response body |
| Previous-winners aggregation includes ended giveaways | Automated |
| Full lifecycle: create ended giveaway → insert participants → select → confirm winner in DB | Manual, verified against live MariaDB (see Phase 4 commit) |

## Winner claim

| Case | Coverage |
|---|---|
| Non-winner cannot access/submit a claim | Automated — `tests/claim.integration.test.js` |
| Ownership: winner of prize A can't claim prize B | Automated |
| Physical claim: all required fields enforced server-side | Automated |
| Gift-card claim: only email required, no address fields | Automated |
| Duplicate claim submission rejected | Automated |
| Expired claim window rejected | Automated |
| Claim-type-correct form rendered (physical vs. email) | Automated (frontend) — `PrizeClaimModal` picks form from `prize.claimType` |
| Winner banner + claim button appear only for actual winners | Automated (frontend) — `WinnerStatus.test.jsx` |
| Non-winner sees neutral message, never the claim form | Automated (frontend) |
| Claim status badge shows correct copy per state | Automated (frontend) — parameterized across all 4 states |
| Real claim submission lands correctly in DB | Manual, verified (see Phase 4 commit) |

## Fraud / abuse

| Case | Coverage |
|---|---|
| Clean attempt scores 0, ALLOWED | Automated — `tests/fraud.integration.test.js` |
| Moderate device sharing stays ALLOWED | Automated |
| Heavy device sharing → FLAGGED | Automated |
| A user's own history doesn't count against themselves | Automated |
| High request velocity flagged | Automated |
| Combined signals cross into BLOCKED | Automated |
| Enforcement wired into the real join flow without breaking existing join tests | Automated — full suite re-run confirmed 66/66 after wiring |

## Admin authorization

| Case | Coverage |
|---|---|
| Unauthenticated admin action rejected | Automated (create-giveaway, select-winners) |
| Non-admin user rejected | Automated (create-giveaway, select-winners) |
| Malformed/invalid IDs rejected cleanly (not a raw DB error) | Automated + a Phase 5 fix (added a missing validator on `GET /giveaways/:id`) |

## API errors & responses

| Case | Coverage |
|---|---|
| Consistent `{ success, data }` / `{ success, error: {code, message} }` envelope | Automated across every test file (asserted on every response) |
| 404 for unknown routes, not an HTML error page | Automated — `auth.smoke.test.js` |
| Rate limiting on auth/join/claim, friendly message | Manual — implemented, enforcement skipped under `NODE_ENV=test` (documented rationale in code) |
| Validation errors return field-level messages, not raw exceptions | Automated (registration, giveaway creation, claim submission) |

## Responsive layouts

| Breakpoint | Coverage |
|---|---|
| 320px+ (mobile) | Manual — Navbar mobile menu, stacked hero, single-column grids verified via browser resize during Phases 2–6 |
| 768px+ (tablet) | Manual — 2-column grids (FeaturedGiveaways, WinnersTabs, TrustSection) |
| 1024px+ / 1440px+ (desktop) | Manual — 3–4 column grids, two-column GiveawayDetails hero |
| Not yet done | Automated visual/screenshot regression testing (out of scope for this stack — would need a tool like Playwright, not part of the required stack) |

## Known gaps at this checkpoint

- No automated tests for the auth pages (Login/Register) or Navbar/Footer — low-risk,
  presentational, and already covered indirectly by the auth integration tests on the backend.
- No load/performance testing — out of scope for this assignment's stack and timeline.
- Manual steps (winner selection, balance top-up) require direct DB/API access since there's
  no admin UI — documented in `README.md`, not a testing gap so much as a Phase 8+ UI gap.
