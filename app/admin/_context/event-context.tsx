'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabaseBrowser } from '../_lib/supabase-browser';
import type { EventRow, Rolle, UserRow } from '../_lib/types';

type EventContextValue = {
  events: EventRow[];
  activeEventId: string | null;
  activeEvent: EventRow | null;
  loading: boolean;
  currentUser: UserRow | null;
  currentRole: Rolle | null;
  setActiveEventId: (id: string) => void;
  createEvent: (payload: { name: string; datum: string }) => Promise<void>;
  refreshEvents: () => Promise<void>;
};

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserRow | null>(null);

  const refreshEvents = useCallback(async () => {
    const { data, error } = await supabaseBrowser
      .from('events')
      .select('id, name, datum')
      .order('datum', { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as EventRow[];
    setEvents(rows);

    setActiveEventId((prev) => {
      if (prev && rows.some((row) => row.id === prev)) return prev;
      return rows[0]?.id ?? null;
    });
  }, []);

  const createEvent = useCallback(
    async (payload: { name: string; datum: string }) => {
      const { error } = await supabaseBrowser.from('events').insert(payload);
      if (error) throw error;
      await refreshEvents();
    },
    [refreshEvents],
  );

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        await refreshEvents();

        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) {
          setCurrentUser(null);
          return;
        }

        const { data } = await supabaseBrowser
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setCurrentUser((data ?? null) as UserRow | null);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, [refreshEvents]);

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
      currentUser,
      currentRole: currentUser?.rolle ?? null,
      setActiveEventId,
      createEvent,
      refreshEvents,
    }),
    [events, activeEventId, activeEvent, loading, currentUser, createEvent, refreshEvents],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEventContext muss innerhalb von EventProvider verwendet werden.');
  return ctx;
}
