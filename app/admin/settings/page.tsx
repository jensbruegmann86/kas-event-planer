'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

type SettingsForm = {
  vorname: string;
  name: string;
  mail: string;
  mobil: string;
  strasse: string;
  hausnummer: string;
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    vorname: '',
    name: '',
    mail: '',
    mobil: '',
    strasse: '',
    hausnummer: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Keine aktive Session gefunden. Bitte erneut anmelden.');
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('users')
        .select('vorname, name, mail, mobil, strasse, hausnummer')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (data) {
        setForm({
          vorname: data.vorname ?? '',
          name: data.name ?? '',
          mail: data.mail ?? user.email ?? '',
          mobil: data.mobil ?? '',
          strasse: data.strasse ?? '',
          hausnummer: data.hausnummer ?? '',
        });
      }

      setLoading(false);
    }

    void loadProfile();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Keine aktive Session gefunden. Bitte erneut anmelden.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        vorname: form.vorname.trim(),
        name: form.name.trim(),
        mail: form.mail.trim(),
        mobil: form.mobil.trim() || null,
        strasse: form.strasse.trim() || null,
        hausnummer: form.hausnummer.trim() || null,
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setMessage('Deine Benutzereinstellungen wurden gespeichert.');
    setSaving(false);
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Benutzereinstellungen</h1>
        <p className="mt-1 text-sm text-slate-600">Hier kannst du deine Stammdaten fuer das Dashboard pflegen.</p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Lade Daten...</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Vorname"
                value={form.vorname}
                onChange={(e) => setForm((prev) => ({ ...prev, vorname: e.target.value }))}
                required
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Nachname"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="email"
              placeholder="E-Mail"
              value={form.mail}
              onChange={(e) => setForm((prev) => ({ ...prev, mail: e.target.value }))}
              required
            />

            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Mobil"
                value={form.mobil}
                onChange={(e) => setForm((prev) => ({ ...prev, mobil: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Strasse"
                value={form.strasse}
                onChange={(e) => setForm((prev) => ({ ...prev, strasse: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Hausnummer"
                value={form.hausnummer}
                onChange={(e) => setForm((prev) => ({ ...prev, hausnummer: e.target.value }))}
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
