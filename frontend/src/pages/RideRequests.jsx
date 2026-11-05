import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRideRequests } from '../hooks/useBookings.js';
import BookingBadge from '../components/BookingBadge.jsx';

export default function RideRequests() {
  const { id } = useParams();
  const { ride, requests, error: loadError, accept, reject } = useRideRequests(id);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const error = actionError || loadError;

  const act = async (bookingId, action) => {
    setBusyId(bookingId);
    setActionError(null);
    setNotice(null);
    try {
      await (action === 'accept' ? accept(bookingId) : reject(bookingId));
      setNotice(action === 'accept' ? 'Request accepted — seats confirmed.' : 'Request rejected.');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-3 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Ride requests</h1>
        <Link to="/rides" className="text-sm font-medium text-slate-600 hover:underline">
          Back to my rides
        </Link>
      </div>

      {ride && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="font-medium text-slate-800">
            {ride.origin} → {ride.destination}
          </p>
          <p className="text-sm text-slate-500">
            {new Date(ride.departureAt).toLocaleString()} · {ride.availableSeats}/{ride.totalSeats} seats open
          </p>
        </div>
      )}

      {notice && <p className="text-sm text-green-600">{notice}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {requests === null && !error && <p className="text-sm text-slate-500">Loading…</p>}
      {requests && requests.length === 0 && (
        <p className="text-sm text-slate-500">No requests yet.</p>
      )}

      {requests?.map((b) => (
        <div key={b.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800">{b.passenger?.name}</p>
              <p className="text-sm text-slate-500">
                {b.seatsBooked} seat{b.seatsBooked === 1 ? '' : 's'} requested
              </p>
            </div>
            <BookingBadge status={b.status} />
          </div>

          {b.status === 'PENDING' && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => act(b.id, 'accept')}
                disabled={busyId === b.id}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => act(b.id, 'reject')}
                disabled={busyId === b.id}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
