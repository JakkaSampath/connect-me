import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import PublishRide from './pages/PublishRide.jsx';
import MyRides from './pages/MyRides.jsx';
import SearchRides from './pages/SearchRides.jsx';
import RideDetails from './pages/RideDetails.jsx';
import MyBookings from './pages/MyBookings.jsx';
import RideRequests from './pages/RideRequests.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminRides from './pages/admin/AdminRides.jsx';

// Shell for every signed-in page: the Navbar on top, the page below.
function SignedInLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Outlet />
    </div>
  );
}

export default function App() {
  // basename makes client-side routes resolve under the proxy subpath in dev
  // (import.meta.env.BASE_URL === "/5175/") and at root in production ("/").
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <SignedInLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/publish" element={<PublishRide />} />
            <Route path="/rides" element={<MyRides />} />
            <Route path="/search" element={<SearchRides />} />
            <Route path="/rides/:id" element={<RideDetails />} />
            <Route path="/rides/:id/requests" element={<RideRequests />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/rides"
              element={
                <AdminRoute>
                  <AdminRides />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
