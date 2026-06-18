'use client';

import { FormEvent, useEffect, useState } from 'react';
import { inviteMember } from '../../../app/actions/invite-member';
import { useOrgContext } from '../_context/org-context';
import type { OrgMemberRow } from '../_lib/types';

export default function OrganisationPage() {
  const { org, members, isOrgAdmin, orgLoading, updateOrgName, removeMember, updateMemberRole, refreshOrg } =
    useOrgContext();

  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (org?.name) setOrgName(org.name);
  }, [org?.name]);

  async function onSaveOrgName(e: FormEvent<HTMLFormElement>) {
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

  async function onInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!org || !inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    setMessage(null);

    const result = await inviteMember({
      orgId: org.id,
      email: inviteEmail.trim(),
      role: inviteRole,
    });

    if ('error' in result) {
      setError(result.error);
    } else if ('warning' in result) {
      setMessage(result.warning ?? '');
      setInviteEmail('');
      await refreshOrg();
    } else {
      setMessage(`Einladung an ${inviteEmail} wurde gesendet.`);
      setInviteEmail('');
      await refreshOrg();
    }
    setInviting(false);
  }

  if (orgLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        Lade Organisation...
      </div>
    );
  }

  if (!org) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Keine Organisation</h1>
        <p className="mt-2 text-sm text-slate-600">
          Du bist noch keiner Organisation zugewiesen. Bitte wende dich an einen Administrator.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Org name */}
      <section id="organisation" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Organisation</h1>
        {isOrgAdmin ? (
          <form onSubmit={onSaveOrgName} className="mt-4 flex gap-3">
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
        ) : (
          <p className="mt-2 text-base font-medium text-slate-800">{org.name}</p>
        )}
        {message && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}
      </section>

      {/* Invite */}
      {isOrgAdmin && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Mitglied einladen</h2>
          <p className="mt-1 text-sm text-slate-600">
            Das Mitglied erhält eine Einladungs-E-Mail. Voraussetzung: SMTP in Supabase konfiguriert und{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> in den
            Umgebungsvariablen gesetzt.
          </p>
          <form onSubmit={onInvite} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              type="email"
              placeholder="E-Mail-Adresse"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
            >
              <option value="member">Benutzer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {inviting ? 'Einladen...' : 'Einladen'}
            </button>
          </form>
        </section>
      )}

      {/* Members */}
      <section id="mitglieder" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">
          Mitglieder{' '}
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">
            {members.length}
          </span>
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">E-Mail</th>
                <th className="px-2 py-2">Rolle</th>
                <th className="px-2 py-2">Status</th>
                {isOrgAdmin && <th className="px-2 py-2">Aktionen</th>}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-slate-500">
                    Noch keine Mitglieder.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isOrgAdmin={isOrgAdmin}
                    onRemove={() => removeMember(member.id)}
                    onRoleChange={(role) => updateMemberRole(member.id, role)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MemberRow({
  member,
  isOrgAdmin,
  onRemove,
  onRoleChange,
}: {
  member: OrgMemberRow;
  isOrgAdmin: boolean;
  onRemove: () => void;
  onRoleChange: (role: 'admin' | 'member') => void;
}) {
  const displayName =
    member.users ? `${member.users.vorname} ${member.users.name}`.trim() : '–';

  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-2">{displayName}</td>
      <td className="px-2 py-2 text-slate-600">{member.email}</td>
      <td className="px-2 py-2">
        {isOrgAdmin ? (
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={member.role}
            onChange={(e) => onRoleChange(e.target.value as 'admin' | 'member')}
          >
            <option value="member">Benutzer</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              member.role === 'admin'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {member.role === 'admin' ? 'Admin' : 'Benutzer'}
          </span>
        )}
      </td>
      <td className="px-2 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            member.status === 'active'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {member.status === 'active' ? 'Aktiv' : 'Ausstehend'}
        </span>
      </td>
      {isOrgAdmin && (
        <td className="px-2 py-2">
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
          >
            Entfernen
          </button>
        </td>
      )}
    </tr>
  );
}
