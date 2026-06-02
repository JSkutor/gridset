import { describe, expect, test } from 'vitest';
import { migrateWorkoutPersistState } from './workoutPersistenceMigration.js';

describe('workout persistence migration', () => {
  test('passes through a persisted object', () => {
    const persisted = {
      currentUser: { id: 'user-1', name: 'Tester', isGuest: true },
      exercises: [],
      hasClearedDemoData: true,
    };

    expect(migrateWorkoutPersistState(persisted, 1)).toEqual(persisted);
  });

  test('returns an empty object for non-object persisted state', () => {
    expect(migrateWorkoutPersistState(null, 0)).toEqual({});
    expect(migrateWorkoutPersistState(undefined, 1)).toEqual({});
  });
});
