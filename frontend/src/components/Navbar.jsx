import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// App-wide navigation for signed-in pages (rendered once by the layout in App.jsx).
// The current section is highlighted; links wrap onto a second line on small screens.
const LINKS = [
  { to: '/search', label: 'Find a ride' },
  { to: '/publish', label: 'Publish' },
  { to: '/rides', label: 'My rides' },
  { to: '/bookings', label: 'My bookings' },
];

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/" className="text-lg font-semibold text-slate-800">
        Carpool
      </Link>

      <div className="flex flex-wrap items-center gap-1">
        {LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} className={linkClass}>
            {label}
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className={linkClass}>
            Admin
          </NavLink>
        )}
        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
