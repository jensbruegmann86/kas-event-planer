'use client';

import { FormEvent, useState } from 'react';
import { createMyOrganisation } from '../actions/create-my-organisation';
import { useEventContext } from './_context/event-context';
import { useOrgContext } from './_context/org-context';

function DashboardContent() {
  const { activeEvent, loading, refreshEvents } = useEventContext();
  const { org, orgLoading, refreshOrg } = useOrgContext();
  const [orgName, setOrgName] = useState('');
  const [firstEventName, setFirstEventName] = useState('');
  const [firstEventDate, setFirstEventDate] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);
  const [createOrgSuccess, setCreateOrgSuccess] = useState<string | null>(null);

  async function onCreateOrganisation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateOrgError(null);
    setCreateOrgSuccess(null);

    const trimmedName = orgName.trim();
    if (!trimmedName) {
      setCreateOrgError('Bitte einen Organisationsnamen eingeben.');
      return;
    }

    const trimmedEventName = firstEventName.trim();
    if (!trimmedEventName || !firstEventDate) {
      setCreateOrgError('Bitte den Namen und das Datum für dein erstes Event eingeben.');
      return;
    }

    setCreatingOrg(true);
    const result = await createMyOrganisation({
      name: trimmedName,
      firstEventName: trimmedEventName,
      firstEventDate,
    });
    if ('error' in result) {
      setCreateOrgError(result.error);
      setCreatingOrg(false);
      return;
    }

    setCreateOrgSuccess('Organisation und erstes Event wurden erstellt. Du bist jetzt Organisations-Admin.');
    setOrgName('');
    setFirstEventName('');
    setFirstEventDate('');
    await refreshOrg();
    await refreshEvents();
    setCreatingOrg(false);
  }

  if (!orgLoading && !org) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Willkommen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Lege jetzt deine Organisation an und erfasse direkt das erste Event.
        </p>

        <form onSubmit={onCreateOrganisation} className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Name deiner Organisation"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Name des ersten Events"
            value={firstEventName}
            onChange={(e) => setFirstEventName(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            type="date"
            value={firstEventDate}
            onChange={(e) => setFirstEventDate(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={creatingOrg}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {creatingOrg ? 'Wird erstellt...' : 'Organisation erstellen'}
          </button>
        </form>

        {createOrgError ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {createOrgError}
          </p>
        ) : null}

        {createOrgSuccess ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
            {createOrgSuccess}
          </p>
        ) : null}

        <p className="mt-3 text-xs text-slate-500">
          Nach dem Speichern wirst du automatisch als Organisations-Admin eingetragen.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          {loading
            ? 'Lade...'
            : activeEvent
              ? `Aktives Event: ${activeEvent.name} (${new Date(activeEvent.datum).toLocaleDateString('de-DE')})`
              : 'Kein aktives Event gesetzt.'}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Willkommen im Dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">
            Links findest du die Navigation zu Volunteers, Organisation und den jeweiligen Unterseiten.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Aktiver Kontext</h2>
          <p className="mt-2 text-sm text-slate-600">
            {orgLoading
              ? 'Organisation wird geladen...'
              : org
                ? `Aktuell: ${org.name}`
                : 'Noch keine Organisation geladen.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function AdminPage() {
  return <DashboardContent />;
}
