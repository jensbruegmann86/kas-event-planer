'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import type { OrgMemberRow, OrgRow } from '../_lib/types';

type OrgContextValue = {
  org: OrgRow | null;
  members: OrgMemberRow[];
  isOrgAdmin: boolean;
  orgLoading: boolean;
  refreshOrg: () => Promise<void>;
  updateOrgName: (name: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: 'admin' | 'member') => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [members, setMembers] = useState<OrgMemberRow[]>([]);
  const [myOrgRole, setMyOrgRole] = useState<'admin' | 'member' | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const refreshOrg = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setOrg(null);
      setMembers([]);
      setMyOrgRole(null);
      return;
    }

    // Activate any pending org invitations by email first
    await supabase.rpc('activate_pending_org_memberships', {
      p_user_id: user.id,
      p_email: user.email ?? '',
    });

    const { data: myMemberships, error: membershipError } = await supabase
      .from('organisation_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false, nullsFirst: false })
      .order('invited_at', { ascending: false, nullsFirst: false })
      .limit(1);

    if (membershipError) {
      console.error('Fehler beim Laden der Organisationsmitgliedschaft', membershipError);
      setOrg(null);
      setMembers([]);
      setMyOrgRole(null);
      return;
    }

    const myMembership = myMemberships?.[0] ?? null;

    if (!myMembership) {
      setOrg(null);
      setMembers([]);
      setMyOrgRole(null);
      return;
    }

    setMyOrgRole(myMembership.role as 'admin' | 'member');

    const [{ data: orgData }, { data: membersData }] = await Promise.all([
      supabase.from('organisations').select('*').eq('id', myMembership.org_id).maybeSingle(),
      supabase
        .from('organisation_members')
        .select('*, users(vorname, name)')
        .eq('org_id', myMembership.org_id)
        .order('invited_at', { ascending: true }),
    ]);

    setOrg((orgData ?? null) as OrgRow | null);
    setMembers((membersData ?? []) as OrgMemberRow[]);
  }, []);

  const updateOrgName = useCallback(
    async (name: string) => {
      if (!org) throw new Error('Keine Organisation geladen.');
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('organisations')
        .update({ name })
        .eq('id', org.id);
      if (error) throw error;
      await refreshOrg();
    },
    [org, refreshOrg],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('organisation_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      await refreshOrg();
    },
    [refreshOrg],
  );

  const updateMemberRole = useCallback(
    async (memberId: string, role: 'admin' | 'member') => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('organisation_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
      await refreshOrg();
    },
    [refreshOrg],
  );

  useEffect(() => {
    setOrgLoading(true);
    refreshOrg().finally(() => setOrgLoading(false));
  }, [refreshOrg]);

  const value = useMemo<OrgContextValue>(
    () => ({
      org,
      members,
      isOrgAdmin: myOrgRole === 'admin',
      orgLoading,
      refreshOrg,
      updateOrgName,
      removeMember,
      updateMemberRole,
    }),
    [org, members, myOrgRole, orgLoading, refreshOrg, updateOrgName, removeMember, updateMemberRole],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrgContext muss innerhalb von OrgProvider verwendet werden.');
  return ctx;
}
