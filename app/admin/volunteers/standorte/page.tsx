'use client';

import { EventSwitcher } from '../../_components/event-switcher';
import { StandortePanel } from '../../_components/standorte-panel';

export default function StandortePage() {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Standorte</h1>
        <p className="text-sm text-slate-600">Verwalte die Standorte für das aktuell ausgewählte Event.</p>
      </div>
      <EventSwitcher />
      <div className="mt-6">
        <StandortePanel />
      </div>
    </section>
  );
}
