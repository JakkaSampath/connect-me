// Admin business logic (Phase 10): platform statistics, user/ride listing and
// viewing, deactivation/reactivation, and user deletion. All reads use Prisma
// `select`/`include` so passwordHash is never returned.
import { randomBytes } from 'node:crypto';
import { NotFound, Forbidden, Conflict } from '../../lib/errors.js';
import { hashPassword } from '../../lib/hash.js';
import { toPublicRide } from '../rides/rides.service.js';
import { hasDeparted } from '../../lib/rideStatus.js';

// Admin user view: includes moderation fields (role, isActive) but never passwordHash.
const adminUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  bio: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
};

// Admin ride view may include driver contact details (email) since the caller is privileged.
const adminRideDriverSelect = { id: true, name: true, email: true };

const RIDE_STATUSES = ['ACTIVE', 'CANCELLED', 'COMPLETED', 'SUSPENDED'];
const BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'EXPIRED'];

// Turn a Prisma groupBy result into a { STATUS: count } map with every status
// present (zero-filled), so the dashboard always renders a stable shape.
function countsByStatus(groups, allStatuses) {
  const counts = Object.fromEntries(allStatuses.map((s) => [s, 0]));
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

// Re-label `count` items from one status to another. Used for the derived statuses
// (COMPLETED/EXPIRED, see lib/rideStatus.js) that are never stored in the database.
function moveCount(counts, from, to, count) {
  counts[from] -= count;
  counts[to] += count;
}

const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

export async function getStats(prisma) {
  // An ACTIVE ride whose departure has passed is COMPLETED (same rule as lib/rideStatus.js).
  const departedActiveRide = { status: 'ACTIVE', departureAt: { lte: new Date() } };

  const [userTotal, userActive, userDeleted, rideGroups, bookingGroups, ridesCompleted, bookingsCompleted, bookingsExpired] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.ride.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.ride.count({ where: departedActiveRide }),
      prisma.booking.count({ where: { status: 'ACCEPTED', ride: departedActiveRide } }),
      prisma.booking.count({ where: { status: 'PENDING', ride: departedActiveRide } }),
    ]);

  const ridesByStatus = countsByStatus(rideGroups, RIDE_STATUSES);
  moveCount(ridesByStatus, 'ACTIVE', 'COMPLETED', ridesCompleted);

  const bookingsByStatus = countsByStatus(bookingGroups, BOOKING_STATUSES);
  moveCount(bookingsByStatus, 'ACCEPTED', 'COMPLETED', bookingsCompleted);
  moveCount(bookingsByStatus, 'PENDING', 'EXPIRED', bookingsExpired);

  return {
    // Deleted accounts are also inactive; count them only as deleted.
    users: {
      total: userTotal,
      active: userActive,
      deactivated: userTotal - userActive - userDeleted,
      deleted: userDeleted,
    },
    rides: { total: sum(ridesByStatus), byStatus: ridesByStatus },
    bookings: { total: sum(bookingsByStatus), byStatus: bookingsByStatus },
  };
}

export async function listUsers(prisma, { limit = 20, offset = 0 } = {}) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      select: adminUserSelect,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.user.count(),
  ]);
  return { items, total, limit, offset };
}

export async function getUser(prisma, id) {
  const user = await prisma.user.findUnique({ where: { id }, select: adminUserSelect });
  if (!user) throw NotFound('User not found', 'USER_NOT_FOUND');
  return user;
}

export async function setUserActive(prisma, actingAdminId, id, isActive) {
  // An admin must not lock themselves out of the platform.
  if (!isActive && id === actingAdminId) {
    throw Forbidden('Admins cannot deactivate their own account', 'ADMIN_SELF_DEACTIVATION');
  }
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
  if (!target) throw NotFound('User not found', 'USER_NOT_FOUND');
  if (target.deletedAt) throw Conflict('Deleted users cannot be changed', 'USER_DELETED');
  return prisma.user.update({ where: { id }, data: { isActive }, select: adminUserSelect });
}

const OPEN_BOOKING = ['PENDING', 'ACCEPTED'];

// Placeholder email for a deleted account: frees the real address and stays unique.
const deletedEmail = (id) => `deleted-${id}@deleted.invalid`;

