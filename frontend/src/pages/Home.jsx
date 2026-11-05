import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// Signed-in landing page: a greeting and shortcuts to the main sections.
export default function Home() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-slate-800">Welcome, {user?.name}</h1>
      <p className="mt-1 text-sm text-slate-500">You are signed in as {user?.email}.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/search"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
        >
          <p className="font-medium text-slate-800">Find a ride</p>
          <p className="mt-1 text-sm text-slate-500">Search trips by pickup, destination, and date.</p>
        </Link>
        <Link
          to="/publish"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
        >
          <p className="font-medium text-slate-800">Publish a ride</p>
          <p className="mt-1 text-sm text-slate-500">Offer seats on a trip you are driving.</p>
        </Link>
        <Link
          to="/rides"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
        >
          <p className="font-medium text-slate-800">My rides</p>
          <p className="mt-1 text-sm text-slate-500">View requests and manage rides you offer.</p>
        </Link>
        <Link
          to="/bookings"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
        >
          <p className="font-medium text-slate-800">My bookings</p>
          <p className="mt-1 text-sm text-slate-500">Track seats you have requested.</p>
        </Link>
      </div>
    </main>
  );
}
