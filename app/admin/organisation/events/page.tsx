'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useEventContext } from '../../_context/event-context';
import { useOrgContext } from '../../_context/org-context';

export default function OrganisationEventsPage() {
  const { org, orgLoading, isOrgAdmin } = useOrgContext();
  const { events, activeEventId, createEvent } = useEventContext();

  const [name, setName] = useState('');
  const [datum, setDatum] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()),
    [events],
  );

  async function onCreateEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!org) return;

    if (!name.trim() || !datum) {
      setError('Bitte Name und Datum angeben.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await createEvent({ name: name.trim(), datum, org_id: org.id });
      setName('');
      setDatum('');
      setMessage('Event wurde angelegt.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Event konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  }

  if (orgLoading) {
    return <p className="text-sm text-slate-500">Lade Organisation...</p>;
  }

  if (!org) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Keine Organisation</h1>
        <p className="mt-2 text-sm text-slate-600">Es konnte keine Organisation geladen werden.</p>
      </section>
    );
  }

  if (!isOrgAdmin) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Keine Berechtigung</h1>
        <p className="mt-2 text-sm text-slate-600">Nur Admins dürfen Events für die Organisation anlegen.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Events</h1>
        <p className="mt-1 text-sm text-slate-600">Lege neue Events an und verwalte die Event-Liste deiner Organisation.</p>

        <form onSubmit={onCreateEvent} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Neues Event (Name)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Event anlegen'}
          </button>
        </form>

        {message ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Angelegte Events</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Datum</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-slate-500">
                    Noch keine Events vorhanden.
                  </td>
                </tr>
              ) : (
                sortedEvents.map((event) => (
                  <tr key={event.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">{event.name}</td>
                    <td className="px-2 py-2 text-slate-600">{new Date(event.datum).toLocaleDateString('de-DE')}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          event.id === activeEventId ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {event.id === activeEventId ? 'Aktiv' : 'Verfügbar'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
