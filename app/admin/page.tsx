'use client';

import { useState } from 'react';
import { EventSwitcher } from './_components/event-switcher';
import { StandortePanel } from './_components/standorte-panel';
import { VolunteersPanel } from './_components/volunteers-panel';
import { EventProvider, useEventContext } from './_context/event-context';

function DashboardContent() {
  const { activeEvent, loading, currentRole } = useEventContext();
  const [tab, setTab] = useState<'standorte' | 'volunteers'>('standorte');

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard Uebersicht</h1>
          <p className="text-sm text-slate-600">
            {loading
              ? 'Lade Event-Kontext...'
              : activeEvent
                ? `Aktives Event: ${activeEvent.name} (${new Date(activeEvent.datum).toLocaleDateString('de-DE')})`
                : 'Bitte zuerst ein Event auswaehlen oder anlegen.'}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Rolle: {currentRole ?? 'Nicht zugewiesen'}
        </span>

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

      <EventSwitcher />

      <div className="mt-6">
        {!activeEvent ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600 ring-1 ring-slate-200">
            Ohne aktives Event bleiben Standorte und Volunteers deaktiviert.
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
  return (
    <EventProvider>
      <DashboardContent />
    </EventProvider>
  );
}
