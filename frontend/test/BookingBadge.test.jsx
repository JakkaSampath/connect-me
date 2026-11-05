// BookingBadge: shows the booking status with a colour per status, including
// the derived COMPLETED / EXPIRED statuses the backend computes for departed rides.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import BookingBadge from '../src/components/BookingBadge.jsx';

afterEach(cleanup);

describe('BookingBadge', () => {
  it.each([
    ['PENDING', 'bg-amber-100'],
    ['ACCEPTED', 'bg-green-100'],
    ['REJECTED', 'bg-red-100'],
    ['CANCELLED', 'bg-slate-100'],
    ['COMPLETED', 'bg-blue-100'],
    ['EXPIRED', 'bg-slate-200'],
  ])('shows %s with its colour', (status, colourClass) => {
    render(<BookingBadge status={status} />);
    const badge = screen.getByText(status);
    expect(badge.className).toContain(colourClass);
  });

  it('still shows an unknown status as text, without a colour', () => {
    render(<BookingBadge status="SOMETHING_NEW" />);
    const badge = screen.getByText('SOMETHING_NEW');
    expect(badge.className).not.toMatch(/bg-(amber|green|red|slate|blue)-/);
  });
});
