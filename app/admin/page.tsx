'use client';

import { FormEvent, useState } from 'react';
import { createMyOrganisation } from '../actions/create-my-organisation';
import { EventSwitcher } from './_components/event-switcher';
import { StandortePanel } from './_components/standorte-panel';
import { VolunteersPanel } from './_components/volunteers-panel';
import { useEventContext } from './_context/event-context';
import { useOrgContext } from './_context/org-context';

function DashboardContent() {
  const { activeEvent, loading, currentRole } = useEventContext();
  const { isOrgAdmin, org, orgLoading, refreshOrg } = useOrgContext();
  const [tab, setTab] = useState<'standorte' | 'volunteers'>('standorte');
  const [orgName, setOrgName] = useState('');
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

    setCreatingOrg(true);
    const result = await createMyOrganisation({ name: trimmedName });
    if ('error' in result) {
      setCreateOrgError(result.error);
      setCreatingOrg(false);
      return;
    }

    setCreateOrgSuccess('Organisation wurde erstellt. Du bist jetzt Organisations-Admin.');
    setOrgName('');
    await refreshOrg();
    setCreatingOrg(false);
  }

  if (!orgLoading && !org) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Willkommen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Du bist noch keiner Organisation zugewiesen. Erstelle hier direkt deine Organisation und starte mit dem ersten Event.
        </p>

        <form onSubmit={onCreateOrganisation} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Name deiner Organisation"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
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
          Nach dem Erstellen wirst du automatisch als Organisations-Admin eingetragen.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            {loading
              ? 'Lade...'
              : activeEvent
                ? `Aktives Event: ${activeEvent.name} (${new Date(activeEvent.datum).toLocaleDateString('de-DE')})`
                : 'Bitte zuerst ein Event auswaehlen oder anlegen.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {currentRole}
            </span>
          ) : null}
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab('standorte')}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === 'standorte' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            }`}
          >
            Standorte
          </button>
          <button
            type="button"
            onClick={() => setTab('volunteers')}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === 'volunteers' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            }`}
          >
            Volunteers
          </button>
        </div>
        </div>
      </div>

      <EventSwitcher />

      <div className="mt-6">
        {!activeEvent ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600 ring-1 ring-slate-200">
            {isOrgAdmin
              ? 'Lege oben ein neues Event an oder waehle ein vorhandenes aus.'
              : 'Noch kein aktives Event. Bitte einen Admin bitten, ein Event anzulegen.'}
          </div>
        ) : tab === 'standorte' ? (
          <StandortePanel />
        ) : (
          <VolunteersPanel />
        )}
      </div>
    </section>
  );
}

export default function AdminPage() {
  return <DashboardContent />;
}