// Deletion anonymizes the account instead of removing the row, so other users'
// ride and booking history stays intact. It is final: a deleted user can never be
// changed again (see setUserActive) and can never log in (isActive = false plus an
// unknown random password).
export async function deleteUser(prisma, actingAdminId, id) {
  if (id === actingAdminId) throw Forbidden('Admins cannot delete their own account', 'ADMIN_SELF_DELETION');
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, deletedAt: true } });
  if (!user) throw NotFound('User not found', 'USER_NOT_FOUND');
  if (user.role === 'ADMIN') throw Forbidden('Admin accounts cannot be deleted', 'ADMIN_DELETION_FORBIDDEN');
  if (user.deletedAt) throw Conflict('Deleted users cannot be changed', 'USER_DELETED');

  // Hash before the transaction: bcrypt is slow and must not run while rows are locked.
  const unusablePasswordHash = await hashPassword(randomBytes(32).toString('hex'));
  const now = new Date();
  const upcoming = { departureAt: { gt: now } };

  return prisma.$transaction(async (tx) => {
    const drivenRides = await tx.ride.findMany({
      where: { driverId: id, status: { in: ['ACTIVE', 'SUSPENDED'] }, ...upcoming },
      select: { id: true },
    });
    const ownBookings = await tx.booking.findMany({
      where: { passengerId: id, status: { in: OPEN_BOOKING }, ride: upcoming },
      select: { rideId: true },
    });

    // Lock every affected ride, in id order, before changing seats or statuses.
    // Other seat writers lock a single ride, so a fixed order can't deadlock with them.
    const rideIds = [...new Set([...drivenRides.map((r) => r.id), ...ownBookings.map((b) => b.rideId)])].sort();
    for (const rideId of rideIds) {
      await tx.$executeRaw`SELECT id FROM "Ride" WHERE id = ${rideId} FOR UPDATE`;
    }

    // 1. Their upcoming rides: cancel each ride and every open booking on it.
    const drivenIds = drivenRides.map((r) => r.id);
    const cancelledRideBookings = await tx.booking.updateMany({
      where: { rideId: { in: drivenIds }, status: { in: OPEN_BOOKING } },
      data: { status: 'CANCELLED' },
    });
    const cancelledRides = await tx.ride.updateMany({
      where: { id: { in: drivenIds }, status: { in: ['ACTIVE', 'SUSPENDED'] } },
      data: { status: 'CANCELLED' },
    });

    // 2. Their own open bookings on upcoming rides: re-read under the locks, give
    //    accepted seats back, then cancel.
    const openBookings = await tx.booking.findMany({
      where: { passengerId: id, status: { in: OPEN_BOOKING }, ride: upcoming },
      select: { id: true, rideId: true, status: true, seatsBooked: true },
    });
    for (const booking of openBookings.filter((b) => b.status === 'ACCEPTED')) {
      await tx.ride.update({
        where: { id: booking.rideId },
        data: { availableSeats: { increment: booking.seatsBooked } },
      });
    }
    await tx.booking.updateMany({
      where: { id: { in: openBookings.map((b) => b.id) } },
      data: { status: 'CANCELLED' },
    });

    // 3. Anonymize the account. isActive = false also rejects any token they still hold.
    const anonymized = await tx.user.update({
      where: { id },
      data: {
        name: 'Deleted user',
        email: deletedEmail(id),
        phone: null,
        bio: null,
        avatarUrl: null,
        passwordHash: unusablePasswordHash,
        isActive: false,
        deletedAt: now,
      },
      select: adminUserSelect,
    });

    return {
      user: anonymized,
      cancelledRides: cancelledRides.count,
      cancelledBookings: cancelledRideBookings.count + openBookings.length,
    };
  });
}

export async function listRides(prisma, { limit = 20, offset = 0 } = {}) {
  const [items, total] = await Promise.all([
    prisma.ride.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { driver: { select: adminRideDriverSelect } },
    }),
    prisma.ride.count(),
  ]);
  return { items: items.map(toPublicRide), total, limit, offset };
}

export async function getRide(prisma, id) {
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: { driver: { select: adminRideDriverSelect } },
  });
  if (!ride) throw NotFound('Ride not found', 'RIDE_NOT_FOUND');
  return toPublicRide(ride);
}

// Moderation: deactivate (ACTIVE → SUSPENDED) or reactivate (SUSPENDED → ACTIVE).
// Driver-owned CANCELLED/COMPLETED rides are left out of this state machine so an
// admin can't accidentally resurrect a ride the driver cancelled. Seat counts and
// bookings are untouched — SUSPENDED simply drops the ride out of search.
export async function setRideActive(prisma, id, active) {
  const ride = await prisma.ride.findUnique({
    where: { id },
    select: { id: true, status: true, departureAt: true },
  });
  if (!ride) throw NotFound('Ride not found', 'RIDE_NOT_FOUND');
  // A departed ride's outcome is final: it can't be reactivated (or suspended) after the fact.
  if (hasDeparted(ride)) throw Conflict('Ride has already departed', 'RIDE_DEPARTED');

  if (active) {
    if (ride.status !== 'SUSPENDED') {
      throw Conflict('Only suspended rides can be reactivated', 'RIDE_NOT_SUSPENDED');
    }
  } else if (ride.status !== 'ACTIVE') {
    throw Conflict('Only active rides can be suspended', 'RIDE_NOT_ACTIVE');
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: { status: active ? 'ACTIVE' : 'SUSPENDED' },
    include: { driver: { select: adminRideDriverSelect } },
  });
  return toPublicRide(updated);
}
