'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

type SettingsForm = {
  vorname: string;
  name: string;
  mail: string;
  mobil: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  kleidergroesse_tshirt: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  kleidergroesse_jacke: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  schuhgroesse: number;
};

const sizeOptions: SettingsForm['kleidergroesse_tshirt'][] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    vorname: '',
    name: '',
    mail: '',
    mobil: '',
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    kleidergroesse_tshirt: 'M',
    kleidergroesse_jacke: 'M',
    schuhgroesse: 42,
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
        .select(
          'vorname, name, mail, mobil, strasse, hausnummer, plz, ort, kleidergroesse_tshirt, kleidergroesse_jacke, schuhgroesse',
        )
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setForm({
        vorname: data?.vorname ?? '',
        name: data?.name ?? '',
        mail: data?.mail ?? user.email ?? '',
        mobil: data?.mobil ?? '',
        strasse: data?.strasse ?? '',
        hausnummer: data?.hausnummer ?? '',
        plz: data?.plz ?? '',
        ort: data?.ort ?? '',
        kleidergroesse_tshirt: (data?.kleidergroesse_tshirt as SettingsForm['kleidergroesse_tshirt']) ?? 'M',
        kleidergroesse_jacke: (data?.kleidergroesse_jacke as SettingsForm['kleidergroesse_jacke']) ?? 'M',
        schuhgroesse: data?.schuhgroesse ?? 42,
      });

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
        plz: form.plz.trim() || null,
        ort: form.ort.trim() || null,
        kleidergroesse_tshirt: form.kleidergroesse_tshirt,
        kleidergroesse_jacke: form.kleidergroesse_jacke,
        schuhgroesse: form.schuhgroesse,
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
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Benutzereinstellungen</h1>
          <p className="mt-1 text-sm text-slate-600">Hier kannst du deine Stammdaten fuer das Dashboard pflegen.</p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          Zurueck zum Dashboard
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Lade Daten...</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
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

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="PLZ"
              value={form.plz}
              onChange={(e) => setForm((prev) => ({ ...prev, plz: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ort"
              value={form.ort}
              onChange={(e) => setForm((prev) => ({ ...prev, ort: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.kleidergroesse_tshirt}
              onChange={(e) => setForm((prev) => ({ ...prev, kleidergroesse_tshirt: e.target.value as SettingsForm['kleidergroesse_tshirt'] }))}
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  T-Shirt: {size}
                </option>
              ))}
            </select>

            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.kleidergroesse_jacke}
              onChange={(e) => setForm((prev) => ({ ...prev, kleidergroesse_jacke: e.target.value as SettingsForm['kleidergroesse_jacke'] }))}
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  Jacke: {size}
                </option>
              ))}
            </select>

            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type="number"
              min={36}
              max={48}
              placeholder="Schuhgroesse"
              value={form.schuhgroesse}
              onChange={(e) => setForm((prev) => ({ ...prev, schuhgroesse: Number(e.target.value) }))}
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
  );
}
