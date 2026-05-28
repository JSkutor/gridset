import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SESSIONS_PER_ROUTINE } from '../utils/sessionHelper.js';

function createMemoryStorage() {
  const entries = new Map();

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
    clear: () => entries.clear(),
  };
}

globalThis.localStorage = createMemoryStorage();
globalThis.window = { localStorage: globalThis.localStorage };

const { useWorkoutStore } = await import('./useWorkoutStore.js');

const guestUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: '게스트',
  isGuest: true,
};

beforeEach(() => {
  globalThis.localStorage.clear();
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

test('addExercise prevents case-insensitive duplicates', () => {
  const first = useWorkoutStore.getState().addExercise('테스트 컬', '이두', '덤벨');
  const second = useWorkoutStore.getState().addExercise('테스트 컬', '어깨', '바벨');

  assert.equal(second.id, first.id);
  assert.equal(useWorkoutStore.getState().exercises.filter((exercise) => exercise.name === '테스트 컬').length, 1);
});

test('routines, sessions, and session exercises keep template defaults', () => {
  const routine = useWorkoutStore.getState().addRoutine('PPL');
  const push = useWorkoutStore.getState().addSession(routine.id, 'Push');
  const pull = useWorkoutStore.getState().addSession(routine.id, 'Pull');
  const bench = useWorkoutStore.getState().exercises.find((exercise) => exercise.name === '벤치프레스');
  const link = useWorkoutStore.getState().addSessionExercise(push.id, bench.id, 1, 4, '8');

  assert.deepEqual(
    useWorkoutStore.getState().sessions.map(({ id, session_order }) => ({ id, session_order })),
    [
      { id: push.id, session_order: 1 },
      { id: pull.id, session_order: 2 },
    ],
  );
  assert.equal(link.rest_between_sets, 90);
  assert.equal(link.rest_after_exercise, 120);
});

test('addSession caps each routine at seven sessions', () => {
  const routine = useWorkoutStore.getState().addRoutine('Capped');
  const created = Array.from({ length: MAX_SESSIONS_PER_ROUTINE }, (_, index) =>
    useWorkoutStore.getState().addSession(routine.id, `Day ${index + 1}`),
  );
  const overflow = useWorkoutStore.getState().addSession(routine.id, 'Overflow');

  assert.equal(created.every(Boolean), true);
  assert.equal(overflow, null);
  assert.equal(
    useWorkoutStore.getState().sessions.filter((session) => session.routine_id === routine.id).length,
    MAX_SESSIONS_PER_ROUTINE,
  );
});

test('deleteSession cascades links and compacts sibling order', () => {
  const routine = useWorkoutStore.getState().addRoutine('Upper Lower');
  const upper = useWorkoutStore.getState().addSession(routine.id, 'Upper');
  const lower = useWorkoutStore.getState().addSession(routine.id, 'Lower');
  const extra = useWorkoutStore.getState().addSession(routine.id, 'Extra');
  const bench = useWorkoutStore.getState().exercises.find((exercise) => exercise.name === '벤치프레스');

  useWorkoutStore.getState().addSessionExercise(lower.id, bench.id, 1, 3, '10');
  useWorkoutStore.getState().deleteSession(lower.id);

  assert.deepEqual(
    useWorkoutStore.getState().sessions.map(({ id, session_order }) => ({ id, session_order })),
    [
      { id: upper.id, session_order: 1 },
      { id: extra.id, session_order: 2 },
    ],
  );
  assert.equal(useWorkoutStore.getState().sessionExercises.some((link) => link.session_id === lower.id), false);
});

test('deleteSessionExercise compacts remaining exercise order inside a session', () => {
  const routine = useWorkoutStore.getState().addRoutine('Strength');
  const session = useWorkoutStore.getState().addSession(routine.id, 'A');
  const [bench, squat, deadlift] = ['벤치프레스', '스쿼트', '데드리프트'].map((name) =>
    useWorkoutStore.getState().exercises.find((exercise) => exercise.name === name),
  );
  const first = useWorkoutStore.getState().addSessionExercise(session.id, bench.id, 1, 3, '10');
  const second = useWorkoutStore.getState().addSessionExercise(session.id, squat.id, 2, 3, '10');
  const third = useWorkoutStore.getState().addSessionExercise(session.id, deadlift.id, 3, 3, '10');

  useWorkoutStore.getState().deleteSessionExercise(first.id);

  assert.deepEqual(
    useWorkoutStore.getState().sessionExercises.map(({ id, order }) => ({ id, order })),
    [
      { id: second.id, order: 1 },
      { id: third.id, order: 2 },
    ],
  );
});

test('duplicateRoutine copies sessions and exercise targets with new IDs', () => {
  const routine = useWorkoutStore.getState().addRoutine('Base');
  const session = useWorkoutStore.getState().addSession(routine.id, 'Day A');
  const bench = useWorkoutStore.getState().exercises.find((exercise) => exercise.name === '벤치프레스');
  const link = useWorkoutStore.getState().addSessionExercise(session.id, bench.id, 1, 4, '8');

  useWorkoutStore.getState().updateSessionExercise(link.id, {
    rest_between_sets: 60,
    rest_after_exercise: 180,
  });

  const copy = useWorkoutStore.getState().duplicateRoutine(routine.id);
  const copiedSessions = useWorkoutStore.getState().sessions.filter((item) => item.routine_id === copy.id);
  const copiedLinks = useWorkoutStore.getState().sessionExercises.filter((item) => item.session_id === copiedSessions[0].id);

  assert.equal(copy.name, 'Base 복사');
  assert.notEqual(copy.id, routine.id);
  assert.equal(copiedSessions.length, 1);
  assert.notEqual(copiedSessions[0].id, session.id);
  assert.deepEqual(
    copiedLinks.map(({ exercise_id, target_sets, target_record, rest_between_sets, rest_after_exercise }) => ({
      exercise_id,
      target_sets,
      target_record,
      rest_between_sets,
      rest_after_exercise,
    })),
    [
      {
        exercise_id: bench.id,
        target_sets: 4,
        target_record: '8',
        rest_between_sets: 60,
        rest_after_exercise: 180,
      },
    ],
  );
});

test('deleteRoutine removes child sessions and session exercises', () => {
  const routine = useWorkoutStore.getState().addRoutine('To Remove');
  const session = useWorkoutStore.getState().addSession(routine.id, 'Only Day');
  const bench = useWorkoutStore.getState().exercises.find((exercise) => exercise.name === '벤치프레스');

  useWorkoutStore.getState().addSessionExercise(session.id, bench.id, 1, 3, '10');
  useWorkoutStore.getState().deleteRoutine(routine.id);

  assert.equal(useWorkoutStore.getState().routines.some((item) => item.id === routine.id), false);
  assert.equal(useWorkoutStore.getState().sessions.some((item) => item.routine_id === routine.id), false);
  assert.equal(useWorkoutStore.getState().sessionExercises.some((item) => item.session_id === session.id), false);
});

test('deleteWorkoutLog removes its set records', () => {
  const bench = useWorkoutStore.getState().exercises.find((exercise) => exercise.name === '벤치프레스');
  const log = useWorkoutStore.getState().startWorkoutLog();
  const setRecord = useWorkoutStore.getState().addSetRecord(log.id, bench.id, 1, 80, '8', 'both');

  useWorkoutStore.getState().deleteWorkoutLog(log.id);

  assert.equal(useWorkoutStore.getState().workoutLogs.some((item) => item.id === log.id), false);
  assert.equal(useWorkoutStore.getState().setRecords.some((item) => item.id === setRecord.id), false);
});

test('generateDummyData creates diverse non-exercise seed data', () => {
  const initialExerciseCount = useWorkoutStore.getState().exercises.length;

  useWorkoutStore.getState().generateDummyData();

  const state = useWorkoutStore.getState();
  const sessionsByRoutine = state.routines.map((routine) =>
    state.sessions.filter((session) => session.routine_id === routine.id),
  );

  assert.ok(state.routines.length >= 3);
  assert.equal(sessionsByRoutine.every((sessions) => sessions.length >= 4), true);
  assert.ok(state.sessionExercises.length > state.sessions.length);
  assert.ok(state.workoutLogs.some((log) => log.session_id === null));
  assert.ok(state.workoutLogs.some((log) => log.end_time === null));

  const unilateralExerciseIds = new Set(
    state.exercises.filter((ex) => ex.is_unilateral).map((ex) => ex.id)
  );
  const allCorrectSides = state.setRecords.every((record) => {
    if (unilateralExerciseIds.has(record.exercise_id)) {
      return record.side === 'L' || record.side === 'R';
    }
    return record.side === 'both';
  });
  assert.ok(allCorrectSides);

  assert.ok(state.setRecords.some((record) => record.memo));
  assert.ok(state.exercises.length >= initialExerciseCount);
});

test('clearAllData clears templates and logs without removing exercise source data', () => {
  useWorkoutStore.getState().generateDummyData();
  const exerciseCount = useWorkoutStore.getState().exercises.length;

  useWorkoutStore.getState().clearAllData();

  const state = useWorkoutStore.getState();
  assert.equal(state.routines.length, 0);
  assert.equal(state.sessions.length, 0);
  assert.equal(state.sessionExercises.length, 0);
  assert.equal(state.workoutLogs.length, 0);
  assert.equal(state.setRecords.length, 0);
  assert.equal(state.exercises.length, exerciseCount);
});

test('updateExercise modifies existing exercise properties', () => {
  const custom = useWorkoutStore.getState().addExercise('나만의 런지', '대퇴사두', '덤벨', 'kg', false);
  assert.equal(custom.is_unilateral, false);

  useWorkoutStore.getState().updateExercise(custom.id, { is_unilateral: true });
  const updated = useWorkoutStore.getState().exercises.find(ex => ex.id === custom.id);
  assert.equal(updated.is_unilateral, true);
});
