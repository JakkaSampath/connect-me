// Booking flow on the Ride details page: load the ride, pick seats, request them.
// The api/ layer is mocked, so the real page, hooks and SeatSelector run without a server.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../src/context/AuthContext.jsx';
import RideDetails from '../src/pages/RideDetails.jsx';
import { getRide } from '../src/api/rides.api.js';
import { requestBooking } from '../src/api/bookings.api.js';

vi.mock('../src/api/rides.api.js', () => ({ getRide: vi.fn() }));
vi.mock('../src/api/bookings.api.js', () => ({ requestBooking: vi.fn() }));

const ride = {
  id: 'r1',
  origin: 'Hyderabad',
  destination: 'Vijayawada',
  departureAt: '2030-01-15T09:30:00.000Z',
  totalSeats: 4,
  availableSeats: 3,
  pricePerSeat: 12.5,
  status: 'ACTIVE',
  notes: null,
  driver: { id: 'driver-1', name: 'Dana Driver' },
};

// Opens /rides/r1 as the given user (a passenger by default).
function openRide(userId = 'passenger-1') {
  render(
    <AuthContext.Provider value={{ user: { id: userId, name: 'Pat', role: 'USER' } }}>
      <MemoryRouter initialEntries={['/rides/r1']}>
        <Routes>
          <Route path="/rides/:id" element={<RideDetails />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.mocked(getRide).mockResolvedValue({ ride });
  vi.mocked(requestBooking).mockResolvedValue({ booking: { id: 'b1', status: 'PENDING' } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Booking flow (Ride details)', () => {
  it('requests the chosen number of seats and confirms it', async () => {
    openRide();
    await screen.findByText('Hyderabad → Vijayawada');
    expect(getRide).toHaveBeenCalledWith('r1');

    // Only the seats still available can be chosen.
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['1', '2', '3']);

    fireEvent.change(screen.getByLabelText('Seats'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request seats' }));

    await screen.findByText(/Request sent!/);
    expect(requestBooking).toHaveBeenCalledWith({ rideId: 'r1', seatsBooked: 2 });
    expect(screen.queryByRole('button', { name: 'Request seats' })).toBeNull();
  });

  it('shows the server error and lets the user try again', async () => {
    vi.mocked(requestBooking).mockRejectedValueOnce(new Error('Not enough seats available'));
    openRide();
    await screen.findByText('Hyderabad → Vijayawada');

    fireEvent.click(screen.getByRole('button', { name: 'Request seats' }));

    await screen.findByText('Not enough seats available');
    expect(screen.getByRole('button', { name: 'Request seats' }).disabled).toBe(false);
  });

  it('does not offer booking on your own ride', async () => {
    openRide('driver-1');
    await screen.findByText('This is your ride.');
    expect(screen.queryByLabelText('Seats')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Request seats' })).toBeNull();
  });

  it('says when the ride is full', async () => {
    vi.mocked(getRide).mockResolvedValue({ ride: { ...ride, availableSeats: 0 } });
    openRide();
    await screen.findByText('This ride is full.');
    expect(screen.queryByRole('button', { name: 'Request seats' })).toBeNull();
  });

  it('says when the ride is no longer open (e.g. departed or cancelled)', async () => {
    vi.mocked(getRide).mockResolvedValue({ ride: { ...ride, status: 'COMPLETED' } });
    openRide();
    await screen.findByText('This ride is no longer open for booking.');
    expect(screen.queryByRole('button', { name: 'Request seats' })).toBeNull();
  });
});
