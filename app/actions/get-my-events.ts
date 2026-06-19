'use server';

import { createSupabaseAdminClient } from '../../lib/supabase/admin-client';
import { createSupabaseServerClient } from '../../lib/supabase/server';

type EventRow = {
  id: string;
  name: string;
  datum: string;
  org_id: string | null;
};

type GetMyEventsResult = {
  events: EventRow[];
  error?: string;
};

export async function getMyEvents(): Promise<GetMyEventsResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { events: [] };
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return { events: [], error: 'SUPABASE_SERVICE_ROLE_KEY fehlt.' };
  }

  const { data: memberships, error: membershipError } = await adminClient
    .from('organisation_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false, nullsFirst: false })
    .order('invited_at', { ascending: false, nullsFirst: false })
    .limit(1);

  if (membershipError) {
    return { events: [], error: membershipError.message };
  }

  const activeOrgId = memberships?.[0]?.org_id;
  if (!activeOrgId) {
    return { events: [] };
  }

  const { data: eventRows, error: eventError } = await adminClient
    .from('events')
    .select('id, name, datum, org_id')
    .eq('org_id', activeOrgId)
    .order('datum', { ascending: false });

  if (eventError) {
    return { events: [], error: eventError.message };
  }

  return { events: (eventRows ?? []) as EventRow[] };
}