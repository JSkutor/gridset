import { DEFAULT_EXERCISES, createDummyWorkoutData, generateUUID } from '../../data/dummyGenerator.js';
import * as workoutRepository from '../../api/supabaseWorkoutRepository.js';
import { initialSeed } from './authSlice.js';

export const createWorkoutLogSlice = (set, get) => ({
  // --- State ---
  workoutLogs: initialSeed.workoutLogs,
  setRecords: initialSeed.setRecords,

  // --- Actions ---
  startWorkoutLog: (session_id) => {
    if (!session_id) {
      throw new Error('session_id is required to start a workout log.');
    }
    const { currentUser } = get();
    const newLog = {
      id: generateUUID(),
      user_id: currentUser.id,
      session_id,
      start_time: new Date().toISOString(),
      end_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    set((state) => ({ workoutLogs: [...state.workoutLogs, newLog] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('startWorkoutLog', () => workoutRepository.upsertRows('workout_logs', [newLog]));
    }

    return newLog;
  },

  finishWorkoutLog: (id) => {
    const { currentUser } = get();
    const endTime = new Date().toISOString();
    
    set((state) => ({
      workoutLogs: state.workoutLogs.map(log => 
        log.id === id ? { ...log, end_time: endTime, updated_at: endTime } : log
      )
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('finishWorkoutLog', () =>
        workoutRepository.updateRow('workout_logs', id, { end_time: endTime, updated_at: endTime }),
      );
    }
  },

  deleteWorkoutLog: (id) => {
    const { currentUser } = get();
    
    set((state) => ({
      workoutLogs: state.workoutLogs.filter(log => log.id !== id),
      setRecords: state.setRecords.filter(sr => sr.workout_log_id !== id) 
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('deleteWorkoutLog', () => workoutRepository.deleteRow('workout_logs', id));
    }
  },

  saveWorkoutLog: (session_id, blocks, start_time) => {
    if (!session_id) {
      throw new Error('session_id is required to save a workout log.');
    }
    const { currentUser } = get();
    const logId = generateUUID();
    const endTime = new Date().toISOString();
    const actualStartTime = start_time || new Date().toISOString();

    const newLog = {
      id: logId,
      user_id: currentUser.id,
      session_id,
      start_time: actualStartTime,
      end_time: endTime,
      created_at: actualStartTime,
      updated_at: endTime
    };

    const newSetRecords = [];
    blocks.forEach((block) => {
      block.sets.forEach((set) => {
        const hasReps = String(set.reps ?? '').trim() !== '';
        if (hasReps) {
          const parsedWeight = parseFloat(set.weight);
          const safeWeight = isFinite(parsedWeight) ? Math.max(0, parsedWeight) : 0;
          const safeRecord = String(set.reps || '0').trim().slice(0, 50) || '0';
          const safeMemo = set.memo && typeof set.memo === 'string' ? set.memo.trim().slice(0, 1000) || null : null;

          newSetRecords.push({
            id: generateUUID(),
            workout_log_id: logId,
            exercise_id: set.exercise_id || block.exercise_id,
            set_number: set.set_number,
            weight: safeWeight,
            record: safeRecord,
            side: set.side || 'both',
            memo: safeMemo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });

    set((state) => ({
      workoutLogs: [...state.workoutLogs, newLog],
      setRecords: [...state.setRecords, ...newSetRecords]
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('saveWorkoutLog', async () => {
        await get().syncExercisesForReferences(newSetRecords.map(record => record.exercise_id), currentUser.id);
        await workoutRepository.upsertRows('workout_logs', [newLog]);
        await workoutRepository.upsertRows('set_records', newSetRecords);
      });
    }

    return newLog;
  },

  addSetRecord: (workout_log_id, exercise_id, set_number, weight, record, side = 'both', memo = null) => {
    const { currentUser } = get();
    const parsedWeight = parseFloat(weight);
    const safeWeight = isFinite(parsedWeight) ? Math.max(0, parsedWeight) : 0;
    const safeRecord = String(record || '0').trim().slice(0, 50) || '0';
    const safeMemo = memo && typeof memo === 'string' ? memo.trim().slice(0, 1000) || null : null;

    const newSetRecord = {
      id: generateUUID(),
      workout_log_id,
      exercise_id,
      set_number,
      weight: safeWeight,
      record: safeRecord,
      side,
      memo: safeMemo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    set((state) => ({ setRecords: [...state.setRecords, newSetRecord] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('addSetRecord', async () => {
        await get().syncExercisesForReferences([exercise_id], currentUser.id);
        await workoutRepository.upsertRows('set_records', [newSetRecord]);
      });
    }

    return newSetRecord;
  },

  updateSetRecord: (id, updates) => {
    const { currentUser } = get();
    const updatedAt = new Date().toISOString();
    
    const cleanUpdates = { ...updates };
    if ('weight' in cleanUpdates) {
      const parsedWeight = parseFloat(cleanUpdates.weight);
      cleanUpdates.weight = isFinite(parsedWeight) ? Math.max(0, parsedWeight) : 0;
    }
    if ('record' in cleanUpdates) {
      cleanUpdates.record = String(cleanUpdates.record || '0').trim().slice(0, 50) || '0';
    }
    if ('memo' in cleanUpdates) {
      cleanUpdates.memo = cleanUpdates.memo && typeof cleanUpdates.memo === 'string'
        ? cleanUpdates.memo.trim().slice(0, 1000) || null
        : null;
    }

    set((state) => ({
      setRecords: state.setRecords.map(sr => 
        sr.id === id ? { ...sr, ...cleanUpdates, updated_at: updatedAt } : sr
      )
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('updateSetRecord', () =>
        workoutRepository.updateRow('set_records', id, { ...cleanUpdates, updated_at: updatedAt }),
      );
    }
  },

  deleteSetRecord: (id) => {
    const { currentUser } = get();
    set((state) => ({
      setRecords: state.setRecords.filter(sr => sr.id !== id)
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('deleteSetRecord', () => workoutRepository.deleteRow('set_records', id));
    }
  },

  clearAllData: () => {
    const { exercises, currentUser } = get();
    set({
      exercises: currentUser.isGuest ? DEFAULT_EXERCISES : (exercises.length > 0 ? exercises : DEFAULT_EXERCISES),
      routines: [],
      sessions: [],
      sessionExercises: [],
      sessionExerciseGroups: [],
      workoutLogs: [],
      setRecords: [],
      hasClearedDemoData: currentUser.isGuest ? true : false
    });

    if (!currentUser.isGuest) {
      const userId = currentUser.id;
      get().runRemoteSync('clearAllData', () => workoutRepository.clearUserWorkoutData(userId));
    }
  },

  generateDummyData: () => {
    const { currentUser, exercises } = get();
    if (!currentUser.isGuest) return;

    const seedData = createDummyWorkoutData({
      userId: currentUser?.id || '00000000-0000-0000-0000-000000000000',
      existingExercises: exercises,
    });

    set({ ...seedData, hasClearedDemoData: false });
  },

  // --- Selectors ---
  isRoutineReadOnly: (routineId) => {
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
