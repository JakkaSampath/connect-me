// RideCard: the ride summary used by My rides and search results.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import RideCard from '../src/components/RideCard.jsx';

afterEach(cleanup);

const ride = {
  id: 'r1',
  origin: 'Hyderabad',
  destination: 'Vijayawada',
  departureAt: '2030-01-15T09:30:00.000Z',
  totalSeats: 4,
  availableSeats: 2,
  pricePerSeat: 12.5,
  status: 'ACTIVE',
  notes: null,
};

describe('RideCard', () => {
  it('shows the route, open seats, price and status', () => {
    render(<RideCard ride={ride} />);
    expect(screen.getByText('Hyderabad → Vijayawada')).toBeTruthy();
    expect(screen.getByText('2/4 seats open')).toBeTruthy();
    expect(screen.getByText('$12.50 / seat')).toBeTruthy();
    expect(screen.getByText('ACTIVE')).toBeTruthy();
  });

  it('shows notes only when the ride has them', () => {
    const { rerender } = render(<RideCard ride={ride} />);
    expect(screen.queryByText('Meet at the bus stand')).toBeNull();
    rerender(<RideCard ride={{ ...ride, notes: 'Meet at the bus stand' }} />);
    expect(screen.getByText('Meet at the bus stand')).toBeTruthy();
  });

  it('renders the action area only when actions are passed in', () => {
    const { rerender } = render(<RideCard ride={ride} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <RideCard ride={ride}>
        <button>Cancel ride</button>
      </RideCard>,
    );
    expect(screen.getByRole('button', { name: 'Cancel ride' })).toBeTruthy();
  });

  it('shows a derived COMPLETED status for a departed ride', () => {
    render(<RideCard ride={{ ...ride, status: 'COMPLETED' }} />);
    expect(screen.getByText('COMPLETED')).toBeTruthy();
  });
});
