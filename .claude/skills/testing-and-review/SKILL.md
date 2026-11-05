---
name: testing-and-review
description: >-
  Testing and code-review standards for the Carpooling Platform — unit,
  integration, API, and frontend tests, plus bug hunting, code review, and
  security checks. Use when adding tests, reviewing a diff, or verifying a task
  before reporting. Enforces plan.md §13 and CLAUDE.md §11/§12.
---

# Testing and Review

Follow `plan.md` §13 and `CLAUDE.md` §11, §12. After every task, report what was tested and the results; if something is untested or failing, say so explicitly. Do not implement application features.

## Unit testing
- Test business logic in services in isolation:
  - Seat decrement on accept; seat restore on cancel; `availableSeats` never negative.
  - No self-booking; no past-date publish/book; one active booking per (ride, passenger).
  - Ownership checks (ride owner, booking owner).
- Keep tests deterministic; mock time/dependencies where needed.

## Integration testing
- Exercise each endpoint against an isolated test database.
- Cover success, validation (`400`), auth (`401`), ownership (`403`), not-found (`404`), and conflict (`409`) paths.
- Reset DB state between tests to avoid cross-test leakage.

## API testing
- Verify the documented contract in `plan.md` §8: status codes, JSON shapes, and the `{ error: { code, message } }` error format.
- Confirm sensitive fields (`passwordHash`, email/phone in public listings) are never exposed.
- Confirm identity is derived from the JWT, not client input.

## Frontend testing
- Component tests for key UI (RideCard, booking flow, forms): render, loading/error/empty states, user interactions.
- Verify the api/ layer maps error codes to messages and handles `401` by clearing auth.
- Manual responsive and accessibility spot-checks (keyboard, focus, contrast).

## Bug testing (edge cases)
- The last-seat concurrency race: parallel accepts → exactly one succeeds (required test).
- Accept after seats filled → `409`; request exceeding availability → `400`/`409`.
- Ride edited below accepted seats → guarded; duplicate double-submit request → blocked.
- Departure passing while PENDING; timezone correctness on travel date.

## Code review
- Confirm the change follows the approved architecture and folder structure, and stays scoped (no unrelated files touched).
- Routes thin, logic in services, seat writes transactional with row locking.
- Validation present on all inputs; errors typed and centrally handled; naming and reuse are clean.
- Flag any new dependency and any deviation from `plan.md` / `CLAUDE.md`.

## Security checks
- No hardcoded secrets; env vars used; `.env` gitignored.
- bcrypt hashing; JWT verified; authorization enforced on every mutation (no IDOR).
- Inputs validated; Prisma parameterized (no injection); rate limiting on auth/booking; CORS locked to the frontend origin.
- No sensitive data leaked in responses or logs.

## Reporting format (per task)
List changed files with a one-line explanation each, then state tests run and their pass/fail results. Call out anything deferred or unverified.
