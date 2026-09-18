import { useEffect, useState } from 'react';
import { ApiError, api } from '../api/client';
import type { CreateServiceInput, Service } from '../api/types';

const emptyForm: CreateServiceInput = {
  title: '',
  description: '',
  duration: 30,
  price: 0,
};

export function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateServiceInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Service[]>('/services');
      setServices(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/services', form);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create service.');
    }
  }

  async function toggleActive(service: Service) {
    try {
      await api.patch(`/services/${service.id}`, { isActive: !service.isActive });
      await load();
    } catch {
      setError('Failed to update service.');
    }
  }

  async function remove(service: Service) {
    try {
      await api.delete(`/services/${service.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete service.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Services</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          {showForm ? 'Close' : 'New service'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 space-y-3 rounded-lg border border-slate-200 p-4"
        >
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <input
              required
              type="number"
              min={1}
              placeholder="Duration (min)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              min={0}
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {formError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            Create
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-slate-900">{service.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      service.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{service.description}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {service.duration} min · ${service.price}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(service)}
                  className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200"
                >
                  {service.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => remove(service)}
                  className="rounded-md bg-red-50 px-2.5 py-1 text-xs text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
