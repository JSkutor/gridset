import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrateWorkoutPersistState } from './workoutPersistenceMigration.js';
import { createAuthSlice } from './slices/authSlice.js';
import { createExerciseSlice } from './slices/exerciseSlice.js';
import { createRoutineSlice } from './slices/routineSlice.js';
import { createWorkoutLogSlice } from './slices/workoutLogSlice.js';
import type { WorkoutStore } from './types.js';

export const useWorkoutStore = create<WorkoutStore>()(
  persist<WorkoutStore, [], [], Partial<WorkoutStore>>(
    (set, get, store) => ({
      ...createAuthSlice(set, get, store),
      ...createExerciseSlice(set, get, store),
      ...createRoutineSlice(set, get, store),
      ...createWorkoutLogSlice(set, get, store),
    }),
    {
      name: 'gridset-workout-v1',
      version: 1,
      migrate: migrateWorkoutPersistState,
      partialize: (state) => {
        const persistedState: Partial<WorkoutStore> = { ...state };
        delete persistedState.remoteSyncError;
        return persistedState;
      },
    }
  )
);

// hydration 완료 후, 데이터가 없는 새 게스트 유저에게만 demo 데이터를 async로 주입한다.
// exerciseDictionary (17k줄) + dummyGenerator는 이 시점에 처음 로드된다.
useWorkoutStore.persist.onFinishHydration((state) => {
  if (
    state.currentUser.isGuest &&
    !state.hasClearedDemoData &&
    state.routines.length === 0
  ) {
    void useWorkoutStore.getState().seedDemoData();
  }
});
