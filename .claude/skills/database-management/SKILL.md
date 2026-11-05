---
name: database-management
description: >-
  PostgreSQL + Prisma conventions for the Carpooling Platform — schema design,
  relationships, migrations, indexes, query optimization, and the transactional
  booking-concurrency model. Use when editing schema.prisma, writing migrations,
  or designing seat-accounting logic. Enforces plan.md §7 and CLAUDE.md §7.
---

# Database Management

Follow `plan.md` §7 and `CLAUDE.md` §7. The schema is defined; structural changes require a migration and prior approval. Do not implement application features.

## PostgreSQL
- All access goes through Prisma — no raw string-concatenated SQL.
- Use UTC for all timestamps; compare travel dates consistently against server time.
- Decimal money (`pricePerSeat`) uses `Decimal(10,2)`, never float.

## Database schema
- Three models only: `User`, `Ride`, `Booking`, exactly as in `plan.md` §7.
- UUID primary keys; `createdAt` and `updatedAt` on every model.
- Enums `RideStatus` (ACTIVE/CANCELLED/COMPLETED) and `BookingStatus` (PENDING/ACCEPTED/REJECTED/CANCELLED).
- `Ride.availableSeats` is the authoritative, denormalized seat count — do not derive availability elsewhere.

## Relationships
- `User 1—∞ Ride` via named relation `DriverRides`.
- `User 1—∞ Booking` via named relation `PassengerBookings`.
- `Ride 1—∞ Booking`.
- Keep named relations — `User` reaches rides and bookings on two distinct paths.

## Migrations
- Every schema change is a Prisma migration; never hand-edit the database.
- Review generated SQL before applying; name migrations descriptively.
- Keep migrations forward-only in shared environments; regenerate the client after changes.

## Transactions
- All seat-changing operations run inside `prisma.$transaction`.
- On accept: lock the ride row, re-check `availableSeats >= seatsBooked`, set booking ACCEPTED, decrement seats.
- On cancel of an ACCEPTED booking (before departure): set CANCELLED, increment seats.
- On driver ride-cancel: ride → CANCELLED and cascade PENDING/ACCEPTED bookings → CANCELLED, atomically.
- `availableSeats` must never go negative; roll back fully on any error.

## Indexing
- Preserve the search index `(origin, destination, departureAt)` and the `driverId`, `(rideId, status)`, and `passengerId` indexes.
- Add indexes only to support real query paths; justify each.

## Query optimization
- Search filters: `status = ACTIVE`, `availableSeats > 0`, date-bounded `departureAt`, case-insensitive origin/destination — served by the search index.
- Select only needed fields; avoid N+1 by using Prisma relation includes deliberately.
- Exclude the caller's own rides from their bookable search results.

## Booking concurrency (critical)
- The last-seat race is the top correctness risk: two simultaneous accepts must yield exactly one success.
- Always use row locking + in-transaction re-check before decrementing.
- This behavior must be covered by a concurrency test (see testing-and-review).

## Reuse checklist
Reuse existing query helpers and transaction patterns. After the task: report schema/migration changes and the concurrency/seat tests run with results.
