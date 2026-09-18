import { useEffect, useState } from 'react';
import { ApiError, api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import type { Booking, BookingStatus } from '../api/types';

const STATUS_FILTERS: (BookingStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
];

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'COMPLETED',
};

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const query = filter === 'ALL' ? '' : `?status=${filter}`;
      const data = await api.get<Booking[]>(`/bookings${query}`);
      setBookings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function advanceStatus(booking: Booking) {
    const next = NEXT_STATUS[booking.status];
    if (!next) return;
    setActionError(null);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: next });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Update failed.');
    }
  }

  async function cancelBooking(booking: Booking) {
    setActionError(null);
    try {
      await api.patch(`/bookings/${booking.id}/cancel`);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Cancel failed.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>

      <div className="mt-4 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === s
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="mt-6 text-slate-500">No bookings found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Date / Time</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {booking.customerName}
                    </div>
                    <div className="text-slate-500">{booking.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3">{booking.service?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    {booking.bookingDate.slice(0, 10)} ·{' '}
                    {booking.bookingTime.slice(11, 16)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {NEXT_STATUS[booking.status] && (
                        <button
                          onClick={() => advanceStatus(booking)}
                          className="rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white hover:bg-slate-700"
                        >
                          Mark {NEXT_STATUS[booking.status]}
                        </button>
                      )}
                      {booking.status !== 'CANCELLED' && (
                        <button
                          onClick={() => cancelBooking(booking)}
                          className="rounded-md bg-red-50 px-2.5 py-1 text-xs text-red-700 hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
