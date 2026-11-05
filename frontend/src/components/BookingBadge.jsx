// Reusable booking-status pill.
const STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-blue-100 text-blue-700', // same blue as a COMPLETED ride on the admin list
  EXPIRED: 'bg-slate-200 text-slate-500', // muted: the request was never answered
};

export default function BookingBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? ''}`}>
      {status}
    </span>
  );
}
