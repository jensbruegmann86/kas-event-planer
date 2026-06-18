'use server';

import { createSupabaseAdminClient } from '../../lib/supabase/admin-client';
import { createSupabaseServerClient } from '../../lib/supabase/server';

type EnsureMembershipResult = {
  ok: boolean;
  repaired: boolean;
  error?: string;
};

export async function ensureMyOrgMembership(): Promise<EnsureMembershipResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, repaired: false, error: 'Nicht authentifiziert.' };
  }

  if (!user.email) {
    return { ok: false, repaired: false, error: 'Keine E-Mail am Konto vorhanden.' };
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return {
      ok: false,
      repaired: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY fehlt.',
    };
  }

  const { data: existingMemberships, error: existingMembershipError } = await adminClient
    .from('organisation_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);

  if (existingMembershipError) {
    return { ok: false, repaired: false, error: existingMembershipError.message };
  }

  if ((existingMemberships?.length ?? 0) > 0) {
    return { ok: true, repaired: false };
  }

  const { data: ownOrgs, error: ownOrgsError } = await adminClient
    .from('organisations')
    .select('id')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (ownOrgsError) {
    return { ok: false, repaired: false, error: ownOrgsError.message };
  }

  const ownOrg = ownOrgs?.[0];
  if (!ownOrg) {
    return { ok: true, repaired: false };
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const { error: upsertError } = await adminClient
    .from('organisation_members')
    .upsert(
      {
        org_id: ownOrg.id,
        user_id: user.id,
        email: normalizedEmail,
        role: 'admin',
        status: 'active',
        invited_by: user.id,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,email', ignoreDuplicates: false },
    );

  if (upsertError) {
    return { ok: false, repaired: false, error: upsertError.message };
  }

  return { ok: true, repaired: true };
}