// A ride is "over" once its departure time has passed. COMPLETED (and, for
// bookings, EXPIRED) is never written to the database; it is derived on read, so
// the status is always current without a scheduled job. Only ACTIVE rides become
// COMPLETED: a ride that was cancelled or suspended keeps that status after its
// departure time.

export function hasDeparted(ride, now = new Date()) {
  return new Date(ride.departureAt) <= now;
}

export function effectiveRideStatus(ride, now = new Date()) {
  if (ride.status === 'ACTIVE' && ride.departureAt && hasDeparted(ride, now)) return 'COMPLETED';
  return ride.status;
}

// A booking follows its ride. Once the ride is COMPLETED, an ACCEPTED booking is
// COMPLETED (the trip happened) and a PENDING one is EXPIRED (never answered).
// `ride` must carry its stored status and departureAt.
export function effectiveBookingStatus(booking, ride, now = new Date()) {
  if (!ride || effectiveRideStatus(ride, now) !== 'COMPLETED') return booking.status;
  if (booking.status === 'ACCEPTED') return 'COMPLETED';
  if (booking.status === 'PENDING') return 'EXPIRED';
  return booking.status;
}
