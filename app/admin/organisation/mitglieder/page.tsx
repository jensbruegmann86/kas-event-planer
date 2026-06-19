'use client';

import { FormEvent, useState } from 'react';
import { inviteMembers } from '../../../../app/actions/manage-org-members';
import { useOrgContext } from '../../_context/org-context';
import type { OrgMemberRow } from '../../_lib/types';

export default function OrganisationMitgliederPage() {
  const { org, members, isOrgAdmin, orgLoading, removeMember, updateMemberRole, refreshOrg } = useOrgContext();

  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function parseEmails(value: string) {
    return value
      .split(/[\n,;]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  async function onInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!org) return;

    const emails = parseEmails(inviteEmails);
    if (emails.length === 0) {
      setError('Bitte mindestens eine E-Mail-Adresse eingeben.');
      return;
    }

    setInviting(true);
    setError(null);
    setMessage(null);

    const result = await inviteMembers({
      orgId: org.id,
      emails,
      role: inviteRole,
    });

    if ('error' in result) {
      setError(result.error);
    } else {
      const summary = result.outcomes.map((outcome) => `${outcome.email}: ${outcome.message}`).join(' | ');
      setMessage(summary);
      setInviteEmails('');
      await refreshOrg();
    }

    setInviting(false);
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
        <p className="mt-2 text-sm text-slate-600">Nur Admins dürfen Mitglieder verwalten.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Mitglied einladen</h1>
        <p className="mt-1 text-sm text-slate-600">Mehrere E-Mail-Adressen sind per Komma, Semikolon oder Zeilenumbruch möglich.</p>

        <form onSubmit={onInvite} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="max@beispiel.de, anna@beispiel.de"
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
            required
          />
          <div className="grid gap-3">
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
          </div>
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

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Mitglieder</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">E-Mail</th>
                <th className="px-2 py-2">Rolle</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Aktionen</th>
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
  onRemove,
  onRoleChange,
}: {
  member: OrgMemberRow;
  onRemove: () => void;
  onRoleChange: (role: 'admin' | 'member') => void;
}) {
  const displayName = member.users ? `${member.users.vorname} ${member.users.name}`.trim() : '–';

  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-2">{displayName}</td>
      <td className="px-2 py-2 text-slate-600">{member.email}</td>
      <td className="px-2 py-2">
        <select
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          value={member.role}
          onChange={(e) => onRoleChange(e.target.value as 'admin' | 'member')}
        >
          <option value="member">Benutzer</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="px-2 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            member.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {member.status === 'active' ? 'Aktiv' : 'Eingeladen'}
        </span>
      </td>
      <td className="px-2 py-2">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
        >
          Entfernen
        </button>
      </td>
    </tr>
  );
}
