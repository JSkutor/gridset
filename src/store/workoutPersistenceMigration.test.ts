import { describe, expect, test } from 'vitest';
import { CATALOG_EXERCISE_BY_NAME } from '../api/supabaseWorkoutRepository.js';
import { migrateWorkoutPersistState } from './workoutPersistenceMigration.js';
import type { SessionExerciseGroup, SetRecord } from '../types/workout.js';

describe('workout persistence migration', () => {
  test('migrates legacy routine-based persisted state through current version', () => {
    const pushup = CATALOG_EXERCISE_BY_NAME.get('푸시업');
    if (!pushup) {
      throw new Error('푸시업 catalog exercise is required for this migration test.');
    }

    const migrated = migrateWorkoutPersistState({
      currentUser: {
        id: 'user-1',
        name: 'Tester',
        isGuest: false,
      },
      routines: [
        {
          id: 'legacy-routine-1',
          name: 'Legacy routine',
          user_id: 'user-1',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      routineExercises: [
        {
          id: 'legacy-link-1',
          routine_id: 'legacy-routine-1',
          exercise_id: 'legacy-pushup',
          order: 1,
          target_sets: 3,
          target_record: '10',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      exercises: [
        {
          id: 'legacy-pushup',
          name: '푸시업',
          primary_muscle: '가슴',
        },
      ],
      workoutLogs: [
        {
          id: 'legacy-log-1',
          user_id: 'user-1',
          routine_id: 'legacy-routine-1',
          start_time: '2026-01-01T00:00:00.000Z',
          end_time: null,
        },
      ],
      setRecords: [
        {
          id: 'legacy-record-1',
          workout_log_id: 'legacy-log-1',
          exercise_id: 'legacy-pushup',
          set_number: 1,
          weight: 0,
          record: '10',
          is_completed: true,
        },
      ],
      sessionExerciseGroups: [
        {
          id: 'legacy-group-1',
          session_id: 'legacy-routine-1',
          name: 'Legacy group',
          start_order: 1,
          size: 2,
        },
      ],
    }, 0);

    expect(migrated.routines).toHaveLength(1);
    expect(migrated.routines?.[0].name).toBe('이전 루틴');
    expect(migrated.sessions?.[0].id).toBe('legacy-routine-1');
    expect(migrated.sessions?.[0].routine_id).toBe(migrated.routines?.[0].id);
    expect(migrated.sessionExercises?.[0].session_id).toBe('legacy-routine-1');
    expect(migrated.workoutLogs?.[0].session_id).toBe('legacy-routine-1');
    expect(migrated.exercises?.[0].id).toBe(pushup.id);
    expect(migrated.exercises?.[0].primary_muscle).toBe('대흉근');
    expect(migrated.sessionExercises?.[0].exercise_id).toBe(pushup.id);

    const [record] = migrated.setRecords as Array<SetRecord & { is_completed?: unknown }>;
    expect(record.exercise_id).toBe(pushup.id);
    expect(record.side).toBe('both');
    expect('is_completed' in record).toBe(false);

    const [group] = migrated.sessionExerciseGroups as SessionExerciseGroup[];
    expect(group.color).toBe('#7aa2f7');
    expect(migrated.hasClearedDemoData).toBe(true);
  });

  test('accepts non-object persisted state at the hydrate boundary', () => {
    expect(migrateWorkoutPersistState(null, 11)).toEqual({});
  });
});
