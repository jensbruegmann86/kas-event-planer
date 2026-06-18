'use client';

import { FormEvent, useState } from 'react';
import { useEventContext } from '../_context/event-context';
import { useOrgContext } from '../_context/org-context';

export function EventSwitcher() {
  const {
    events,
    activeEventId,
    setActiveEventId,
    createEvent,
    loading,
  } = useEventContext();
  const { org, isOrgAdmin } = useOrgContext();

  const [name, setName] = useState('');
  const [datum, setDatum] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !datum) {
      setError('Bitte Name und Datum angeben.');
      return;
    }

    setSaving(true);
    try {
      await createEvent({ name: name.trim(), datum, org_id: org?.id ?? null });
      setName('');
      setDatum('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Event konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="events" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Aktives Event</h2>
          <p className="text-sm text-slate-600">
            Alle Unterfunktionen arbeiten im Kontext des gewaehlten Events.
          </p>
        </div>
        <select
          className="min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={activeEventId ?? ''}
          onChange={(e) => setActiveEventId(e.target.value)}
          disabled={loading || events.length === 0}
        >
          {events.length === 0 ? <option value="">Noch kein Event vorhanden</option> : null}
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} - {new Date(event.datum).toLocaleDateString('de-DE')}
            </option>
          ))}
        </select>
      </div>

      {isOrgAdmin ? (
        <form onSubmit={onCreateEvent} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Neues Event (Name)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Event anlegen'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Nur Admins koennen Events anlegen.</p>
      )}

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
