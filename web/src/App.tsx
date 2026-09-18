import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AdminBookingsPage } from './pages/AdminBookingsPage';
import { AdminServicesPage } from './pages/AdminServicesPage';
import { BookingPage } from './pages/BookingPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute>
                  <AdminBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute>
                  <AdminServicesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
