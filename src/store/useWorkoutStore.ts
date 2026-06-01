import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrateWorkoutPersistState } from './workoutPersistenceMigration.js';
import { createAuthSlice } from './slices/authSlice.js';
import { createExerciseSlice } from './slices/exerciseSlice.js';
import { createRoutineSlice } from './slices/routineSlice.js';
import { createWorkoutLogSlice } from './slices/workoutLogSlice.js';
import type {
  WorkoutDataState,
  WorkoutLogSlice,
  WorkoutStore,
} from './types.js';

type WorkoutLogStoreSlice = Pick<
  WorkoutDataState,
  'workoutLogs' | 'setRecords'
> &
  WorkoutLogSlice;

export const useWorkoutStore = create<WorkoutStore>()(
  persist<WorkoutStore, [], [], Partial<WorkoutStore>>(
    (set, get, store) => ({
      ...createAuthSlice(set, get, store),
      ...createExerciseSlice(set, get, store),
      ...createRoutineSlice(set, get, store),
      ...(createWorkoutLogSlice(set, get) as WorkoutLogStoreSlice),
    }),
    {
      name: 'workout-tracker-storage',
      version: 11,
      migrate: migrateWorkoutPersistState,
      partialize: (state) => {
        const persistedState: Partial<WorkoutStore> = { ...state };
        delete persistedState.remoteSyncError;
        return persistedState;
      },
    }
  )
);
