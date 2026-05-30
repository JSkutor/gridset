import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrateWorkoutPersistState } from './workoutPersistenceMigration.js';
import { createAuthSlice } from './slices/authSlice.js';
import { createExerciseSlice } from './slices/exerciseSlice.js';
import { createRoutineSlice } from './slices/routineSlice.js';
import { createWorkoutLogSlice } from './slices/workoutLogSlice.js';

export const useWorkoutStore = create(
  persist(
    (set, get, store) => ({
      ...createAuthSlice(set, get, store),
      ...createExerciseSlice(set, get, store),
      ...createRoutineSlice(set, get, store),
      ...createWorkoutLogSlice(set, get, store),
    }),
    {
      name: 'workout-tracker-storage',
      version: 11,
      migrate: migrateWorkoutPersistState,
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => key !== 'remoteSyncError'),
      ),
    }
  )
);
