'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useEventContext } from '../_context/event-context';
import { canManageStandorte } from '../_lib/permissions';
import { supabaseBrowser } from '../_lib/supabase-browser';
import type { GruppeRow, StandortRow, UserRow } from '../_lib/types';
import { MapPicker } from './map-picker';

type StandortForm = {
  id?: string;
  name: string;
  typ: string;
  latitude: number;
  longitude: number;
  pdf_anhang_url: string;
  bedarf_volunteers: number;
  gruppe_id: string;
  user_id: string;
};

const initialForm: StandortForm = {
  name: '',
  typ: 'Start',
  latitude: 52.52,
  longitude: 13.405,
  pdf_anhang_url: '',
  bedarf_volunteers: 1,
  gruppe_id: '',
  user_id: '',
};

export function StandortePanel() {
  const { activeEventId, currentRole } = useEventContext();
  const [standorte, setStandorte] = useState<StandortRow[]>([]);
  const [groups, setGroups] = useState<GruppeRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState<StandortForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowWrite = canManageStandorte(currentRole);

  const mappedUsers = useMemo(
    () => users.map((user) => ({ ...user, fullName: `${user.vorname} ${user.name}` })),
    [users],
  );

  async function loadData() {
    if (!activeEventId) return;
    setLoading(true);
    setError(null);

    try {
      const [{ data: standorteData, error: standorteError }, { data: groupsData }, { data: usersData }] =
        await Promise.all([
          supabaseBrowser
            .from('standorte')
            .select('*')
            .eq('event_id', activeEventId)
            .order('name', { ascending: true }),
          supabaseBrowser.from('gruppen').select('*').eq('event_id', activeEventId),
          supabaseBrowser.from('users').select('*').order('name', { ascending: true }),
        ]);

      if (standorteError) throw standorteError;

      setStandorte((standorteData ?? []) as StandortRow[]);
      setGroups((groupsData ?? []) as GruppeRow[]);
      setUsers((usersData ?? []) as UserRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Standorte konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [activeEventId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeEventId || !allowWrite) return;

    setError(null);

    try {
      const payload = {
        event_id: activeEventId,
        name: form.name.trim(),
        typ: form.typ.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        pdf_anhang_url: form.pdf_anhang_url.trim() || null,
        bedarf_volunteers: form.bedarf_volunteers,
      };

      let standortId = form.id;

      if (form.id) {
        const { error: updateError } = await supabaseBrowser
          .from('standorte')
          .update(payload)
          .eq('id', form.id);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabaseBrowser
          .from('standorte')
          .insert(payload)
          .select('id')
          .single();
        if (insertError) throw insertError;
        standortId = data.id;
      }

      if (standortId) {
        await supabaseBrowser.from('standort_zuweisungen').delete().eq('standort_id', standortId);

        if (form.gruppe_id || form.user_id) {
          const { error: assignError } = await supabaseBrowser.from('standort_zuweisungen').insert({
            standort_id: standortId,
            gruppe_id: form.gruppe_id || null,
            user_id: form.user_id || null,
          });

          if (assignError) throw assignError;
        }
      }

      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    }
  }

  async function onDelete(id: string) {
    if (!allowWrite) return;
    const confirmed = window.confirm('Standort wirklich loeschen?');
    if (!confirmed) return;

    const { error: deleteError } = await supabaseBrowser.from('standorte').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadData();
  }

  function onEdit(item: StandortRow) {
    setForm({
      id: item.id,
      name: item.name,
      typ: item.typ,
      latitude: item.latitude,
      longitude: item.longitude,
      pdf_anhang_url: item.pdf_anhang_url ?? '',
      bedarf_volunteers: item.bedarf_volunteers,
      gruppe_id: '',
      user_id: '',
    });
  }

  if (!allowWrite) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Standorte</h3>
        <p className="mt-2 text-sm text-slate-600">Nur Admin und Mitarbeiter duerfen Standorte verwalten.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-lg font-semibold text-slate-900">Standorte (CRUD)</h3>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Typ (Start, Ziel, Verpflegung...)"
            value={form.typ}
            onChange={(e) => setForm((prev) => ({ ...prev, typ: e.target.value }))}
            required
          />
        </div>

        <MapPicker
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={({ lat, lng }) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
        />

        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            placeholder="Latitude"
            value={form.latitude}
            onChange={(e) => setForm((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            placeholder="Longitude"
            value={form.longitude}
            onChange={(e) => setForm((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="number"
            min={0}
            placeholder="Bedarf Volunteers"
            value={form.bedarf_volunteers}
            onChange={(e) => setForm((prev) => ({ ...prev, bedarf_volunteers: Number(e.target.value) }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="PDF Anhang URL"
            value={form.pdf_anhang_url}
            onChange={(e) => setForm((prev) => ({ ...prev, pdf_anhang_url: e.target.value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.gruppe_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, gruppe_id: e.target.value, user_id: e.target.value ? '' : prev.user_id }))
            }
          >
            <option value="">Keine Gruppen-Zuweisung</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.gruppenname}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.user_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, user_id: e.target.value, gruppe_id: e.target.value ? '' : prev.gruppe_id }))
            }
          >
            <option value="">Keine Einzelhelfer-Zuweisung</option>
            {mappedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800" type="submit">
            {form.id ? 'Standort aktualisieren' : 'Standort anlegen'}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Bearbeitung abbrechen
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Typ</th>
              <th className="px-2 py-2">Koordinaten</th>
              <th className="px-2 py-2">Bedarf</th>
              <th className="px-2 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-slate-500">
                  Lade Standorte...
                </td>
              </tr>
            ) : standorte.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-slate-500">
                  Noch keine Standorte vorhanden.
                </td>
              </tr>
            ) : (
              standorte.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">{item.name}</td>
                  <td className="px-2 py-2">{item.typ}</td>
                  <td className="px-2 py-2">{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</td>
                  <td className="px-2 py-2">{item.bedarf_volunteers}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-2 py-1"
                        onClick={() => onEdit(item)}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-rose-200 px-2 py-1 text-rose-700"
                        onClick={() => onDelete(item.id)}
                      >
                        Loeschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
