import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRide } from '../hooks/useRides.js';
import { useBookingRequest } from '../hooks/useBookings.js';
import SeatSelector from '../components/SeatSelector.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function RideDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { ride, error } = useRide(id);
  const request = useBookingRequest();
  const [seats, setSeats] = useState(1);

  const onRequest = () => request.submit({ rideId: id, seatsBooked: seats });

  if (error) {
    return <div className="flex justify-center p-12 text-red-500">{error}</div>;
  }
  if (!ride) {
    return <div className="flex justify-center p-12 text-slate-500">Loading…</div>;
  }

  const isOwnRide = ride.driver?.id === user?.id;
  const bookable = ride.status === 'ACTIVE' && ride.availableSeats > 0 && !isOwnRide;

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Ride details</h1>
        <Link to="/search" className="text-sm font-medium text-slate-600 hover:underline">
          Back to search
        </Link>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">
          {ride.origin} → {ride.destination}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{new Date(ride.departureAt).toLocaleString()}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Driver</dt>
            <dd className="font-medium text-slate-800">{ride.driver?.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Seats available</dt>
            <dd className="font-medium text-slate-800">
              {ride.availableSeats} / {ride.totalSeats}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Price per seat</dt>
            <dd className="font-medium text-slate-800">${ride.pricePerSeat.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-800">{ride.status}</dd>
          </div>
        </dl>

        {ride.notes && <p className="mt-4 text-sm text-slate-600">{ride.notes}</p>}

        <div className="mt-6 border-t border-slate-100 pt-4">
          {isOwnRide && <p className="text-sm text-slate-500">This is your ride.</p>}
          {!isOwnRide && ride.status !== 'ACTIVE' && (
            <p className="text-sm text-slate-500">This ride is no longer open for booking.</p>
          )}
          {!isOwnRide && ride.status === 'ACTIVE' && ride.availableSeats === 0 && (
            <p className="text-sm text-slate-500">This ride is full.</p>
          )}

          {bookable && request.state !== 'success' && (
            <div className="flex items-end gap-3">
              <SeatSelector max={ride.availableSeats} value={seats} onChange={setSeats} />
              <button
                onClick={onRequest}
                disabled={request.state === 'submitting'}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {request.state === 'submitting' ? 'Requesting…' : 'Request seats'}
              </button>
            </div>
          )}

          {request.state === 'success' && (
            <p className="text-sm text-green-600">
              {request.message}{' '}
              <Link to="/bookings" className="font-medium underline">
                My bookings
              </Link>
            </p>
          )}
          {request.state === 'error' && <p className="mt-2 text-sm text-red-500">{request.message}</p>}
        </div>
      </div>
    </main>
  );
}
