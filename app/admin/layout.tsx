'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './_components/logout-button';

import { EventProvider, useEventContext } from './_context/event-context';
import { OrgProvider, useOrgContext } from './_context/org-context';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { org, isOrgAdmin } = useOrgContext();
  const { currentUser, currentRole, authUser } = useEventContext();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '⊞' },
    { href: '/admin#events', label: 'Events', icon: '✦' },
    { href: '/admin/settings', label: 'Einstellungen', icon: '⚙' },
  ];

  const orgManageItems = [
    { href: '/admin/organisation#mitglieder', label: 'Mitglieder', icon: '👥' },
    { href: '/admin#events', label: 'Events', icon: '🗓' },
    { href: '/admin/organisation#organisation', label: 'Organisationseinstellungen', icon: '✎' },
  ];

  const roleBadgeMap: Record<string, string> = {
    Admin:         'bg-emerald-100 text-emerald-800',
    Mitarbeiter:   'bg-blue-100 text-blue-800',
    Ansprechpartner: 'bg-amber-100 text-amber-800',
    Volunteer:     'bg-slate-100 text-slate-700',
  };
  const roleBadge = roleBadgeMap[currentRole ?? ''] ?? 'bg-slate-100 text-slate-700';
  const displayName = currentUser
    ? `${currentUser.vorname} ${currentUser.name}`.trim()
    : (authUser?.email ?? '');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-base font-semibold text-slate-900">
              {org?.name ?? 'Volunteer Planer'}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {currentRole ? (
              <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-flex ${roleBadge}`}>
                {currentRole}
              </span>
            ) : null}
            {displayName ? (
              <span className="hidden max-w-[160px] truncate text-sm text-slate-600 md:inline">
                {displayName}
              </span>
            ) : null}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Navigation
          </p>
          <nav className="grid gap-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href === '/admin#events' && pathname === '/admin');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    active ? 'bg-emerald-100 text-emerald-900 font-medium' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {(isOrgAdmin || currentRole === 'Admin') ? (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Organisation Verwalten
              </p>
              <nav className="grid gap-0.5">
                {orgManageItems.map((item) => {
                  const active = item.href.startsWith('/admin/organisation')
                    ? pathname === '/admin/organisation'
                    : pathname === '/admin';

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                        active ? 'bg-emerald-100 text-emerald-900 font-medium' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}

          {org ? (
            <div className="mt-4 border-t border-slate-100 pt-3 px-2">
              <p className="text-xs text-slate-400 mb-1">Organisation</p>
              <p className="text-sm font-medium text-slate-800 truncate">{org.name}</p>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                isOrgAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {isOrgAdmin ? 'Admin' : 'Benutzer'}
              </span>
            </div>
          ) : null}
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
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
