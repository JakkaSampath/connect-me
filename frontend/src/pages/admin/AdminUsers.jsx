import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteUser, listUsers, setUserActive } from '../../api/admin.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    listUsers()
      .then(({ items }) => setUsers(items))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const toggle = async (id, active) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await setUserActive(id, active);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const onConfirmDelete = async () => {
    const target = confirmDelete;
    setBusyId(target.id);
    setError(null);
    setNotice(null);
    try {
      const { cancelledRides, cancelledBookings } = await deleteUser(target.id);
      setNotice(
        `Deleted ${target.name}. Cancelled ${cancelledRides} upcoming ride(s) and ${cancelledBookings} booking(s).`,
      );
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  // Deleted accounts are final, admins can't be deleted, and nobody acts on themselves.
  const renderActions = (u) => {
    if (u.deletedAt) return null;
    if (u.id === me?.id) return <span className="text-xs text-slate-400">you</span>;

    return (
      <div className="flex shrink-0 gap-2">
        {u.isActive ? (
          <button
            onClick={() => toggle(u.id, false)}
            disabled={busyId === u.id}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={() => toggle(u.id, true)}
            disabled={busyId === u.id}
            className="rounded-lg border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            Reactivate
          </button>
        )}
        {u.role !== 'ADMIN' && (
          <button
            onClick={() => setConfirmDelete(u)}
            disabled={busyId === u.id}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-slate-800">Admin · Users</span>
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-sm font-medium text-slate-600 hover:underline">
            Dashboard
          </Link>
          <Link to="/admin/rides" className="text-sm font-medium text-slate-600 hover:underline">
            Rides
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 p-6">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {notice && <p className="text-sm text-green-600">{notice}</p>}
        {users === null && !error && <p className="text-sm text-slate-500">Loading…</p>}

        {users?.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">
                {u.name}
                {u.role === 'ADMIN' && (
                  <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    admin
                  </span>
                )}
                {u.deletedAt ? (
                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                    deleted
                  </span>
                ) : (
                  !u.isActive && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      deactivated
                    </span>
                  )
                )}
              </p>
              <p className="truncate text-sm text-slate-500">
                {u.deletedAt ? `Deleted ${new Date(u.deletedAt).toLocaleString()}` : u.email}
              </p>
            </div>

            {renderActions(u)}
          </div>
        ))}

        {users && users.length === 0 && <p className="text-sm text-slate-500">No users.</p>}
      </main>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.name ?? 'this user'}?`}
        message="Their upcoming rides and bookings will be cancelled and their personal details erased. They can never log in again. This cannot be undone."
        confirmLabel="Delete user"
        cancelLabel="Keep user"
        busy={busyId === confirmDelete?.id}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
