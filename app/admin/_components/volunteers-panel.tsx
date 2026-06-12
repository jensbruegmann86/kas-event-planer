'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useEventContext } from '../_context/event-context';
import { canManageGruppen, canManageMitglieder } from '../_lib/permissions';
import { supabaseBrowser } from '../_lib/supabase-browser';
import type { GruppeRow, GruppenMitgliedRow, UserRow } from '../_lib/types';

type PersonForm = {
  id?: string;
  vorname: string;
  name: string;
  strasse: string;
  hausnummer: string;
  mobil: string;
  mail: string;
  kleidergroesse_tshirt: string;
  kleidergroesse_jacke: string;
  schuhgroesse: number;
  rolle: 'Admin' | 'Mitarbeiter' | 'Ansprechpartner' | 'Volunteer';
};

const initialPerson: PersonForm = {
  vorname: '',
  name: '',
  strasse: '',
  hausnummer: '',
  mobil: '',
  mail: '',
  kleidergroesse_tshirt: 'M',
  kleidergroesse_jacke: 'M',
  schuhgroesse: 42,
  rolle: 'Volunteer',
};

export function VolunteersPanel() {
  const { activeEventId, currentRole, currentUser } = useEventContext();
  const [groups, setGroups] = useState<GruppeRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [memberships, setMemberships] = useState<GruppenMitgliedRow[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupContactId, setGroupContactId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [personForm, setPersonForm] = useState<PersonForm>(initialPerson);
  const [error, setError] = useState<string | null>(null);

  const canManageGroups = canManageGruppen(currentRole);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const canManageSelectedGroupMembers = selectedGroup
    ? canManageMitglieder(currentRole, selectedGroup, currentUser?.id ?? null)
    : false;

  async function loadData() {
    if (!activeEventId) return;

    const [{ data: groupData }, { data: userData }, { data: memberData }] = await Promise.all([
      supabaseBrowser
        .from('gruppen')
        .select('*')
        .eq('event_id', activeEventId)
        .order('gruppenname', { ascending: true }),
      supabaseBrowser.from('users').select('*').order('name', { ascending: true }),
      supabaseBrowser.from('gruppen_mitglieder').select('*'),
    ]);

    setGroups((groupData ?? []) as GruppeRow[]);
    setUsers((userData ?? []) as UserRow[]);
    setMemberships((memberData ?? []) as GruppenMitgliedRow[]);
  }

  useEffect(() => {
    void loadData();
  }, [activeEventId]);

  async function onCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeEventId || !canManageGroups) return;

    const { error: insertError } = await supabaseBrowser.from('gruppen').insert({
      event_id: activeEventId,
      gruppenname: groupName.trim(),
      ansprechpartner_id: groupContactId || null,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setGroupName('');
    setGroupContactId('');
    setError(null);
    await loadData();
  }

  async function onDeleteGroup(groupId: string) {
    if (!canManageGroups) return;

    const confirmed = window.confirm('Gruppe wirklich loeschen?');
    if (!confirmed) return;

    const { error: deleteError } = await supabaseBrowser.from('gruppen').delete().eq('id', groupId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadData();
  }

  async function onAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedGroupId || !selectedMemberId || !canManageSelectedGroupMembers) return;

    const { error: memberError } = await supabaseBrowser
      .from('gruppen_mitglieder')
      .insert({ gruppe_id: selectedGroupId, user_id: selectedMemberId });

    if (memberError) {
      setError(memberError.message);
      return;
    }

    setSelectedMemberId('');
    setError(null);
    await loadData();
  }

  async function onRemoveMember(gruppeId: string, userId: string) {
    if (!canManageSelectedGroupMembers) return;

    const { error: deleteError } = await supabaseBrowser
      .from('gruppen_mitglieder')
      .delete()
      .eq('gruppe_id', gruppeId)
      .eq('user_id', userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadData();
  }

  async function onSavePerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageGroups) {
      setError('Nur Admin oder Mitarbeiter duerfen Personen anlegen oder bearbeiten.');
      return;
    }

    const payload = {
      vorname: personForm.vorname.trim(),
      name: personForm.name.trim(),
      strasse: personForm.strasse.trim() || null,
      hausnummer: personForm.hausnummer.trim() || null,
      mobil: personForm.mobil.trim() || null,
      mail: personForm.mail.trim(),
      kleidergroesse_tshirt: personForm.kleidergroesse_tshirt,
      kleidergroesse_jacke: personForm.kleidergroesse_jacke,
      schuhgroesse: personForm.schuhgroesse,
      rolle: personForm.rolle,
    };

    if (personForm.id) {
      const { error: updateError } = await supabaseBrowser.from('users').update(payload).eq('id', personForm.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      setError(
        'Neue Personen muessen zunaechst ueber Supabase Auth registriert werden, da users.id auf auth.users referenziert.',
      );
      return;
    }

    setPersonForm(initialPerson);
    setError(null);
    await loadData();
  }

  const memberRows = useMemo(() => {
    if (!selectedGroup) return [];

    const ids = memberships.filter((m) => m.gruppe_id === selectedGroup.id).map((m) => m.user_id);
    return users.filter((user) => ids.includes(user.id));
  }, [memberships, users, selectedGroup]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-lg font-semibold text-slate-900">Volunteers: Gruppen und Personen</h3>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <h4 className="font-medium text-slate-900">Bereich Gruppe</h4>
          <p className="mt-1 text-xs text-slate-600">
            Gruppe CRUD: Admin und Mitarbeiter. Mitglieder pflegen: Admin, Mitarbeiter oder zustaendiger Ansprechpartner.
          </p>

          <form onSubmit={onCreateGroup} className="mt-3 grid gap-2">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Gruppenname"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={!canManageGroups}
              required
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={groupContactId}
              onChange={(e) => setGroupContactId(e.target.value)}
              disabled={!canManageGroups}
            >
              <option value="">Ansprechpartner auswaehlen</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.vorname} {user.name}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              type="submit"
              disabled={!canManageGroups}
            >
              Gruppe speichern
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                <button
                  type="button"
                  className="text-left text-sm font-medium text-slate-800"
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  {group.gruppenname}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 disabled:opacity-50"
                  onClick={() => onDeleteGroup(group.id)}
                  disabled={!canManageGroups}
                >
                  Loeschen
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <h4 className="font-medium text-slate-900">Gruppenmitglieder</h4>
          {!selectedGroup ? (
            <p className="mt-2 text-sm text-slate-600">Waehle links eine Gruppe aus.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">Aktive Gruppe: {selectedGroup.gruppenname}</p>
              <form onSubmit={onAddMember} className="mt-3 flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  disabled={!canManageSelectedGroupMembers}
                >
                  <option value="">Person waehlen</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.vorname} {user.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!canManageSelectedGroupMembers}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  Hinzufuegen
                </button>
              </form>
              <div className="mt-3 space-y-2">
                {memberRows.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <span className="text-sm">{user.vorname} {user.name}</span>
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 disabled:opacity-50"
                      disabled={!canManageSelectedGroupMembers}
                      onClick={() => onRemoveMember(selectedGroup.id, user.id)}
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <h4 className="font-medium text-slate-900">Bereich Person (Einzelhelfer)</h4>
        <p className="mt-1 text-xs text-slate-600">
          Fuer neue Personen zuerst Auth-User erzeugen, danach Profil in users bearbeiten.
        </p>

        <form onSubmit={onSavePerson} className="mt-3 grid gap-2 md:grid-cols-2">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Vorname" value={personForm.vorname} onChange={(e) => setPersonForm((prev) => ({ ...prev, vorname: e.target.value }))} required />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={personForm.name} onChange={(e) => setPersonForm((prev) => ({ ...prev, name: e.target.value }))} required />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Strasse" value={personForm.strasse} onChange={(e) => setPersonForm((prev) => ({ ...prev, strasse: e.target.value }))} />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Hausnummer" value={personForm.hausnummer} onChange={(e) => setPersonForm((prev) => ({ ...prev, hausnummer: e.target.value }))} />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Mobil" value={personForm.mobil} onChange={(e) => setPersonForm((prev) => ({ ...prev, mobil: e.target.value }))} />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="email" placeholder="Mail" value={personForm.mail} onChange={(e) => setPersonForm((prev) => ({ ...prev, mail: e.target.value }))} required />

          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={personForm.kleidergroesse_tshirt} onChange={(e) => setPersonForm((prev) => ({ ...prev, kleidergroesse_tshirt: e.target.value }))}>
            {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={personForm.kleidergroesse_jacke} onChange={(e) => setPersonForm((prev) => ({ ...prev, kleidergroesse_jacke: e.target.value }))}>
            {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="number"
            min={36}
            max={48}
            value={personForm.schuhgroesse}
            onChange={(e) => setPersonForm((prev) => ({ ...prev, schuhgroesse: Number(e.target.value) }))}
          />

          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={personForm.rolle} onChange={(e) => setPersonForm((prev) => ({ ...prev, rolle: e.target.value as PersonForm['rolle'] }))}>
            {['Admin', 'Mitarbeiter', 'Ansprechpartner', 'Volunteer'].map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white md:col-span-2" type="submit">
            Person speichern
          </button>
        </form>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Mail</th>
                <th className="px-2 py-2">Rolle</th>
                <th className="px-2 py-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">{user.vorname} {user.name}</td>
                  <td className="px-2 py-2">{user.mail}</td>
                  <td className="px-2 py-2">{user.rolle}</td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-2 py-1"
                      onClick={() =>
                        setPersonForm({
                          id: user.id,
                          vorname: user.vorname,
                          name: user.name,
                          strasse: user.strasse ?? '',
                          hausnummer: user.hausnummer ?? '',
                          mobil: user.mobil ?? '',
                          mail: user.mail,
                          kleidergroesse_tshirt: user.kleidergroesse_tshirt ?? 'M',
                          kleidergroesse_jacke: user.kleidergroesse_jacke ?? 'M',
                          schuhgroesse: user.schuhgroesse ?? 42,
                          rolle: user.rolle,
                        })
                      }
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
