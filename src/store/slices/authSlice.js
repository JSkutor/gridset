import * as workoutRepository from '../../api/supabaseWorkoutRepository.js';
import { DEFAULT_EXERCISES, createDummyWorkoutData } from '../../data/dummyGenerator.js';

export const GUEST_USER = { id: '00000000-0000-0000-0000-000000000000', name: '게스트', isGuest: true };

export const initialSeed = {
  ...createDummyWorkoutData({ userId: GUEST_USER.id, existingExercises: DEFAULT_EXERCISES }),
  hasClearedDemoData: false,
};

const createEmptyWorkoutState = ({ exercises = DEFAULT_EXERCISES, hasClearedDemoData = false } = {}) => ({
  exercises,
  routines: [],
  sessions: [],
  sessionExercises: [],
  sessionExerciseGroups: [],
  workoutLogs: [],
  setRecords: [],
  hasClearedDemoData,
});

const hasLocalWorkoutData = (state) => (
  state.routines.length > 0 ||
  state.sessions.length > 0 ||
  state.sessionExercises.length > 0 ||
  (state.sessionExerciseGroups || []).length > 0 ||
  state.workoutLogs.length > 0 ||
  state.setRecords.length > 0
);

const hasServerWorkoutData = (data, userId) => (
  data.routines.length > 0 ||
  data.sessions.length > 0 ||
  data.sessionExercises.length > 0 ||
  (data.sessionExerciseGroups || []).length > 0 ||
  data.workoutLogs.length > 0 ||
  data.setRecords.length > 0 ||
  data.exercises.some((exercise) => exercise.user_id === userId)
);

const createGuestDataSnapshot = (state) => ({
  exercises: state.exercises,
  routines: state.routines,
  sessions: state.sessions,
  sessionExercises: state.sessionExercises,
  sessionExerciseGroups: state.sessionExerciseGroups,
  workoutLogs: state.workoutLogs,
  setRecords: state.setRecords,
  hasClearedDemoData: state.hasClearedDemoData,
});

export const createAuthSlice = (set, get) => {
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
    hasClearedDemoData: initialSeed.hasClearedDemoData,

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
      const guestDataSnapshot = previousUser.isGuest ? createGuestDataSnapshot(previousState) : null;
      
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
        
        if (previousUser.isGuest) {
          set({
            authSession: session,
            currentUser,
            ...createEmptyWorkoutState(),
          });
          set({ isSyncing: true });
          try {
            const serverData = await workoutRepository.fetchUserWorkoutData(user.id);
            const shouldUploadGuestData = (
              guestDataSnapshot.hasClearedDemoData &&
              hasLocalWorkoutData(guestDataSnapshot) &&
              !hasServerWorkoutData(serverData, user.id)
            );

            if (shouldUploadGuestData) {
              console.log('Server is empty. Migrating guest local data...');
              await workoutRepository.migrateLocalDataToSupabase({
                authUserId: user.id,
                ...guestDataSnapshot,
              });
              set({
                ...(await workoutRepository.fetchUserWorkoutData(user.id)),
                hasClearedDemoData: false,
              });
            } else {
              set({ ...serverData, hasClearedDemoData: false });
            }
          } catch (error) {
            console.error('Failed to fetch user data from Supabase:', error);
          } finally {
            set({ isSyncing: false });
          }
          return;
        }

        set({ authSession: session, currentUser });
        
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
          remoteSyncError: null,
          ...createEmptyWorkoutState(),
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

    discardGuestLocalDataForSignUp: () => {
      const { currentUser } = get();
      if (!currentUser.isGuest) return;

      set(createEmptyWorkoutState({ hasClearedDemoData: true }));
    },
  };
};
