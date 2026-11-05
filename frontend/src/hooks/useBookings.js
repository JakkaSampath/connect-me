import { useCallback, useEffect, useState } from 'react';
import {
  acceptBooking,
  cancelBooking,
  getMyBookings,
  getRideBookings,
  rejectBooking,
  requestBooking,
} from '../api/bookings.api.js';
import { getRide } from '../api/rides.api.js';

// Loads data via an api/ call whenever `deps` change; returns { data, error, reload }.
// Late responses (after deps changed or the page unmounted) are ignored, and on
// reload the old data stays visible until the new data arrives.
// (Same helper as in useRides.js, kept private to each hook file per plan.md §5.)
function useLoad(load, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    setError(null);
    load()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
    // `load` is a new function each render; `deps` lists what it depends on.
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, reload };
}

// The caller's own bookings (as passenger), plus cancelling one.
export function useMyBookings() {
  const { data, error, reload } = useLoad(getMyBookings, []);

  const cancel = useCallback(
    async (bookingId) => {
      try {
        await cancelBooking(bookingId);
      } finally {
        reload(); // refresh either way, so the list shows the booking's real state
      }
    },
    [reload],
  );

  return { bookings: data?.bookings ?? null, error, cancel };
}

// A driver's view of one ride and its booking requests, plus accept/reject.
export function useRideRequests(rideId) {
  const { data, error, reload } = useLoad(
    () => Promise.all([getRide(rideId), getRideBookings(rideId)]),
    [rideId],
  );

  const respond = useCallback(
    async (bookingId, action) => {
      try {
        await (action === 'accept' ? acceptBooking(bookingId) : rejectBooking(bookingId));
      } finally {
        reload(); // seat counts and statuses change either way (or were already changed)
      }
    },
    [reload],
  );

  return {
    ride: data?.[0].ride ?? null,
    requests: data?.[1].bookings ?? null,
    error,
    accept: (bookingId) => respond(bookingId, 'accept'),
    reject: (bookingId) => respond(bookingId, 'reject'),
  };
}

// Sending a seat request for a ride: state is 'idle' | 'submitting' | 'success' | 'error'.
export function useBookingRequest() {
  const [request, setRequest] = useState({ state: 'idle', message: null });

  const submit = useCallback(async ({ rideId, seatsBooked }) => {
    setRequest({ state: 'submitting', message: null });
    try {
      await requestBooking({ rideId, seatsBooked });
      setRequest({ state: 'success', message: 'Request sent! Track it under My bookings.' });
    } catch (err) {
      setRequest({ state: 'error', message: err.message });
    }
  }, []);

  return { ...request, submit };
}
