import * as workoutRepository from '../../api/supabaseWorkoutRepository.js';
import { DEFAULT_EXERCISES, createDummyWorkoutData } from '../../data/dummyGenerator.js';

export const GUEST_USER = { id: '00000000-0000-0000-0000-000000000000', name: '게스트', isGuest: true };

export const initialSeed = createDummyWorkoutData({ userId: GUEST_USER.id, existingExercises: DEFAULT_EXERCISES });

export const createAuthSlice = (set, get, store) => {
  const failedRemoteSyncTasks = new Map();
  let remoteSyncTaskId = 0;

  const getRemoteSyncErrorMessage = (error) => {
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message;
    }
    return '원격 동기화 중 문제가 발생했습니다.';
  };

  const updateRemoteSyncError = (label, error, overrides = {}) => {
    set({
      remoteSyncError: {
        label,
        message: getRemoteSyncErrorMessage(error),
        failedAt: new Date().toISOString(),
        pendingCount: failedRemoteSyncTasks.size,
        isRetrying: false,
        ...overrides,
      },
    });
  };

  const clearRemoteSyncFailures = () => {
    failedRemoteSyncTasks.clear();
    set({ remoteSyncError: null });
  };

  const runRemoteSync = (label, task) => {
    const id = `remote-sync-${Date.now()}-${remoteSyncTaskId++}`;

    Promise.resolve()
      .then(task)
      .catch((error) => {
        failedRemoteSyncTasks.set(id, { id, label, task, error });
        updateRemoteSyncError(label, error);
        console.error(`Failed to sync ${label}:`, error);
      });
  };

  const retryFailedRemoteSyncTasks = async () => {
    const queuedTasks = [...failedRemoteSyncTasks.values()];
    if (queuedTasks.length === 0) {
      set({ remoteSyncError: null });
      return;
    }

    const firstTask = queuedTasks[0];
    set((state) => ({
      remoteSyncError: {
        label: state.remoteSyncError?.label || firstTask.label,
        message: state.remoteSyncError?.message || '원격 동기화를 다시 시도하고 있습니다.',
        failedAt: state.remoteSyncError?.failedAt || new Date().toISOString(),
        pendingCount: queuedTasks.length,
        isRetrying: true,
      },
    }));

    for (const queuedTask of queuedTasks) {
      try {
        await queuedTask.task();
        failedRemoteSyncTasks.delete(queuedTask.id);
      } catch (error) {
        failedRemoteSyncTasks.set(queuedTask.id, { ...queuedTask, error });
        console.error(`Failed to retry sync ${queuedTask.label}:`, error);
      }
    }

    const remainingTasks = [...failedRemoteSyncTasks.values()];
    if (remainingTasks.length === 0) {
      set({ remoteSyncError: null });
      return;
    }

    const latestFailedTask = remainingTasks[remainingTasks.length - 1];
    updateRemoteSyncError(latestFailedTask.label, latestFailedTask.error);
  };

  return {
    // --- State ---
    currentUser: GUEST_USER,
    isSyncing: false,
    authSession: null,
    remoteSyncError: null,

    // --- Actions ---
    runRemoteSync,

    retryFailedRemoteSync: async () => {
      await retryFailedRemoteSyncTasks();
    },

    clearRemoteSyncError: () => {
      clearRemoteSyncFailures();
    },

    setAuthSession: async (session) => {
      const previousState = get();
      const previousUser = previousState.currentUser;
      
      if (session) {
        const user = session.user;
        if (
          previousState.authSession?.user?.id === user.id &&
          previousState.authSession?.access_token === session.access_token &&
          previousUser.id === user.id
        ) {
          return;
        }

        const currentUser = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || '회원',
          email: user.email,
          isGuest: false
        };
        
        set({ authSession: session, currentUser });
        
        // If we transitioned from Guest to Logged-in, and have local data, migrate it!
        const hasLocalData = get().routines.length > 0 || get().workoutLogs.length > 0;
        if (previousUser.isGuest && hasLocalData) {
          console.log('Transitioning Guest -> Logged-in. Migrating local data...');
          await get().migrateLocalDataToSupabase(user.id);
        }
        
        // Hydrate data from server
        await get().fetchUserData();
      } else {
        if (!previousState.authSession && previousUser.isGuest) {
          return;
        }

        failedRemoteSyncTasks.clear();

        // Clear session and reset to guest defaults
        set({
          authSession: null,
          currentUser: GUEST_USER,
          exercises: DEFAULT_EXERCISES,
          routines: [],
          sessions: [],
          sessionExercises: [],
          workoutLogs: [],
          setRecords: [],
          remoteSyncError: null
        });
        await get().fetchPublicExercises();
      }
    },

    fetchUserData: async () => {
      const { currentUser, isSyncing } = get();
      if (currentUser.isGuest) return;
      if (isSyncing) return;
      
      set({ isSyncing: true });
      try {
        set(await workoutRepository.fetchUserWorkoutData(currentUser.id));
      } catch (error) {
        console.error('Failed to fetch user data from Supabase:', error);
      } finally {
        set({ isSyncing: false });
      }
    },

    migrateLocalDataToSupabase: async (authUserId) => {
      const { exercises, routines, sessions, sessionExercises, workoutLogs, setRecords } = get();
      
      try {
        set({ isSyncing: true });
        await workoutRepository.migrateLocalDataToSupabase({
          authUserId,
          exercises,
          routines,
          sessions,
          sessionExercises,
          workoutLogs,
          setRecords,
        });
        console.log('Successfully migrated guest data to Supabase!');
      } catch (err) {
        console.error('Migration failed:', err);
      } finally {
        set({ isSyncing: false });
      }
    },
  };
};
