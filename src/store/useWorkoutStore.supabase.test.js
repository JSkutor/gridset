import { beforeEach, describe, test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { DEFAULT_EXERCISES } from '../data/dummyGenerator.js';

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('../utils/supabaseClient.js', () => ({
  supabase: {
    from: supabaseMock.from,
  },
}));

const { useWorkoutStore } = await import('./useWorkoutStore.js');

const guestUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: '게스트',
  isGuest: true,
};

const memberUser = {
  id: 'user-1',
  name: '회원',
  email: 'member@example.com',
  isGuest: false,
};

function resetStore() {
  window.localStorage.clear();
  useWorkoutStore.setState({
    currentUser: guestUser,
    exercises: DEFAULT_EXERCISES,
    routines: [],
    sessions: [],
    sessionExercises: [],
    workoutLogs: [],
    setRecords: [],
    isSyncing: false,
    authSession: null,
  });
}

beforeEach(() => {
  supabaseMock.from.mockReset();
  resetStore();
});

describe('Workout Store: Supabase exercise master sync', () => {
  test('fetchPublicExercises hydrates public DB rows into app exercise shape', async () => {
    const publicRows = [
      {
        id: 'public-cable-row',
        name: '케이블 로우 테스트',
        english_name: 'Cable Row Test',
        primary_muscle: '광배근',
        secondary_muscles: ['상완이두근'],
        equipment: '케이블',
        category: 'strength',
        unit: 'kg',
        is_unilateral: false,
        synonyms: ['케로'],
        user_id: null,
        created_at: '2026-05-29T00:00:00.000Z',
        updated_at: '2026-05-29T00:00:00.000Z',
      },
    ];

    const query = {
      select: vi.fn(() => query),
      is: vi.fn(() => query),
      order: vi.fn(async () => ({ data: publicRows, error: null })),
    };
    supabaseMock.from.mockReturnValue(query);

    await useWorkoutStore.getState().fetchPublicExercises();

    assert.equal(supabaseMock.from.mock.calls[0][0], 'exercises');
    assert.deepEqual(query.select.mock.calls[0], ['*']);
    assert.deepEqual(query.is.mock.calls[0], ['user_id', null]);
    assert.deepEqual(query.order.mock.calls[0], ['name', { ascending: true }]);

    const hydrated = useWorkoutStore
      .getState()
      .exercises
      .find((exercise) => exercise.id === 'public-cable-row');

    assert.equal(hydrated.englishName, 'Cable Row Test');
    assert.equal(hydrated.primary_muscle, '광배근');
    assert.deepEqual(hydrated.secondaryMuscles, ['상완이두근']);
  });

  test('syncExercisesForReferences uploads only custom exercises, not public master rows', async () => {
    const publicDefault = {
      ...DEFAULT_EXERCISES[0],
      user_id: null,
    };
    const publicDbExercise = {
      id: 'public-db-row',
      name: '공용 운동',
      primary_muscle: '대흉근',
      equipment: '맨몸',
      unit: 'reps',
      user_id: null,
    };
    const customExercise = {
      id: 'custom-row',
      name: '커스텀 로우',
      englishName: 'Custom Row',
      primary_muscle: '광배근',
      secondaryMuscles: ['상완이두근'],
      equipment: '덤벨',
      category: 'strength',
      unit: 'kg',
      is_unilateral: true,
      synonyms: ['커로'],
      user_id: memberUser.id,
      created_at: '2026-05-29T00:00:00.000Z',
      updated_at: '2026-05-29T00:00:00.000Z',
    };
    const upsert = vi.fn(async () => ({ data: null, error: null }));
    supabaseMock.from.mockReturnValue({ upsert });

    useWorkoutStore.setState({
      currentUser: memberUser,
      exercises: [publicDefault, publicDbExercise, customExercise],
    });

    await useWorkoutStore
      .getState()
      .syncExercisesForReferences(
        [publicDefault.id, publicDbExercise.id, customExercise.id],
        memberUser.id,
      );

    assert.equal(supabaseMock.from.mock.calls[0][0], 'exercises');
    assert.equal(upsert.mock.calls.length, 1);
    assert.deepEqual(upsert.mock.calls[0][0], [
      {
        id: 'custom-row',
        name: '커스텀 로우',
        english_name: 'Custom Row',
        primary_muscle: '광배근',
        secondary_muscles: ['상완이두근'],
        equipment: '덤벨',
        category: 'strength',
        unit: 'kg',
        is_unilateral: true,
        synonyms: ['커로'],
        user_id: memberUser.id,
        created_at: '2026-05-29T00:00:00.000Z',
        updated_at: '2026-05-29T00:00:00.000Z',
      },
    ]);
  });

  test('syncExercisesForReferences skips Supabase when every referenced exercise is public', async () => {
    useWorkoutStore.setState({
      currentUser: memberUser,
      exercises: DEFAULT_EXERCISES.map((exercise) => ({ ...exercise, user_id: null })),
    });

    await useWorkoutStore
      .getState()
      .syncExercisesForReferences([DEFAULT_EXERCISES[0].id, DEFAULT_EXERCISES[1].id], memberUser.id);

    assert.equal(supabaseMock.from.mock.calls.length, 0);
  });
});
