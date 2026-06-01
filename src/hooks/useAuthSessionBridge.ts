import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { supabase } from '../utils/supabaseClient';

type AuthSessionBridgeStore = {
  setAuthSession: (session: Session | null, event?: AuthChangeEvent) => Promise<void>;
};

export function useAuthSessionBridge(): void {
  const setAuthSession = useWorkoutStore((state: AuthSessionBridgeStore) => state.setAuthSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthSession(session, event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuthSession]);
}
