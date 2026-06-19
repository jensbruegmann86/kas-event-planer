'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createOrgEvent } from '../../actions/create-org-event';
import { getMyEvents } from '../../actions/get-my-events';
import { supabaseBrowser } from '../_lib/supabase-browser';
import type { AuthUser, EventRow, Rolle, UserRow } from '../_lib/types';

type EventContextValue = {
  events: EventRow[];
  activeEventId: string | null;
  activeEvent: EventRow | null;
  loading: boolean;
  authUser: AuthUser | null;
  currentUser: UserRow | null;
  currentRole: Rolle | null;
  setActiveEventId: (id: string) => void;
  createEvent: (payload: { name: string; datum: string; org_id?: string | null }) => Promise<void>;
  refreshEvents: () => Promise<void>;
};

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserRow | null>(null);

  useEffect(() => {
    const storedEventId = window.localStorage.getItem('activeEventId');
    if (storedEventId) {
      setActiveEventId(storedEventId);
    }
  }, []);

  useEffect(() => {
    if (!activeEventId) return;
    window.localStorage.setItem('activeEventId', activeEventId);
  }, [activeEventId]);

  const syncUserProfile = useCallback(
    async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      const { data: existingProfile, error: selectError } = await supabaseBrowser
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (selectError) {
        throw selectError;
      }

      if (existingProfile) {
        setCurrentUser(existingProfile as UserRow);
        return;
      }

      const { data: insertedProfile, error: insertError } = await supabaseBrowser
        .from('users')
        .insert({
          id: user.id,
          vorname: String(user.user_metadata?.vorname ?? ''),
          name: String(user.user_metadata?.name ?? ''),
          mail: user.email ?? '',
          rolle: 'Volunteer',
        })
        .select('*')
        .single();

      if (insertError) {
        throw insertError;
      }

      setCurrentUser(insertedProfile as UserRow);
    },
    [],
  );

  const refreshEvents = useCallback(async () => {
    const result = await getMyEvents();
    if (result.error) {
      throw new Error(result.error);
    }

    const rows = (result.events ?? []) as EventRow[];
    setEvents(rows);

    setActiveEventId((prev) => {
      if (prev && rows.some((row) => row.id === prev)) return prev;
      return rows[0]?.id ?? null;
    });
  }, []);

  const createEvent = useCallback(
    async (payload: { name: string; datum: string; org_id?: string | null }) => {
      if (!payload.org_id) {
        throw new Error('Kein Organisationskontext vorhanden.');
      }

      const result = await createOrgEvent({
        orgId: payload.org_id,
        name: payload.name,
        datum: payload.datum,
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      setActiveEventId(result.eventId);
      await refreshEvents();
    },
    [refreshEvents],
  );

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) {
          setAuthUser(null);
          setCurrentUser(null);
          await refreshEvents();
          return;
        }

        setAuthUser({ id: user.id, email: user.email ?? null });
        try {
          await syncUserProfile(user);
        } catch (profileError) {
          console.error('Fehler beim Laden des Benutzerprofils', profileError);
        }
        await refreshEvents();
      } catch (error) {
        console.error('Fehler beim Laden des Event-Kontexts', error);
      } finally {
        setLoading(false);
      }
    }

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAuthUser(null);
        setCurrentUser(null);
        return;
      }

      setAuthUser({ id: session.user.id, email: session.user.email ?? null });
      void syncUserProfile(session.user);
      void refreshEvents();
    });

    void bootstrap();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshEvents, syncUserProfile]);

  const activeEvent = useMemo(
    () => events.find((row) => row.id === activeEventId) ?? null,
    [events, activeEventId],
  );

  const value = useMemo<EventContextValue>(
    () => ({
      events,
      activeEventId,
      activeEvent,
      loading,
      authUser,
      currentUser,
      currentRole: currentUser?.rolle ?? null,
      setActiveEventId,
      createEvent,
      refreshEvents,
    }),
    [events, activeEventId, activeEvent, loading, authUser, currentUser, createEvent, refreshEvents],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEventContext muss innerhalb von EventProvider verwendet werden.');
  return ctx;
}
