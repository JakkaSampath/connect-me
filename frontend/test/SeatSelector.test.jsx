// SeatSelector: offers 1..max seats and reports the choice as a number.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SeatSelector from '../src/components/SeatSelector.jsx';

afterEach(cleanup);

describe('SeatSelector', () => {
  it('offers one option per available seat (1..max)', () => {
    render(<SeatSelector max={3} value={1} onChange={() => {}} />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['1', '2', '3']);
  });

  it('is labelled "Seats" so it is reachable by its label', () => {
    render(<SeatSelector max={2} value={1} onChange={() => {}} />);
    expect(screen.getByLabelText('Seats').tagName).toBe('SELECT');
  });

  it('calls onChange with a number, not a string', () => {
    const onChange = vi.fn();
    render(<SeatSelector max={4} value={1} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Seats'), { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('shows the current value as selected', () => {
    render(<SeatSelector max={4} value={2} onChange={() => {}} />);
    expect(screen.getByLabelText('Seats').value).toBe('2');
  });
});
