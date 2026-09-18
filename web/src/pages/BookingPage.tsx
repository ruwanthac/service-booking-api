import { useEffect, useState } from 'react';
import { ApiError, api } from '../api/client';
import type { CreateBookingInput, Service } from '../api/types';

type Step = 'choose-service' | 'details' | 'confirmed';

export function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [step, setStep] = useState<Step>('choose-service');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingDate: '',
    bookingTime: '',
    notes: '',
  });

  useEffect(() => {
    api
      .get<Service[]>('/services/public')
      .then(setServices)
      .catch(() => setLoadError('Could not load services. Is the API running?'));
  }, []);

  function chooseService(service: Service) {
    setSelected(service);
    setStep('details');
    setSubmitError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);

    const input: CreateBookingInput = {
      ...form,
      serviceId: selected.id,
      notes: form.notes || undefined,
    };

    try {
      await api.post('/bookings', input);
      setStep('confirmed');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'confirmed') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="text-2xl font-semibold text-slate-900">Booking requested!</h1>
        <p className="mt-2 text-slate-600">
          We've received your booking for <strong>{selected?.title}</strong>. It's
          currently <strong>pending confirmation</strong> from the business.
        </p>
        <button
          onClick={() => {
            setStep('choose-service');
            setSelected(null);
            setForm({
              customerName: '',
              customerEmail: '',
              customerPhone: '',
              bookingDate: '',
              bookingTime: '',
              notes: '',
            });
          }}
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Book another
        </button>
      </div>
    );
  }

  if (step === 'details' && selected) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <button
          onClick={() => setStep('choose-service')}
          className="mb-4 text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back to services
        </button>
        <h1 className="text-xl font-semibold text-slate-900">{selected.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {selected.duration} min · ${selected.price}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field
            label="Your name"
            value={form.customerName}
            onChange={(v) => setForm({ ...form, customerName: v })}
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.customerEmail}
            onChange={(v) => setForm({ ...form, customerEmail: v })}
            required
          />
          <Field
            label="Phone"
            value={form.customerPhone}
            onChange={(v) => setForm({ ...form, customerPhone: v })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Date"
              type="date"
              value={form.bookingDate}
              onChange={(v) => setForm({ ...form, bookingDate: v })}
              required
            />
            <Field
              label="Time"
              type="time"
              value={form.bookingTime}
              onChange={(v) => setForm({ ...form, bookingTime: v })}
              required
            />
          </div>
          <Field
            label="Notes (optional)"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />

          {submitError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Book a service</h1>
      <p className="mt-1 text-slate-600">Choose a service to get started.</p>

      {loadError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {!loadError && services.length === 0 && (
        <p className="mt-6 text-slate-500">No services are available yet.</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => chooseService(service)}
            className="rounded-lg border border-slate-200 p-4 text-left hover:border-slate-400 hover:shadow-sm"
          >
            <h2 className="font-medium text-slate-900">{service.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {service.description}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {service.duration} min · ${service.price}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </label>
  );
}
