import { test, describe, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { MAX_SESSIONS_PER_ROUTINE } from '../utils/sessionHelper.js';
import { buildInitialBlocks } from '../utils/setGridModel.js';
import { EXERCISE_CATALOG } from '../data/dummyGenerator.js';

const { useWorkoutStore } = await import('./useWorkoutStore.js');

const guestUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: '게스트',
  isGuest: true,
};

function exerciseByLabel(label) {
  const normalized = label.toLowerCase();
  const compact = normalized.replace(/\s+/g, '');
  return useWorkoutStore.getState().exercises.find((exercise) =>
    exercise.name.toLowerCase() === normalized ||
    exercise.name.toLowerCase().replace(/\s+/g, '') === compact ||
    exercise.synonyms?.some((synonym) => (
      synonym.toLowerCase() === normalized ||
      synonym.toLowerCase().replace(/\s+/g, '') === compact
    )),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

describe('Workout Store: Exercise Actions', () => {
  test('addExercise prevents case-insensitive duplicates', () => {
    const first = useWorkoutStore.getState().addExercise('테스트 컬', '이두', '덤벨');
    const second = useWorkoutStore.getState().addExercise('테스트 컬', '어깨', '바벨');

    assert.equal(second.id, first.id);
    assert.equal(useWorkoutStore.getState().exercises.filter((exercise) => exercise.name === '테스트 컬').length, 1);
  });

  test('updateExercise modifies existing exercise properties', () => {
    const custom = useWorkoutStore.getState().addExercise('나만의 런지', '대퇴사두', '덤벨', 'kg', false);
    assert.equal(custom.is_unilateral, false);

    useWorkoutStore.getState().updateExercise(custom.id, { is_unilateral: true });
    const updated = useWorkoutStore.getState().exercises.find(ex => ex.id === custom.id);
    assert.equal(updated.is_unilateral, true);
  });
});

describe('Workout Store: Routine & Session Templates', () => {
  test('routines, sessions, and session exercises keep template defaults', () => {
    const routine = useWorkoutStore.getState().addRoutine('PPL');
    const push = useWorkoutStore.getState().addSession(routine.id, 'Push');
    const pull = useWorkoutStore.getState().addSession(routine.id, 'Pull');
    const bench = exerciseByLabel('벤치프레스');
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
    const bench = exerciseByLabel('벤치프레스');

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
      exerciseByLabel(name),
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
    const bench = exerciseByLabel('벤치프레스');
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
    const bench = exerciseByLabel('벤치프레스');

    useWorkoutStore.getState().addSessionExercise(session.id, bench.id, 1, 3, '10');
    useWorkoutStore.getState().deleteRoutine(routine.id);

    assert.equal(useWorkoutStore.getState().routines.some((item) => item.id === routine.id), false);
    assert.equal(useWorkoutStore.getState().sessions.some((item) => item.routine_id === routine.id), false);
    assert.equal(useWorkoutStore.getState().sessionExercises.some((item) => item.session_id === session.id), false);
  });

  test('session exercise groups persist position and keep target sets and rest times unified', () => {
    const routine = useWorkoutStore.getState().addRoutine('Superset Base');
    const session = useWorkoutStore.getState().addSession(routine.id, 'Day A');
    const [bench, squat, deadlift] = ['벤치프레스', '스쿼트', '데드리프트'].map((name) =>
      exerciseByLabel(name),
    );
    const first = useWorkoutStore.getState().addSessionExercise(session.id, bench.id, 1, 4, '8');
    const second = useWorkoutStore.getState().addSessionExercise(session.id, squat.id, 2, 3, '10');
    const third = useWorkoutStore.getState().addSessionExercise(session.id, deadlift.id, 3, 2, '5');

    useWorkoutStore.getState().updateSessionExercise(first.id, { rest_between_sets: 60, rest_after_exercise: 150 });

    const group = useWorkoutStore.getState().addSessionExerciseGroup(session.id, '슈퍼세트 A', 2);

    assert.equal(group.name, '슈퍼세트 A');
    assert.equal(group.start_order, 1);
    assert.equal(group.size, 2);
    assert.deepEqual(
      useWorkoutStore.getState().sessionExercises
        .filter((item) => [first.id, second.id].includes(item.id))
        .map(({ target_sets }) => target_sets),
      [4, 4],
    );
    assert.deepEqual(
      useWorkoutStore.getState().sessionExercises
        .filter((item) => [first.id, second.id].includes(item.id))
        .map(({ rest_between_sets }) => rest_between_sets),
      [60, 60],
    );
    assert.deepEqual(
      useWorkoutStore.getState().sessionExercises
        .filter((item) => [first.id, second.id].includes(item.id))
        .map(({ rest_after_exercise }) => rest_after_exercise),
      [150, 150],
    );

    useWorkoutStore.getState().updateSessionExercise(second.id, { target_sets: 6, rest_between_sets: 75, rest_after_exercise: 180 });
    assert.deepEqual(
      useWorkoutStore.getState().sessionExercises
        .filter((item) => [first.id, second.id].includes(item.id))
        .map(({ target_sets }) => target_sets),
      [6, 6],
    );
    assert.deepEqual(
      useWorkoutStore.getState().sessionExercises
        .filter((item) => [first.id, second.id].includes(item.id))
        .map(({ rest_between_sets }) => rest_between_sets),
      [75, 75],
    );
    assert.deepEqual(
      useWorkoutStore.getState().sessionExercises
        .filter((item) => [first.id, second.id].includes(item.id))
        .map(({ rest_after_exercise }) => rest_after_exercise),
      [180, 180],
    );

    useWorkoutStore.getState().updateSessionExerciseGroup(group.id, { start_order: 2 });
    const afterMove = useWorkoutStore.getState().sessionExercises;
    assert.equal(useWorkoutStore.getState().sessionExerciseGroups.find((item) => item.id === group.id).start_order, 2);
    assert.equal(afterMove.find((item) => item.id === second.id).target_sets, 6);
    assert.equal(afterMove.find((item) => item.id === third.id).target_sets, 6);
    assert.equal(afterMove.find((item) => item.id === second.id).rest_between_sets, 75);
    assert.equal(afterMove.find((item) => item.id === third.id).rest_between_sets, 75);
  });

  test('session exercise groups get unique colors, avoid overlap, and cap at four', () => {
    const routine = useWorkoutStore.getState().addRoutine('Group Boundaries');
    const session = useWorkoutStore.getState().addSession(routine.id, 'Day A');
    const exerciseIds = useWorkoutStore.getState().exercises.slice(0, 8).map((exercise) => exercise.id);
    exerciseIds.forEach((exerciseId, index) => {
      useWorkoutStore.getState().addSessionExercise(session.id, exerciseId, index + 1, 3, '10');
    });

    const groups = Array.from({ length: 4 }, (_, index) =>
      useWorkoutStore.getState().addSessionExerciseGroup(session.id, `그룹 ${index + 1}`, 2),
    );
    const overflow = useWorkoutStore.getState().addSessionExerciseGroup(session.id, '그룹 5', 2);

    assert.deepEqual(groups.map((group) => group.start_order), [1, 3, 5, 7]);
    assert.deepEqual(groups.map((group) => group.color), ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e']);
    assert.equal(overflow, null);
  });

  test('moving a group skips over occupied ranges instead of overlapping', () => {
    const routine = useWorkoutStore.getState().addRoutine('Skip Overlap');
    const session = useWorkoutStore.getState().addSession(routine.id, 'Day A');
    const exerciseIds = useWorkoutStore.getState().exercises.slice(0, 6).map((exercise) => exercise.id);
    exerciseIds.forEach((exerciseId, index) => {
      useWorkoutStore.getState().addSessionExercise(session.id, exerciseId, index + 1, 3, '10');
    });

    const first = useWorkoutStore.getState().addSessionExerciseGroup(session.id, '첫 그룹', 2);
    const second = useWorkoutStore.getState().addSessionExerciseGroup(session.id, '둘째 그룹', 2);

    const moved = useWorkoutStore.getState().updateSessionExerciseGroup(first.id, { start_order: 2 });

    assert.equal(second.start_order, 3);
    assert.equal(moved.start_order, 5);
    assert.deepEqual(
      useWorkoutStore.getState().sessionExerciseGroups
        .filter((group) => group.session_id === session.id)
        .map(({ id, start_order, size }) => ({ id, start_order, size })),
      [
        { id: moved.id, start_order: 5, size: 2 },
        { id: second.id, start_order: 3, size: 2 },
      ],
    );
  });

  test('deleteSessionExercise removes undersized groups', () => {
    const routine = useWorkoutStore.getState().addRoutine('Delete Group');
    const session = useWorkoutStore.getState().addSession(routine.id, 'Day A');
    const [bench, squat] = ['벤치프레스', '스쿼트'].map((name) =>
      exerciseByLabel(name),
    );
    const first = useWorkoutStore.getState().addSessionExercise(session.id, bench.id, 1, 3, '8');
    const second = useWorkoutStore.getState().addSessionExercise(session.id, squat.id, 2, 3, '10');
    const group = useWorkoutStore.getState().addSessionExerciseGroup(session.id, '슈퍼세트', 2);

    useWorkoutStore.getState().deleteSessionExercise(first.id);

    assert.equal(useWorkoutStore.getState().sessionExercises.some((item) => item.id === second.id), true);
    assert.equal(useWorkoutStore.getState().sessionExerciseGroups.some((item) => item.id === group.id), false);
  });
});

describe('Workout Store: Workout Log Persistence & Flow Integration', () => {
  test('deleteWorkoutLog removes its set records', () => {
    const routine = useWorkoutStore.getState().addRoutine('테스트 루틴');
    const session = useWorkoutStore.getState().addSession(routine.id, '테스트 세션');
    const bench = exerciseByLabel('벤치프레스');
    const log = useWorkoutStore.getState().startWorkoutLog(session.id);
    const setRecord = useWorkoutStore.getState().addSetRecord(log.id, bench.id, 1, 80, '8', 'both');

    useWorkoutStore.getState().deleteWorkoutLog(log.id);

    assert.equal(useWorkoutStore.getState().workoutLogs.some((item) => item.id === log.id), false);
    assert.equal(useWorkoutStore.getState().setRecords.some((item) => item.id === setRecord.id), false);
  });

  test('saveWorkoutLog persists entered sets to workoutLogs and setRecords', () => {
    const routine = useWorkoutStore.getState().addRoutine('루틴 A');
    const session = useWorkoutStore.getState().addSession(routine.id, '세션 B');
    const bench = exerciseByLabel('벤치프레스');
    
    const startTime = new Date(Date.now() - 3600 * 1000).toISOString();
    const blocks = [
      {
        exercise_id: bench.id,
        sets: [
          { set_number: 1, side: 'both', weight: '80', reps: '5', memo: '무거움' },
          { set_number: 2, side: 'both', weight: '80', reps: '4', memo: '' },
          { set_number: 3, side: 'both', weight: '80', reps: '', memo: '' }
        ]
      }
    ];

    const log = useWorkoutStore.getState().saveWorkoutLog(session.id, blocks, startTime);

    const savedLog = useWorkoutStore.getState().workoutLogs.find(l => l.id === log.id);
    assert.ok(savedLog);
    assert.equal(savedLog.session_id, session.id);
    assert.equal(savedLog.start_time, startTime);
    assert.ok(savedLog.end_time);

    const savedRecords = useWorkoutStore.getState().setRecords.filter(r => r.workout_log_id === log.id);
    assert.equal(savedRecords.length, 2);

    assert.equal(savedRecords[0].set_number, 1);
    assert.equal(savedRecords[0].weight, 80);
    assert.equal(savedRecords[0].record, '5');
    assert.equal(savedRecords[0].memo, '무거움');

    assert.equal(savedRecords[1].set_number, 2);
    assert.equal(savedRecords[1].weight, 80);
    assert.equal(savedRecords[1].record, '4');
    assert.equal(savedRecords[1].memo, null);
  });

  test('set page flow integration: entering records and completing workout', () => {
    const routine = useWorkoutStore.getState().addRoutine('상하체 루틴');
    const session = useWorkoutStore.getState().addSession(routine.id, '상체 A');
    
    const bench = useWorkoutStore.getState().addExercise('테스트 벤치프레스', '가슴', '바벨', 'kg', false);
    const lunge = useWorkoutStore.getState().addExercise('테스트 런지', '대퇴사두', '덤벨', 'kg', true);
    
    useWorkoutStore.getState().addSessionExercise(session.id, bench.id, 1, 2, '8');
    useWorkoutStore.getState().addSessionExercise(session.id, lunge.id, 2, 1, '12');

    const sessionExercises = useWorkoutStore.getState().sessionExercises;
    const exercises = useWorkoutStore.getState().exercises;
    
    let nextId = 0;
    const mockCreateId = () => `mock-set-${nextId++}`;
    const blocks = buildInitialBlocks(session, sessionExercises, exercises, mockCreateId);
    
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].exercise_name, '테스트 벤치프레스');
    assert.equal(blocks[0].is_unilateral, false);
    assert.equal(blocks[0].sets.length, 2);
    
    assert.equal(blocks[1].exercise_name, '테스트 런지');
    assert.equal(blocks[1].is_unilateral, true);
    assert.equal(blocks[1].sets.length, 2);
    
    blocks[0].sets[0].weight = '80';
    blocks[0].sets[0].reps = '8';
    blocks[0].sets[0].memo = '가뿐함';
    
    blocks[0].sets[1].weight = '80';
    blocks[0].sets[1].reps = '7';
    
    blocks[1].sets[0].weight = '15';
    blocks[1].sets[0].reps = '12';
    blocks[1].sets[1].weight = '15';
    blocks[1].sets[1].reps = '12';

    const hasEnteredData = blocks.some((block) =>
      block.sets.some((set) => String(set.reps ?? '').trim() !== '')
    );
    assert.equal(hasEnteredData, true);

    const startTime = new Date(Date.now() - 1800 * 1000).toISOString();
    const log = useWorkoutStore.getState().saveWorkoutLog(session.id, blocks, startTime);
    
    const savedLog = useWorkoutStore.getState().workoutLogs.find(l => l.id === log.id);
    assert.ok(savedLog);
    assert.equal(savedLog.session_id, session.id);
    assert.equal(savedLog.start_time, startTime);
    assert.ok(savedLog.end_time);
    
    const savedRecords = useWorkoutStore.getState().setRecords.filter(r => r.workout_log_id === log.id);
    assert.equal(savedRecords.length, 4);
    
    const rec1 = savedRecords.find(r => r.exercise_id === bench.id && r.set_number === 1);
    assert.ok(rec1);
    assert.equal(rec1.weight, 80);
    assert.equal(rec1.record, '8');
    assert.equal(rec1.side, 'both');
    assert.equal(rec1.memo, '가뿐함');
    
    const rec2 = savedRecords.find(r => r.exercise_id === bench.id && r.set_number === 2);
    assert.ok(rec2);
    assert.equal(rec2.weight, 80);
    assert.equal(rec2.record, '7');
    assert.equal(rec2.side, 'both');
    assert.equal(rec2.memo, null);
    
    const rec3 = savedRecords.find(r => r.exercise_id === lunge.id && r.set_number === 1 && r.side === 'L');
    assert.ok(rec3);
    assert.equal(rec3.weight, 15);
    assert.equal(rec3.record, '12');
    assert.equal(rec3.memo, null);
    
    const rec4 = savedRecords.find(r => r.exercise_id === lunge.id && r.set_number === 1 && r.side === 'R');
    assert.ok(rec4);
    assert.equal(rec4.weight, 15);
    assert.equal(rec4.record, '12');
    assert.equal(rec4.memo, null);
  });
});

describe('Workout Store: Seed Data & Resets', () => {
  test('generateDummyData creates diverse non-exercise seed data', () => {
    const initialExerciseCount = useWorkoutStore.getState().exercises.length;

    useWorkoutStore.getState().generateDummyData();

    const state = useWorkoutStore.getState();
    const sessionsByRoutine = state.routines.map((routine) =>
      state.sessions.filter((session) => session.routine_id === routine.id),
    );

    assert.equal(state.routines.length, 3);
    assert.equal(sessionsByRoutine.every((sessions) => sessions.length === 4), true);
    assert.ok(state.sessionExercises.length > state.sessions.length);
    assert.ok(state.sessionExerciseGroups.length > 0);
    assert.ok(state.sessionExerciseGroups.some((group) => group.name.includes('파워세트')));
    assert.ok(state.sessionExerciseGroups.some((group) => group.name.includes('라운드')));
    assert.equal(state.workoutLogs.length, 30);
    assert.ok(state.workoutLogs.some((log) => log.end_time === null));

    const logDates = state.workoutLogs.map((log) => new Date(log.start_time).toDateString());
    assert.equal(new Set(logDates).size, state.workoutLogs.length);
    const sortedLogTimes = state.workoutLogs
      .map((log) => new Date(log.start_time).getTime())
      .sort((a, b) => a - b);
    const dayGaps = sortedLogTimes.slice(1).map((time, index) =>
      Math.round((time - sortedLogTimes[index]) / (24 * 60 * 60 * 1000)),
    );
    assert.ok(dayGaps.some((gap) => gap === 1));

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

    const memos = state.setRecords.map((record) => record.memo).filter(Boolean);
    assert.ok(memos.length > 0);
    assert.ok(memos.length < state.setRecords.length);
    assert.equal(memos.every((memo) => memo.length <= 45), true);
    assert.equal(new Set(memos).size, memos.length);

    const linkedExerciseIds = new Set(state.sessionExercises.map((link) => link.exercise_id));
    const linkedExercises = state.exercises.filter((exercise) => linkedExerciseIds.has(exercise.id));
    assert.equal(linkedExercises.length, 21);
    assert.equal(
      linkedExercises.every((exercise) => ['덤벨', '맨몸', '밴드'].includes(exercise.equipment)),
      true,
    );
    assert.ok(state.exercises.length >= initialExerciseCount);
  });

  test('clearAllData clears guest demo data and resets the exercise catalog', () => {
    useWorkoutStore.getState().generateDummyData();

    useWorkoutStore.getState().clearAllData();

    const state = useWorkoutStore.getState();
    assert.equal(state.routines.length, 0);
    assert.equal(state.sessions.length, 0);
    assert.equal(state.sessionExercises.length, 0);
    assert.equal(state.sessionExerciseGroups.length, 0);
    assert.equal(state.workoutLogs.length, 0);
    assert.equal(state.setRecords.length, 0);
    assert.equal(state.exercises.length, EXERCISE_CATALOG.length);
    assert.equal(state.hasClearedDemoData, true);
  });
});

describe('Workout Store: Security and Defensive Validation Boundaries', () => {
  test('truncates extremely long routine, session, and exercise names', () => {
    const longName = 'A'.repeat(150);
    
    // Routine Name
    const routine = useWorkoutStore.getState().addRoutine(longName);
    assert.equal(routine.name.length, 100);
    assert.equal(routine.name, 'A'.repeat(100));

    useWorkoutStore.getState().updateRoutine(routine.id, 'B'.repeat(120));
    const updatedRoutine = useWorkoutStore.getState().routines.find(r => r.id === routine.id);
    assert.equal(updatedRoutine.name.length, 100);
    assert.equal(updatedRoutine.name, 'B'.repeat(100));

    // Session Name
    const session = useWorkoutStore.getState().addSession(routine.id, longName);
    assert.equal(session.name.length, 100);
    assert.equal(session.name, 'A'.repeat(100));

    useWorkoutStore.getState().updateSession(session.id, 'C'.repeat(120));
    const updatedSession = useWorkoutStore.getState().sessions.find(s => s.id === session.id);
    assert.equal(updatedSession.name.length, 100);
    assert.equal(updatedSession.name, 'C'.repeat(100));

    // Exercise Name
    const exercise = useWorkoutStore.getState().addExercise(longName, '가슴', '바벨');
    assert.equal(exercise.name.length, 100);
    assert.equal(exercise.name, 'A'.repeat(100));
  });

  test('resolves empty or whitespace-only inputs to safe default fallbacks', () => {
    const emptyName = '    ';
    
    // Routine
    const routine = useWorkoutStore.getState().addRoutine(emptyName);
    assert.ok(routine.name.startsWith('새 루틴'));

    // Session
    const session = useWorkoutStore.getState().addSession(routine.id, emptyName);
    assert.ok(session.name.startsWith('새 세션'));

    // Exercise
    const exercise = useWorkoutStore.getState().addExercise(emptyName, '기타', '기타');
    assert.equal(exercise.name, '이름 없는 운동');
  });

  test('validates and cleanses set records weight, reps record, and memo boundaries', () => {
    const routine = useWorkoutStore.getState().addRoutine('보안 테스트');
    const session = useWorkoutStore.getState().addSession(routine.id, '세션');
    const bench = exerciseByLabel('벤치프레스');
    
    const longMemo = 'M'.repeat(1200);
    const longRecord = 'R'.repeat(60);

    // addSetRecord (weight parsing and memo/record size limits)
    const log = useWorkoutStore.getState().startWorkoutLog(session.id);
    const record = useWorkoutStore.getState().addSetRecord(
      log.id, 
      bench.id, 
      1, 
      'invalid-weight', 
      longRecord, 
      'both', 
      longMemo
    );

    assert.equal(record.weight, 0); // Invalid weight parsed to float and resolved to 0
    assert.equal(record.record.length, 50); // Record capped at 50 chars
    assert.equal(record.memo.length, 1000); // Memo capped at 1000 chars

    // updateSetRecord sanitization
    useWorkoutStore.getState().updateSetRecord(record.id, {
      weight: '123.45',
      record: '10',
      memo: '   수정된 정상 메모   '
    });

    const updated = useWorkoutStore.getState().setRecords.find(r => r.id === record.id);
    assert.equal(updated.weight, 123.45);
    assert.equal(updated.record, '10');
    assert.equal(updated.memo, '수정된 정상 메모');
  });
});
