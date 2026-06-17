'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EventSwitcher } from './_components/event-switcher';
import { LogoutButton } from './_components/logout-button';
import { StandortePanel } from './_components/standorte-panel';
import { VolunteersPanel } from './_components/volunteers-panel';
import { EventProvider, useEventContext } from './_context/event-context';

function DashboardContent() {
  const { activeEvent, loading, authUser, currentRole, currentUser } = useEventContext();
  const [tab, setTab] = useState<'standorte' | 'volunteers'>('standorte');

  const roleBadgeColor = useMemo(() => {
    switch (currentRole) {
      case 'Admin':
        return 'bg-emerald-100 text-emerald-800';
      case 'Mitarbeiter':
        return 'bg-blue-100 text-blue-800';
      case 'Ansprechpartner':
        return 'bg-amber-100 text-amber-800';
      case 'Volunteer':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-rose-100 text-rose-700';
    }
  }, [currentRole]);

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Volunteer Planer Dashboard</h1>
          <p className="text-sm text-slate-600">Event-zentrierte Verwaltung fuer Standorte, Gruppen und Einzelhelfer.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleBadgeColor}`}>
            Rolle: {currentRole ?? 'Nicht zugewiesen'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            {currentUser
              ? `${currentUser.vorname} ${currentUser.name}`
              : authUser
                ? authUser.email ?? 'Eingeloggt'
                : 'Nicht angemeldet'}
          </span>
          {authUser ? (
            <Link
              href="/admin/settings"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Benutzereinstellungen
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </header>

      <EventSwitcher />

      <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Dashboard Uebersicht</h2>
            <p className="text-sm text-slate-600">
              {loading
                ? 'Lade Event-Kontext...'
                : activeEvent
                  ? `Aktives Event: ${activeEvent.name} (${new Date(activeEvent.datum).toLocaleDateString('de-DE')})`
                  : 'Bitte zuerst ein Event auswaehlen oder anlegen.'}
            </p>
          </div>

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

        {!activeEvent ? (
          <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600 ring-1 ring-slate-200">
            Ohne aktives Event bleiben Standorte und Volunteers deaktiviert.
          </div>
        ) : tab === 'standorte' ? (
          <StandortePanel />
        ) : (
          <VolunteersPanel />
        )}
      </section>
    </main>
  );
}

export default function AdminPage() {
  return (
    <EventProvider>
      <DashboardContent />
    </EventProvider>
  );
}
