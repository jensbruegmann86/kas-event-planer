'use server';

import { createSupabaseAdminClient } from '../../lib/supabase/admin-client';
import { createSupabaseServerClient } from '../../lib/supabase/server';

type InvitePayload = {
  orgId: string;
  email: string;
  role: 'admin' | 'member';
};

type InviteResult =
  | { success: true; inviteUrl?: string }
  | { warning: string }
  | { error: string };

export async function inviteMember(payload: InvitePayload): Promise<InviteResult> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Nicht authentifiziert.' };

  const { data: membership } = await supabase
    .from('organisation_members')
    .select('role')
    .eq('org_id', payload.orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membership?.role !== 'admin') {
    return { error: 'Keine Berechtigung. Nur Admins duerfen Mitglieder einladen.' };
  }

  const normalizedEmail = payload.email.trim().toLowerCase();

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return {
      error:
        'SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte in .env.local und Vercel Environment Variables eintragen.',
    };
  }

  const { error: upsertError } = await adminClient
    .from('organisation_members')
    .upsert(
      {
        org_id: payload.orgId,
        email: normalizedEmail,
        role: payload.role,
        status: 'pending',
        invited_by: user.id,
      },
      { onConflict: 'org_id,email', ignoreDuplicates: false },
    );

  if (upsertError) return { error: upsertError.message };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ??
    '';

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo: `${siteUrl}/admin` },
  );

  if (inviteError) {
    return {
      warning: `Mitglied angelegt, aber E-Mail konnte nicht gesendet werden: ${inviteError.message}. Bitte SMTP in Supabase konfigurieren oder NEXT_PUBLIC_SITE_URL setzen.`,
    };
  }

  return { success: true };
}
