// Navbar: links for every signed-in user, Admin only for admins, the current
// section highlighted, and Log out calling the auth context's logout.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../src/context/AuthContext.jsx';
import Navbar from '../src/components/Navbar.jsx';

afterEach(cleanup);

// Renders the Navbar at `path` with a fake signed-in user (no server needed).
function renderNavbar({ role = 'USER', path = '/', logout = vi.fn() } = {}) {
  const auth = { user: { id: 'u1', name: 'Test User', role }, logout };
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Navbar />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { logout };
}

const link = (name) => screen.getByRole('link', { name });
const isHighlighted = (name) => link(name).className.includes('bg-slate-800');

describe('Navbar', () => {
  it('shows the main links for a signed-in user', () => {
    renderNavbar();
    for (const name of ['Carpool', 'Find a ride', 'Publish', 'My rides', 'My bookings', 'Profile']) {
      expect(link(name)).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
  });

  it('hides the Admin link from normal users', () => {
    renderNavbar({ role: 'USER' });
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });

  it('shows the Admin link to admins', () => {
    renderNavbar({ role: 'ADMIN' });
    expect(link('Admin')).toBeTruthy();
  });

  it('highlights the current section, including its sub-pages', () => {
    renderNavbar({ path: '/rides/abc/requests' });
    expect(isHighlighted('My rides')).toBe(true);
    expect(isHighlighted('My bookings')).toBe(false);
  });

  it('keeps Admin highlighted on admin sub-pages', () => {
    renderNavbar({ role: 'ADMIN', path: '/admin/users' });
    expect(isHighlighted('Admin')).toBe(true);
  });

  it('calls logout when Log out is clicked', () => {
    const { logout } = renderNavbar();
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
