import * as workoutRepository from "../../api/supabaseWorkoutRepository.js";
import {
  EXERCISE_CATALOG,
  createDummyWorkoutData,
} from "../../data/dummyGenerator.js";

export const GUEST_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "게스트",
  isGuest: true,
};

export const initialSeed = {
  ...createDummyWorkoutData({
    userId: GUEST_USER.id,
    existingExercises: EXERCISE_CATALOG,
  }),
  hasClearedDemoData: false,
};

const createEmptyWorkoutState = ({
  exercises = EXERCISE_CATALOG,
  hasClearedDemoData = false,
} = {}) => ({
  exercises,
  routines: [],
  sessions: [],
  sessionExercises: [],
  sessionExerciseGroups: [],
  workoutLogs: [],
  setRecords: [],
  hasClearedDemoData,
});

const hasLocalWorkoutData = (state) =>
  state.routines.length > 0 ||
  state.sessions.length > 0 ||
  state.sessionExercises.length > 0 ||
  (state.sessionExerciseGroups || []).length > 0 ||
  state.workoutLogs.length > 0 ||
  state.setRecords.length > 0;

const hasServerWorkoutData = (data, userId) =>
  data.routines.length > 0 ||
  data.sessions.length > 0 ||
  data.sessionExercises.length > 0 ||
  (data.sessionExerciseGroups || []).length > 0 ||
  data.workoutLogs.length > 0 ||
  data.setRecords.length > 0 ||
  data.exercises.some((exercise) => exercise.user_id === userId);

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
  const inFlightRemoteSyncByDedupKey = new Map();
  let remoteSyncTaskId = 0;

  // 최대 보관할 실패 작업 수
  const MAX_FAILED_TASKS = 50;
  // 작업당 최대 재시도 횟수 (초과 시 자동 폐기)
  const MAX_RETRIES_PER_TASK = 3;
  // 작업 자동 폐기 시간 (5분 이상 지난 작업은 제거)
  const TASK_TTL_MS = 5 * 60 * 1000;

  const getRemoteSyncErrorMessage = (error) => {
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }
    return "원격 동기화 중 문제가 발생했습니다.";
  };

  // 재시도 불가능한 에러인지 판단 (클라이언트 에러 = 재시도 무의미)
  const isNonRetryableError = (error) => {
    if (error?.status && error.status >= 400 && error.status < 500) {
      // 409 Conflict / 404 Not Found / 401 Unauthorized 등은
      // 재시도해도 성공할 가능성이 낮음
      return error.status !== 429 && error.status !== 408;
    }
    // Supabase 에러 코드 체크
    if (error?.code) {
      const nonRetryableCodes = ["23505", "PGRST116", "401", "403", "404"];
      return nonRetryableCodes.includes(String(error.code));
    }
    return false;
  };

  // 오래된 작업 및 최대 개수 초과 작업 정리
  const cleanupStaleTasks = () => {
    const now = Date.now();
    let removedCount = 0;

    for (const [id, task] of failedRemoteSyncTasks) {
      const taskTime = task.createdAt || 0;
      if (now - taskTime > TASK_TTL_MS) {
        failedRemoteSyncTasks.delete(id);
        removedCount++;
      }
    }

    // 최대 개수 초과 시 오래된 순으로 제거
    if (failedRemoteSyncTasks.size > MAX_FAILED_TASKS) {
      const entries = [...failedRemoteSyncTasks.entries()].sort(
        (a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0),
      );
      const toDelete = entries.slice(
        0,
        failedRemoteSyncTasks.size - MAX_FAILED_TASKS,
      );
      for (const [id] of toDelete) {
        failedRemoteSyncTasks.delete(id);
        removedCount++;
      }
    }

    return removedCount;
  };

  const updateRemoteSyncError = (label, error, overrides = {}) => {
    cleanupStaleTasks();
    const pendingCount = failedRemoteSyncTasks.size;
    if (pendingCount === 0) {
      set({ remoteSyncError: null });
      return;
    }
    set({
      remoteSyncError: {
        label,
        message: getRemoteSyncErrorMessage(error),
        failedAt: new Date().toISOString(),
        pendingCount,
        isRetrying: false,
        ...overrides,
      },
    });
  };

  const clearRemoteSyncFailures = () => {
    failedRemoteSyncTasks.clear();
    set({ remoteSyncError: null });
  };

  /**
   * 원격 동기화 작업을 등록합니다.
   *
   * @param {string} label  작업 설명 (로깅용)
   * @param {() => Promise} task  Supabase API 호출 함수
   * @param {object} [options]
   * @param {string} [options.dedupKey]  중복 제거 키.
   *        같은 키로 이미 실패한 작업이 있으면 교체합니다.
   *        예: 'updateSetRecord:xxx-xxx' — 같은 레코드 업데이트는 최신만 유지
   */
  const runRemoteSync = (label, task, options = {}) => {
    const { dedupKey } = options;

    // 중복 키가 있으면 이전 실패 작업을 제거 (최신 작업으로 대체)
    if (dedupKey) {
      for (const [id, t] of failedRemoteSyncTasks) {
        if (t.dedupKey === dedupKey) {
          failedRemoteSyncTasks.delete(id);
          break;
        }
      }
      // 교체 후 대기 중인 실패 작업이 없으면 에러 배너를 즉시 해제
      if (failedRemoteSyncTasks.size === 0) {
        set({ remoteSyncError: null });
      }
    }

    const id = `remote-sync-${Date.now()}-${remoteSyncTaskId++}`;
    const createdAt = Date.now();

    const executeTask = async () => {
      try {
        await task();
      } catch (error) {
        // 재시도 불가능한 에러면 아예 저장하지 않음
        if (isNonRetryableError(error)) {
          console.warn(
            `[Sync] ${label} — 재시도 불가능한 에러, 저장 안 함:`,
            error.message || error,
          );
          return;
        }

        failedRemoteSyncTasks.set(id, {
          id,
          label,
          task,
          error,
          dedupKey,
          createdAt,
          retryCount: 0,
        });
        updateRemoteSyncError(label, error);

        // 최대 개수 초과 시 자동 정리
        cleanupStaleTasks();

        console.error(
          `[Sync] ${label} 실패 (대기: ${failedRemoteSyncTasks.size}개):`,
          error.message || error,
        );
      }
    };

    // 같은 dedupKey의 작업은 순서를 보장해 실행한다.
    // (예: 생성 upsert 직후 취소 delete가 오면 delete가 항상 나중에 실행되어 서버 상태가 정합해짐)
    if (dedupKey) {
      const previous = inFlightRemoteSyncByDedupKey.get(dedupKey) || Promise.resolve();
      const chained = previous
        .catch(() => {})
        .then(() => executeTask())
        .finally(() => {
          if (inFlightRemoteSyncByDedupKey.get(dedupKey) === chained) {
            inFlightRemoteSyncByDedupKey.delete(dedupKey);
          }
        });

      inFlightRemoteSyncByDedupKey.set(dedupKey, chained);
      return;
    }

    void executeTask();
  };

  const retryFailedRemoteSyncTasks = async () => {
    // 오래된 작업 먼저 정리
    cleanupStaleTasks();

    const queuedTasks = [...failedRemoteSyncTasks.values()];
    if (queuedTasks.length === 0) {
      set({ remoteSyncError: null });
      return;
    }

    const firstTask = queuedTasks[0];
    set((state) => ({
      remoteSyncError: {
        label: state.remoteSyncError?.label || firstTask.label,
        message: "원격 동기화를 다시 시도하고 있습니다.",
        failedAt: state.remoteSyncError?.failedAt || new Date().toISOString(),
        pendingCount: queuedTasks.length,
        isRetrying: true,
      },
    }));

    let successCount = 0;
    let discardedCount = 0;

    for (const queuedTask of queuedTasks) {
      // 최대 재시도 횟수 초과 시 폐기
      if (queuedTask.retryCount >= MAX_RETRIES_PER_TASK) {
        failedRemoteSyncTasks.delete(queuedTask.id);
        discardedCount++;
        console.warn(
          `[Sync] ${queuedTask.label} — 재시도 ${MAX_RETRIES_PER_TASK}회 초과, 폐기`,
        );
        continue;
      }

      try {
        await queuedTask.task();
        failedRemoteSyncTasks.delete(queuedTask.id);
        successCount++;
      } catch (error) {
        // 재시도 불가능한 에러면 바로 폐기
        if (isNonRetryableError(error)) {
          failedRemoteSyncTasks.delete(queuedTask.id);
          discardedCount++;
          console.warn(
            `[Sync] ${queuedTask.label} — 재시도 불가능 에러, 폐기:`,
            error.message || error,
          );
        } else {
          // 재시도 가능 — 횟수 증가 후 다시 저장
          failedRemoteSyncTasks.set(queuedTask.id, {
            ...queuedTask,
            error,
            retryCount: queuedTask.retryCount + 1,
          });
          console.error(
            `[Sync] 재시도 실패 ${queuedTask.label} (${queuedTask.retryCount + 1}/${MAX_RETRIES_PER_TASK}):`,
            error.message || error,
          );
        }
      }
    }

    const remainingTasks = [...failedRemoteSyncTasks.values()];
    if (remainingTasks.length === 0) {
      console.log(
        `[Sync] 재시도 완료 — ${successCount}개 성공, ${discardedCount}개 폐기`,
      );
      set({ remoteSyncError: null });
      return;
    }

    const latestFailedTask = remainingTasks[remainingTasks.length - 1];
    console.warn(
      `[Sync] 재시도 완료 — ${successCount}개 성공, ${discardedCount}개 폐기, ${remainingTasks.length}개 잔여`,
    );
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

    setAuthSession: async (session, event) => {
      const previousState = get();
      const previousUser = previousState.currentUser;
      const guestDataSnapshot = previousUser.isGuest
        ? createGuestDataSnapshot(previousState)
        : null;

      if (session) {
        const user = session.user;

        // 완전히 동일한 세션이면 무시
        if (
          previousState.authSession?.user?.id === user.id &&
          previousState.authSession?.access_token === session.access_token &&
          previousUser.id === user.id
        ) {
          return;
        }

        const currentUser = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "회원",
          email: user.email,
          isGuest: false,
        };

        // 이미 동일 유저로 인증된 상태에서 토큰만 갱신된 경우
        // (TOKEN_REFRESHED, USER_UPDATED 등) — 데이터 재조회 없이 세션만 교체
        const isTokenOnlyRefresh =
          !previousUser.isGuest &&
          previousState.authSession?.user?.id === user.id &&
          (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED');
        if (isTokenOnlyRefresh) {
          set({ authSession: session, currentUser });
          return;
        }

        if (previousUser.isGuest) {
          set({
            authSession: session,
            currentUser,
            ...createEmptyWorkoutState(),
          });
          set({ isSyncing: true });
          try {
            const serverData = await workoutRepository.fetchUserWorkoutData(
              user.id,
            );
            const shouldUploadGuestData =
              guestDataSnapshot.hasClearedDemoData &&
              hasLocalWorkoutData(guestDataSnapshot) &&
              !hasServerWorkoutData(serverData, user.id);

            if (shouldUploadGuestData) {
              console.log("Server is empty. Migrating guest local data...");
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
            console.error("Failed to fetch user data from Supabase:", error);
          } finally {
            set({ isSyncing: false });
          }
          return;
        }

        set({ authSession: session, currentUser });

        // Hydrate data from server (최초 로그인 시)
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
        console.error("Failed to fetch user data from Supabase:", error);
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
