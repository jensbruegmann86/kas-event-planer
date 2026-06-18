'use server';

import { createSupabaseAdminClient } from '../../lib/supabase/admin-client';
import { createSupabaseServerClient } from '../../lib/supabase/server';

type CreateMyOrganisationPayload = {
  name: string;
};

type CreateMyOrganisationResult =
  | { success: true; orgId: string }
  | { error: string };

export async function createMyOrganisation(
  payload: CreateMyOrganisationPayload,
): Promise<CreateMyOrganisationResult> {
  const orgName = payload.name.trim();

  if (orgName.length < 2) {
    return { error: 'Bitte einen gueltigen Organisationsnamen eingeben.' };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Nicht authentifiziert.' };
  }

  if (!user.email) {
    return { error: 'Dein Konto hat keine E-Mail-Adresse. Bitte Support kontaktieren.' };
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return {
      error:
        'SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte in .env.local und Vercel Environment Variables eintragen.',
    };
  }

  const { data: existingMemberships, error: membershipCheckError } = await adminClient
    .from('organisation_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);

  if (membershipCheckError) {
    return { error: membershipCheckError.message };
  }

  if ((existingMemberships?.length ?? 0) > 0) {
    return { error: 'Du bist bereits einer Organisation zugewiesen.' };
  }

  const { data: orgData, error: orgInsertError } = await adminClient
    .from('organisations')
    .insert({
      name: orgName,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (orgInsertError || !orgData) {
    return { error: orgInsertError?.message ?? 'Organisation konnte nicht erstellt werden.' };
  }

  const { error: memberInsertError } = await adminClient
    .from('organisation_members')
    .insert({
      org_id: orgData.id,
      user_id: user.id,
      email: user.email.trim().toLowerCase(),
      role: 'admin',
      status: 'active',
      invited_by: user.id,
      joined_at: new Date().toISOString(),
    });

  if (memberInsertError) {
    await adminClient.from('organisations').delete().eq('id', orgData.id);
    return { error: memberInsertError.message };
  }

  return { success: true, orgId: orgData.id };
}