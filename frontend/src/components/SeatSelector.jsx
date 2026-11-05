// Seat-count picker for a booking request: offers 1..max (max = seats still
// available on the ride). Calls onChange with a number. Same look as the
// dropdown it replaces on the ride details page.
export default function SeatSelector({ id = 'seats', label = 'Seats', max, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-500"
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
