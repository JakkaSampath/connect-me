---
name: backend-development
description: >-
  Fastify backend conventions for the Carpooling Platform — routes, service
  layer, JSON-Schema validation, JWT auth, ownership authorization, error
  handling, and REST standards. Use when building or editing any API module
  (auth, users, rides, bookings). Enforces plan.md §4/§8/§9 and CLAUDE.md §6/§8/§9/§10.
---

# Backend Development

Follow `plan.md` §4, §8, §9 and `CLAUDE.md` §6, §8, §9, §10. Keep routes thin; do not put business logic or Prisma calls in routes. Do not implement features beyond the current task.


## Fastify development
- Build/configure the instance in `app.js`; start the listener in `server.js`.
- Register cross-cutting concerns as plugins: `prisma`, `auth`, `rateLimit`, `errorHandler`.
- Decorate the instance (e.g., `fastify.prisma`, `fastify.authenticate`) instead of importing singletons ad hoc.

## Routes and controllers
- Feature-sliced: `src/modules/<feature>/<feature>.routes.js|service.js|schema.js`.
- Routes declare method, path, `schema`, and `preHandler`s only, then delegate to the service.
- Request flow is fixed: `route (validated) → authenticate → authorize → service → prisma`.

## Service layer
- Services own all business rules and all multi-step writes.
- All seat-changing writes run inside `prisma.$transaction` with row locking; never adjust `availableSeats` outside a transaction.
- Enforce rules: no self-booking, no past-date publish/book, one active booking per (ride, passenger), seat availability checks.

## API validation
- Every route defines a JSON Schema for body/params/query (and response where useful).
- Reject invalid input with `400` before any service logic runs.
- Never trust client-supplied identity — derive the user from the JWT.

## JWT authentication
- `authenticate` preHandler verifies the Bearer token and attaches `request.user = { id, email }`.
- Sign tokens with `JWT_SECRET` from env; short-lived access token; never commit secrets.
- Passwords are bcrypt-hashed in the auth service; never store or return `passwordHash`.

## Authorization
- Enforce ownership on every mutation and user-scoped read:
  - Ride owner only: accept/reject requests, edit/cancel ride, view a ride's requests.
  - Passenger (booking owner) only: cancel own booking.
- Ownership failure → `403`. Check authorization in a preHandler or at the top of the service.

## Error handling
- Throw typed errors from `lib/errors.js`; the centralized `errorHandler` maps them to HTTP.
- Standard codes: `400` validation, `401` unauth, `403` ownership, `404` missing, `409` conflict (no seats / bad state).
- Never leak stack traces or internals; never log secrets. Roll back transactions atomically on error.

## REST API standards
- Base path `/api`; follow the endpoint contract in `plan.md` §8.
- JSON in/out; consistent error shape `{ error: { code, message } }`.
- Withhold sensitive fields (email/phone) from public listings until a booking relationship exists.
- If the contract changes, update `plan.md` §8 — with approval for structural changes.

## Reuse checklist
Prefer extending an existing module/service over duplicating logic. After the task: report changed files and the tests run (unit/integration) with results.
