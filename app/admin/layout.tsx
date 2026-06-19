'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './_components/logout-button';
import { EventProvider, useEventContext } from './_context/event-context';
import { OrgProvider, useOrgContext } from './_context/org-context';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { org } = useOrgContext();
  const { events, activeEventId, setActiveEventId, currentUser, authUser } = useEventContext();
  const [volunteersOpen, setVolunteersOpen] = useState(pathname.startsWith('/admin/volunteers'));
  const [orgOpen, setOrgOpen] = useState(pathname.startsWith('/admin/organisation'));

  const activeEvent = useMemo(
    () => events.find((event) => event.id === activeEventId) ?? null,
    [events, activeEventId],
  );

  useEffect(() => {
    setVolunteersOpen(pathname.startsWith('/admin/volunteers'));
    setOrgOpen(pathname.startsWith('/admin/organisation'));
  }, [pathname]);

  const displayName = currentUser
    ? `${currentUser.vorname} ${currentUser.name}`.trim()
    : authUser?.email ?? '';

  const dashboardActive = pathname === '/admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 px-4 py-3 md:grid-cols-[auto_1fr_auto] md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold tracking-wide text-white">
              KEP
            </Link>
            {org ? (
              <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 md:inline-flex">
                {org.name}
              </span>
            ) : null}
          </div>

          <div className="flex w-full items-center justify-center">
            <label className="flex w-full max-w-xl flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Event auswählen
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                value={activeEventId ?? ''}
                onChange={(e) => setActiveEventId(e.target.value)}
                disabled={events.length === 0}
              >
                {events.length === 0 ? <option value="">Noch kein Event vorhanden</option> : null}
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.datum).toLocaleDateString('de-DE')}
                  </option>
                ))}
              </select>
              {activeEvent ? (
                <span className="text-[11px] font-normal normal-case tracking-normal text-slate-500">
                  Aktives Event: {activeEvent.name}
                </span>
              ) : null}
            </label>
          </div>

          <div className="flex items-center gap-2 justify-self-start md:justify-self-end">
            {displayName ? (
              <span className="hidden max-w-[160px] truncate text-sm text-slate-600 md:inline">
                {displayName}
              </span>
            ) : null}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Navigation</p>
          <nav className="grid gap-2">
            <Link
              href="/admin"
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                dashboardActive ? 'bg-emerald-100 text-emerald-900 font-medium' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-base leading-none">⊞</span>
              Dashboard
            </Link>

            <button
              type="button"
              onClick={() => setVolunteersOpen((prev) => !prev)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base leading-none">◫</span>
                Volunteers
              </span>
              <span className={`transition ${volunteersOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {volunteersOpen ? (
              <div className="grid gap-1 pl-4">
                <Link
                  href="/admin/volunteers/standorte"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    pathname === '/admin/volunteers/standorte'
                      ? 'bg-emerald-100 text-emerald-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Standorte
                </Link>
                <Link
                  href="/admin/volunteers/statistik"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    pathname === '/admin/volunteers/statistik'
                      ? 'bg-emerald-100 text-emerald-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Statistik
                </Link>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setOrgOpen((prev) => !prev)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base leading-none">◈</span>
                Organisation
              </span>
              <span className={`transition ${orgOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {orgOpen ? (
              <div className="grid gap-1 pl-4">
                <Link
                  href="/admin/organisation#organisation"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    pathname === '/admin/organisation'
                      ? 'bg-emerald-100 text-emerald-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Einstellungen
                </Link>
                <Link
                  href="/admin/organisation#mitglieder"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    pathname === '/admin/organisation'
                      ? 'bg-emerald-100 text-emerald-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Mitglieder
                </Link>
                <Link
                  href="/admin/organisation#events"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    pathname === '/admin/organisation'
                      ? 'bg-emerald-100 text-emerald-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Events
                </Link>
              </div>
            ) : null}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 text-sm text-slate-500 md:px-6">
          <span>KAS-Event-Planer</span>
          <Link href="/impressum" className="text-slate-700 hover:text-slate-900">
            Impressum
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventProvider>
      <OrgProvider>
        <AdminShell>{children}</AdminShell>
      </OrgProvider>
    </EventProvider>
  );
}
