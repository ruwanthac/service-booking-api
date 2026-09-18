import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Service Booking
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-slate-600 hover:text-slate-900">
            Book a Service
          </Link>
          {token ? (
            <>
              <Link to="/admin/bookings" className="text-slate-600 hover:text-slate-900">
                Bookings
              </Link>
              <Link to="/admin/services" className="text-slate-600 hover:text-slate-900">
                Services
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
            >
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
