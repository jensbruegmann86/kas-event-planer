'use client';

import { useState } from 'react';
import { EventSwitcher } from './_components/event-switcher';
import { StandortePanel } from './_components/standorte-panel';
import { VolunteersPanel } from './_components/volunteers-panel';
import { useEventContext } from './_context/event-context';
import { useOrgContext } from './_context/org-context';

function DashboardContent() {
  const { activeEvent, loading, currentRole } = useEventContext();
  const { isOrgAdmin, org, orgLoading } = useOrgContext();
  const [tab, setTab] = useState<'standorte' | 'volunteers'>('standorte');

  if (!orgLoading && !org) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Willkommen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Du bist noch keiner Organisation zugewiesen. Bitte wende dich an einen Administrator.
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
