import { generateUUID } from "../../data/exerciseUtils.js";
import * as workoutRepository from "../../api/supabaseWorkoutRepository.js";
import { initialSeed } from "./authSlice.js";
import type { Id, SetRecord, SetSide, WorkoutLog } from "../../types/workout.js";
import type {
  SetRecordUpdate,
  StoreSlice,
  WorkoutDataState,
  WorkoutLogBlockDraft,
  WorkoutLogSlice,
} from "../types.js";

type WorkoutLogStoreState = Pick<
  WorkoutDataState,
  "workoutLogs" | "setRecords"
> &
  WorkoutLogSlice;

const parseNonNegativeWeight = (
  weight: string | number | null | undefined,
): number => {
  const parsedWeight = Number.parseFloat(String(weight ?? ""));
  return Number.isFinite(parsedWeight) ? Math.max(0, parsedWeight) : 0;
};

const sanitizeRecord = (record: string | number | null | undefined): string =>
  String(record || "0").trim().slice(0, 50) || "0";

const sanitizeMemo = (memo: string | null | undefined): string | null =>
  memo && typeof memo === "string" ? memo.trim().slice(0, 1000) || null : null;

export const createWorkoutLogSlice: StoreSlice<WorkoutLogStoreState> = (
  set,
  get,
) => ({
  // --- State ---
  workoutLogs: initialSeed.workoutLogs,
  setRecords: initialSeed.setRecords,

  // --- Actions ---
  startWorkoutLog: (session_id: Id): WorkoutLog => {
    if (!session_id) {
      throw new Error("session_id is required to start a workout log.");
    }
    const { currentUser } = get();
    const newLog: WorkoutLog = {
      id: generateUUID(),
      user_id: currentUser.id,
      session_id,
      start_time: new Date().toISOString(),
      end_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ workoutLogs: [...state.workoutLogs, newLog] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "startWorkoutLog",
        () => workoutRepository.upsertRows("workout_logs", [newLog]),
        {
          dedupKey: "workout_log:" + newLog.id,
        },
      );
    }

    return newLog;
  },

  finishWorkoutLog: (id: Id) => {
    const { currentUser } = get();
    const endTime = new Date().toISOString();

    set((state) => ({
      workoutLogs: state.workoutLogs.map((log) =>
        log.id === id
          ? { ...log, end_time: endTime, updated_at: endTime }
          : log,
      ),
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "finishWorkoutLog",
        () =>
          workoutRepository.updateRow("workout_logs", id, {
            end_time: endTime,
            updated_at: endTime,
          }),
        { dedupKey: "workout_log:" + id },
      );
    }
  },

  deleteWorkoutLog: (id: Id) => {
    const { currentUser } = get();

    set((state) => ({
      workoutLogs: state.workoutLogs.filter((log) => log.id !== id),
      setRecords: state.setRecords.filter((sr) => sr.workout_log_id !== id),
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "deleteWorkoutLog",
        () => workoutRepository.deleteRow("workout_logs", id),
        {
          dedupKey: "workout_log:" + id,
        },
      );
    }
  },

  saveWorkoutLog: (
    session_id: Id,
    blocks: WorkoutLogBlockDraft[],
    start_time?: string,
  ): WorkoutLog => {
    if (!session_id) {
      throw new Error("session_id is required to save a workout log.");
    }
    const { currentUser } = get();
    const logId = generateUUID();
    const endTime = new Date().toISOString();
    const actualStartTime = start_time || new Date().toISOString();

    const newLog: WorkoutLog = {
      id: logId,
      user_id: currentUser.id,
      session_id,
      start_time: actualStartTime,
      end_time: endTime,
      created_at: actualStartTime,
      updated_at: endTime,
    };

    const newSetRecords: SetRecord[] = [];
    blocks.forEach((block) => {
      block.sets.forEach((set) => {
        const hasReps = String(set.reps ?? "").trim() !== "";
        if (hasReps) {
          newSetRecords.push({
            id: generateUUID(),
            workout_log_id: logId,
            exercise_id: set.exercise_id || block.exercise_id,
            set_number: set.set_number,
            weight: parseNonNegativeWeight(set.weight),
            record: sanitizeRecord(set.reps),
            side: set.side || "both",
            memo: sanitizeMemo(set.memo),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });
    });

    set((state) => ({
      workoutLogs: [...state.workoutLogs, newLog],
      setRecords: [...state.setRecords, ...newSetRecords],
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync("saveWorkoutLog", async () => {
        await get().syncExercisesForReferences(
          newSetRecords.map((record) => record.exercise_id),
          currentUser.id,
        );
        await workoutRepository.upsertRows("workout_logs", [newLog]);
        await workoutRepository.upsertRows("set_records", newSetRecords);
      });
    }

    return newLog;
  },

  addSetRecord: (
    workout_log_id: Id,
    exercise_id: Id,
    set_number: number,
    weight: string | number,
    record: string | number,
    side: SetSide = "both",
    memo: string | null = null,
  ): SetRecord => {
    const { currentUser } = get();
    const newSetRecord: SetRecord = {
      id: generateUUID(),
      workout_log_id,
      exercise_id,
      set_number,
      weight: parseNonNegativeWeight(weight),
      record: sanitizeRecord(record),
      side,
      memo: sanitizeMemo(memo),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ setRecords: [...state.setRecords, newSetRecord] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "addSetRecord",
        async () => {
          await get().syncExercisesForReferences([exercise_id], currentUser.id);
          await workoutRepository.upsertRows("set_records", [newSetRecord]);
        },
        { dedupKey: "set_record:" + newSetRecord.id },
      );
    }

    return newSetRecord;
  },

  updateSetRecord: (id: Id, updates: SetRecordUpdate) => {
    const { currentUser } = get();
    const updatedAt = new Date().toISOString();

    const cleanUpdates = { ...updates };
    if ("weight" in cleanUpdates) {
      cleanUpdates.weight = parseNonNegativeWeight(cleanUpdates.weight);
    }
    if ("record" in cleanUpdates) {
      cleanUpdates.record = sanitizeRecord(cleanUpdates.record);
    }
    if ("memo" in cleanUpdates) {
      cleanUpdates.memo = sanitizeMemo(cleanUpdates.memo);
    }

    set((state) => ({
      setRecords: state.setRecords.map((sr) =>
        sr.id === id ? { ...sr, ...cleanUpdates, updated_at: updatedAt } : sr,
      ),
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "updateSetRecord",
        () =>
          workoutRepository.updateRow("set_records", id, {
            ...cleanUpdates,
            updated_at: updatedAt,
          }),
        { dedupKey: "set_record:" + id },
      );
    }
  },

  deleteSetRecord: (id: Id) => {
    const { currentUser } = get();
    set((state) => ({
      setRecords: state.setRecords.filter((sr) => sr.id !== id),
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync(
        "deleteSetRecord",
        () => workoutRepository.deleteRow("set_records", id),
        {
          dedupKey: "set_record:" + id,
        },
      );
    }
  },

  clearAllData: () => {
    const { exercises, currentUser } = get();
    set({
      exercises,
      routines: [],
      sessions: [],
      sessionExercises: [],
      sessionExerciseGroups: [],
      workoutLogs: [],
      setRecords: [],
      hasClearedDemoData: currentUser.isGuest ? true : false,
    });

    if (!currentUser.isGuest) {
      const userId = currentUser.id;
      get().runRemoteSync("clearAllData", () =>
        workoutRepository.clearUserWorkoutData(userId),
      );
    }
  },

  generateDummyData: async () => {
    const { currentUser, exercises } = get();
    if (!currentUser.isGuest) return;

    const { createDummyWorkoutData, EXERCISE_CATALOG } = await import(
      
      "../../data/dummyGenerator.js"
    );
    const seedData = createDummyWorkoutData({
      userId: currentUser?.id || "00000000-0000-0000-0000-000000000000",
      existingExercises: (exercises.length > 0
        ? exercises
        : EXERCISE_CATALOG) as unknown as typeof EXERCISE_CATALOG,
    }) as unknown as WorkoutDataState;

    set({ ...seedData, hasClearedDemoData: false });
  },

  // --- Selectors ---
  isRoutineReadOnly: (routineId: Id | null | undefined) => {
    const { routines } = get();
    if (!routineId || routines.length === 0) return false;

    const sortedRoutines = [...routines].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return routineId !== sortedRoutines[0]?.id;
  },
});
