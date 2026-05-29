import { useEffect } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { supabase } from '../utils/supabaseClient';

export function useAuthSessionBridge() {
  const setAuthSession = useWorkoutStore(state => state.setAuthSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuthSession]);
}
