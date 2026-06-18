'use server';

import { createSupabaseAdminClient } from '../../lib/supabase/admin-client';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { ensureMyOrgMembership } from './ensure-my-org-membership';

type OrgRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

type OrgMemberRow = {
  id: string;
  org_id: string;
  user_id: string | null;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active';
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  users?: { vorname: string; name: string } | null;
};

type OrgStateResult = {
  org: OrgRow | null;
  members: OrgMemberRow[];
  myRole: 'admin' | 'member' | null;
  error?: string;
};

export async function getMyOrganisationState(): Promise<OrgStateResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { org: null, members: [], myRole: null };
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return {
      org: null,
      members: [],
      myRole: null,
      error: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
    };
  }

  const normalizedEmail = (user.email ?? '').trim().toLowerCase();
  if (normalizedEmail) {
    await adminClient.rpc('activate_pending_org_memberships', {
      p_user_id: user.id,
      p_email: normalizedEmail,
    });
  }

  const getMembership = async () => {
    const { data, error } = await adminClient
      .from('organisation_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('invited_at', { ascending: false })
      .limit(1);
    return { data, error };
  };

  let { data: membershipRows, error: membershipError } = await getMembership();

  if (membershipError) {
    return { org: null, members: [], myRole: null, error: membershipError.message };
  }

  let membership = membershipRows?.[0] ?? null;

  if (!membership) {
    const repair = await ensureMyOrgMembership();
    if (!repair.ok && repair.error) {
      return { org: null, members: [], myRole: null, error: repair.error };
    }

    ({ data: membershipRows, error: membershipError } = await getMembership());

    if (membershipError) {
      return { org: null, members: [], myRole: null, error: membershipError.message };
    }

    membership = membershipRows?.[0] ?? null;
  }

  if (!membership) {
    return { org: null, members: [], myRole: null };
  }

  const [{ data: orgData, error: orgError }, { data: membersData, error: membersError }] = await Promise.all([
    adminClient.from('organisations').select('*').eq('id', membership.org_id).maybeSingle(),
    adminClient
      .from('organisation_members')
      .select('*, users(vorname, name)')
      .eq('org_id', membership.org_id)
      .order('invited_at', { ascending: true }),
  ]);

  if (orgError) {
    return { org: null, members: [], myRole: null, error: orgError.message };
  }

  if (membersError) {
    return { org: (orgData ?? null) as OrgRow | null, members: [], myRole: membership.role as 'admin' | 'member', error: membersError.message };
  }

  return {
    org: (orgData ?? null) as OrgRow | null,
    members: (membersData ?? []) as OrgMemberRow[],
    myRole: membership.role as 'admin' | 'member',
  };
}