'use server';

import { createSupabaseAdminClient } from '../../lib/supabase/admin-client';
import { createSupabaseServerClient } from '../../lib/supabase/server';

type MemberRole = 'admin' | 'member';

type InviteMembersPayload = {
  orgId: string;
  emails: string[];
  role: MemberRole;
};

type InviteMemberOutcome = {
  email: string;
  status: 'linked' | 'invited' | 'updated' | 'skipped' | 'error';
  message: string;
};

type InviteMembersResult =
  | { success: true; outcomes: InviteMemberOutcome[] }
  | { error: string };

type UpdateRolePayload = {
  memberId: string;
  role: MemberRole;
};

type RemoveMemberPayload = {
  memberId: string;
};

type ActionResult =
  | { success: true }
  | { error: string };

async function requireOrgAdmin(orgId?: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Nicht authentifiziert.');
  }

  const adminClient = createSupabaseAdminClient();

  if (!orgId) {
    return { user, adminClient };
  }

  const { data: membershipRows, error: membershipError } = await adminClient
    .from('organisation_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .eq('status', 'active')
    .limit(1);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if ((membershipRows?.length ?? 0) === 0) {
    throw new Error('Keine Berechtigung. Nur Organisations-Admins dürfen Mitglieder verwalten.');
  }

  return { user, adminClient };
}

function normalizeEmails(emails: string[]) {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

async function getOrgForMember(adminClient: ReturnType<typeof createSupabaseAdminClient>, memberId: string) {
  const { data, error } = await adminClient
    .from('organisation_members')
    .select('id, org_id, user_id, email, role, status')
    .eq('id', memberId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Mitglied nicht gefunden.');
  }

  return data;
}

export async function inviteMembers(payload: InviteMembersPayload): Promise<InviteMembersResult> {
  try {
    const { user, adminClient } = await requireOrgAdmin(payload.orgId);
    const emails = normalizeEmails(payload.emails);

    if (emails.length === 0) {
      return { error: 'Bitte mindestens eine gültige E-Mail-Adresse eingeben.' };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const outcomes: InviteMemberOutcome[] = [];

    for (const email of emails) {
      const { data: existingUserRows, error: existingUserError } = await adminClient
        .from('users')
        .select('id, mail')
        .ilike('mail', email)
        .limit(1);

      if (existingUserError) {
        outcomes.push({ email, status: 'error', message: existingUserError.message });
        continue;
      }

      const existingUser = existingUserRows?.[0] ?? null;

      if (existingUser?.id) {
        const { data: activeMemberships, error: activeMembershipError } = await adminClient
          .from('organisation_members')
          .select('org_id')
          .eq('user_id', existingUser.id)
          .eq('status', 'active')
          .limit(1);

        if (activeMembershipError) {
          outcomes.push({ email, status: 'error', message: activeMembershipError.message });
          continue;
        }

        const activeMembership = activeMemberships?.[0] ?? null;
        if (activeMembership && activeMembership.org_id !== payload.orgId) {
          outcomes.push({
            email,
            status: 'skipped',
            message: 'User gehört bereits einer anderen Organisation an.',
          });
          continue;
        }

        const { error: linkError } = await adminClient
          .from('organisation_members')
          .upsert(
            {
              org_id: payload.orgId,
              user_id: existingUser.id,
              email,
              role: payload.role,
              status: 'active',
              invited_by: user.id,
              joined_at: new Date().toISOString(),
            },
            { onConflict: 'org_id,email', ignoreDuplicates: false },
          );

        if (linkError) {
          outcomes.push({ email, status: 'error', message: linkError.message });
        } else {
          outcomes.push({
            email,
            status: activeMembership ? 'updated' : 'linked',
            message: activeMembership ? 'Mitgliedschaft aktualisiert.' : 'Bestehender Account direkt verknüpft.',
          });
        }
        continue;
      }

      const { data: emailMemberships, error: emailMembershipError } = await adminClient
        .from('organisation_members')
        .select('org_id, status')
        .ilike('email', email)
        .in('status', ['pending', 'active'])
        .limit(1);

      if (emailMembershipError) {
        outcomes.push({ email, status: 'error', message: emailMembershipError.message });
        continue;
      }

      const emailMembership = emailMemberships?.[0] ?? null;
      if (emailMembership && emailMembership.org_id !== payload.orgId) {
        outcomes.push({
          email,
          status: 'skipped',
          message: 'Diese E-Mail ist bereits einer anderen Organisation zugeordnet oder eingeladen.',
        });
        continue;
      }

      const { error: pendingError } = await adminClient
        .from('organisation_members')
        .upsert(
          {
            org_id: payload.orgId,
            email,
            role: payload.role,
            status: 'pending',
            invited_by: user.id,
          },
          { onConflict: 'org_id,email', ignoreDuplicates: false },
        );

      if (pendingError) {
        outcomes.push({ email, status: 'error', message: pendingError.message });
        continue;
      }

      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: siteUrl ? `${siteUrl}/auth/register` : undefined,
      });

      if (inviteError) {
        outcomes.push({
          email,
          status: 'error',
          message: `Einladung gespeichert, aber E-Mail-Versand fehlgeschlagen: ${inviteError.message}`,
        });
      } else {
        outcomes.push({ email, status: 'invited', message: 'Einladung gesendet.' });
      }
    }

    return { success: true, outcomes };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Einladungen konnten nicht verarbeitet werden.' };
  }
}

export async function updateOrganisationMemberRole(payload: UpdateRolePayload): Promise<ActionResult> {
  try {
    const { user, adminClient } = await requireOrgAdmin();
    const member = await getOrgForMember(adminClient, payload.memberId);
    await requireOrgAdmin(member.org_id);

    if (member.user_id === user.id && payload.role !== 'admin') {
      return { error: 'Du kannst dir nicht selbst die Admin-Rolle entziehen.' };
    }

    if (member.role === 'admin' && payload.role === 'member') {
      const { count, error: countError } = await adminClient
        .from('organisation_members')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', member.org_id)
        .eq('role', 'admin')
        .eq('status', 'active');

      if (countError) {
        return { error: countError.message };
      }

      if ((count ?? 0) <= 1) {
        return { error: 'Mindestens ein Admin muss in der Organisation verbleiben.' };
      }
    }

    const { error } = await adminClient
      .from('organisation_members')
      .update({ role: payload.role })
      .eq('id', payload.memberId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Rolle konnte nicht aktualisiert werden.' };
  }
}

export async function removeOrganisationMember(payload: RemoveMemberPayload): Promise<ActionResult> {
  try {
    const { user, adminClient } = await requireOrgAdmin();
    const member = await getOrgForMember(adminClient, payload.memberId);
    await requireOrgAdmin(member.org_id);

    if (member.user_id === user.id) {
      return { error: 'Du kannst dich nicht selbst aus der Organisation entfernen.' };
    }

    if (member.role === 'admin' && member.status === 'active') {
      const { count, error: countError } = await adminClient
        .from('organisation_members')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', member.org_id)
        .eq('role', 'admin')
        .eq('status', 'active');

      if (countError) {
        return { error: countError.message };
      }

      if ((count ?? 0) <= 1) {
        return { error: 'Der letzte Admin kann nicht entfernt werden.' };
      }
    }

    const { error } = await adminClient
      .from('organisation_members')
      .delete()
      .eq('id', payload.memberId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Mitglied konnte nicht entfernt werden.' };
  }
}