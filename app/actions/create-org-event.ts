'use server';

import { createSupabaseAdminClient } from '../../lib/supabase/admin-client';
import { createSupabaseServerClient } from '../../lib/supabase/server';

type CreateOrgEventPayload = {
  orgId: string;
  name: string;
  datum: string;
};

type CreateOrgEventResult =
  | { success: true; eventId: string }
  | { error: string };

export async function createOrgEvent(payload: CreateOrgEventPayload): Promise<CreateOrgEventResult> {
  const name = payload.name.trim();
  const datum = payload.datum.trim();

  if (!name || !datum) {
    return { error: 'Bitte Name und Datum angeben.' };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Nicht authentifiziert.' };
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY fehlt.' };
  }

  const { data: membershipRows, error: membershipError } = await adminClient
    .from('organisation_members')
    .select('id')
    .eq('org_id', payload.orgId)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .eq('status', 'active')
    .limit(1);

  if (membershipError) {
    return { error: membershipError.message };
  }

  if ((membershipRows?.length ?? 0) === 0) {
    return { error: 'Keine Berechtigung. Nur Organisations-Admins dürfen Events anlegen.' };
  }

  const { data: eventData, error: eventError } = await adminClient
    .from('events')
    .insert({
      name,
      datum,
      org_id: payload.orgId,
    })
    .select('id')
    .single();

  if (eventError || !eventData) {
    return { error: eventError?.message ?? 'Event konnte nicht erstellt werden.' };
  }

  return { success: true, eventId: eventData.id };
}