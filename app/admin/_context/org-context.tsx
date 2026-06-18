'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getMyOrganisationState } from '../../actions/get-my-organisation-state';
import { supabaseBrowser } from '../_lib/supabase-browser';
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
    const state = await getMyOrganisationState();
    if (state.error) {
      console.error('Fehler beim Laden des Organisationsstatus', state.error);
    }

    setOrg((state.org ?? null) as OrgRow | null);
    setMembers((state.members ?? []) as OrgMemberRow[]);
    setMyOrgRole(state.myRole ?? null);
  }, []);

  const updateOrgName = useCallback(
    async (name: string) => {
      if (!org) throw new Error('Keine Organisation geladen.');
      const { error } = await supabaseBrowser
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
      const { error } = await supabaseBrowser
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
      const { error } = await supabaseBrowser
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

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setOrg(null);
        setMembers([]);
        setMyOrgRole(null);
        setOrgLoading(false);
        return;
      }

      setOrgLoading(true);
      refreshOrg().finally(() => setOrgLoading(false));
    });

    return () => {
      subscription.unsubscribe();
    };
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
