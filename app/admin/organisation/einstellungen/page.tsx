'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useOrgContext } from '../../_context/org-context';

export default function OrganisationEinstellungenPage() {
  const { org, orgLoading, isOrgAdmin, updateOrgName } = useOrgContext();
  const [orgName, setOrgName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (org?.name) setOrgName(org.name);
  }, [org?.name]);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgName.trim()) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateOrgName(orgName.trim());
      setMessage('Organisationsname gespeichert.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern.');
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
        <p className="mt-2 text-sm text-slate-600">Nur Admins dürfen Organisationseinstellungen bearbeiten.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold text-slate-900">Organisationseinstellungen</h1>
      <p className="mt-1 text-sm text-slate-600">Hier kannst du den Organisationsnamen bearbeiten.</p>

      <form onSubmit={onSave} className="mt-4 flex gap-3">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Organisationsname"
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
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
  );
}
