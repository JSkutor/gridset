// @vitest-environment node
import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildLogSummaries,
  buildExerciseSummaries,
  buildRoutineSummaries,
} from './logSummaries.js';

// ─── Fixture Builders ────────────────────────────────────────

function makeWorkoutLog(overrides = {}) {
  return {
    id: 'log-1',
    user_id: 'user-1',
    session_id: 'session-1',
    start_time: '2026-05-29T10:00:00.000Z',
    end_time: '2026-05-29T11:00:00.000Z',
    created_at: '2026-05-29T10:00:00.000Z',
    updated_at: '2026-05-29T11:00:00.000Z',
    ...overrides,
  };
}

function makeSetRecord(overrides = {}) {
  return {
    id: 'record-1',
    workout_log_id: 'log-1',
    exercise_id: 'exercise-1',
    set_number: 1,
    weight: 80,
    record: 10,
    side: null,
    created_at: '2026-05-29T10:05:00.000Z',
    updated_at: '2026-05-29T10:05:00.000Z',
    ...overrides,
  };
}

function makeExercise(overrides = {}) {
  return {
    id: 'exercise-1',
    name: '벤치프레스',
    englishName: 'Bench Press',
    primary_muscle: '가슴',
    secondaryMuscles: [],
    secondary_muscles: [],
    equipment: '바벨',
    category: 'strength',
    unit: 'kg',
    is_unilateral: false,
    synonyms: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSession(overrides = {}) {
  return {
    id: 'session-1',
    name: '가슴 운동',
    routine_id: 'routine-1',
    session_order: 1,
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeRoutine(overrides = {}) {
  return {
    id: 'routine-1',
    name: '루틴 A',
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSessionExercise(overrides = {}) {
  return {
    id: 'se-1',
    session_id: 'session-1',
    exercise_id: 'exercise-1',
    order: 1,
    target_sets: 3,
    target_record: 10,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── buildLogSummaries ───────────────────────────────────────

describe('buildLogSummaries', () => {
  test('returns empty array given empty inputs', () => {
    const result = buildLogSummaries([], new Map());
    assert.deepEqual(result, []);
  });

  test('filters out logs with invalid start_time', () => {
    const logs = [
      makeWorkoutLog({ id: 'log-1', start_time: '' }),
      makeWorkoutLog({ id: 'log-2', start_time: '2026-05-29T10:00:00.000Z' }),
    ];
    const recordsByLogId = new Map();
    const result = buildLogSummaries(logs, recordsByLogId);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'log-2');
  });

  test('attaches records sorted by exercise_id, set_number, side', () => {
    const logs = [makeWorkoutLog({ id: 'log-1' })];
    const records = [
      makeSetRecord({ set_number: 2, exercise_id: 'ex-2' }),
      makeSetRecord({ set_number: 1, exercise_id: 'ex-1' }),
      makeSetRecord({ set_number: 1, exercise_id: 'ex-2' }),
    ];
    const recordsByLogId = new Map([['log-1', records]]);

    const result = buildLogSummaries(logs, recordsByLogId);
    assert.equal(result.length, 1);
    const sorted = result[0].records;
    assert.equal(sorted[0].exercise_id, 'ex-1');
    assert.equal(sorted[1].exercise_id, 'ex-2');
    assert.equal(sorted[1].set_number, 1);
    assert.equal(sorted[2].exercise_id, 'ex-2');
    assert.equal(sorted[2].set_number, 2);
  });

  test('handles missing records gracefully', () => {
    const logs = [makeWorkoutLog({ id: 'log-1' })];
    const recordsByLogId = new Map(); // no entry for log-1
    const result = buildLogSummaries(logs, recordsByLogId);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].records, []);
  });

  test('sorts logs by startDate descending (newest first)', () => {
    const logs = [
      makeWorkoutLog({ id: 'log-1', start_time: '2026-05-29T10:00:00.000Z' }),
      makeWorkoutLog({ id: 'log-2', start_time: '2026-05-28T10:00:00.000Z' }),
      makeWorkoutLog({ id: 'log-3', start_time: '2026-05-30T10:00:00.000Z' }),
    ];
    const recordsByLogId = new Map();
    const result = buildLogSummaries(logs, recordsByLogId);
    assert.equal(result[0].id, 'log-3'); // newest
    assert.equal(result[1].id, 'log-1');
    assert.equal(result[2].id, 'log-2'); // oldest
  });

  test('does not mutate the original records array', () => {
    const logs = [makeWorkoutLog({ id: 'log-1' })];
    const original = [
      makeSetRecord({ set_number: 2 }),
      makeSetRecord({ set_number: 1 }),
    ];
    const recordsByLogId = new Map([['log-1', original]]);
    buildLogSummaries(logs, recordsByLogId);
    // original array should still be in original order
    assert.equal(original[0].set_number, 2);
    assert.equal(original[1].set_number, 1);
  });
});

// ─── buildExerciseSummaries ──────────────────────────────────

describe('buildExerciseSummaries', () => {
  test('returns empty array given empty logSummaries', () => {
    const result = buildExerciseSummaries([], new Map());
    assert.deepEqual(result, []);
  });

  test('groups records by exercise and computes metric value', () => {
    const log = buildLogSummaries(
      [makeWorkoutLog({ id: 'log-1', start_time: '2026-05-29T10:00:00.000Z' })],
      new Map([
        [
          'log-1',
          [
            makeSetRecord({ exercise_id: 'ex-1', weight: 80, record: 10 }),
            makeSetRecord({ exercise_id: 'ex-1', weight: 80, record: 8 }),
            makeSetRecord({ exercise_id: 'ex-2', weight: 60, record: 12 }),
          ],
        ],
      ]),
    );

    const exercisesById = new Map([
      ['ex-1', makeExercise({ id: 'ex-1', name: '벤치프레스', unit: 'kg' })],
      ['ex-2', makeExercise({ id: 'ex-2', name: '덤벨로우', unit: 'kg' })],
    ]);

    const result = buildExerciseSummaries(log, exercisesById);
    assert.equal(result.length, 2);

    // ex-1: 80*10 + 80*8 = 1440
    const ex1 = result.find((s) => s.exercise.id === 'ex-1');
    assert.ok(ex1);
    assert.equal(ex1.setCount, 2);
    assert.equal(ex1.totalMetric, 1440);
    assert.equal(ex1.logs.length, 1);

    // ex-2: 60*12 = 720
    const ex2 = result.find((s) => s.exercise.id === 'ex-2');
    assert.ok(ex2);
    assert.equal(ex2.setCount, 1);
    assert.equal(ex2.totalMetric, 720);
  });

  test('builds points array in chronological order', () => {
    const logs = buildLogSummaries(
      [
        makeWorkoutLog({ id: 'log-1', start_time: '2026-05-28T10:00:00.000Z' }),
        makeWorkoutLog({ id: 'log-2', start_time: '2026-05-29T10:00:00.000Z' }),
      ],
      new Map([
        ['log-1', [makeSetRecord({ exercise_id: 'ex-1', weight: 80, record: 10 })]],
        ['log-2', [makeSetRecord({ exercise_id: 'ex-1', weight: 80, record: 12 })]],
      ]),
    );

    const exercisesById = new Map([
      ['ex-1', makeExercise({ id: 'ex-1', name: '벤치프레스', unit: 'kg' })],
    ]);

    const result = buildExerciseSummaries(logs, exercisesById);
    assert.equal(result.length, 1);
    assert.equal(result[0].points.length, 2);
    // points should be sorted by date ascending
    assert.ok(result[0].points[0].date.getTime() < result[0].points[1].date.getTime());
    assert.equal(result[0].points[0].value, 800);
    assert.equal(result[0].points[1].value, 960);
  });

  test('skips records whose exercise is not in exercisesById', () => {
    const log = buildLogSummaries(
      [makeWorkoutLog({ id: 'log-1', start_time: '2026-05-29T10:00:00.000Z' })],
      new Map([
        [
          'log-1',
          [
            makeSetRecord({ exercise_id: 'ex-1', weight: 80, record: 10 }),
            makeSetRecord({ exercise_id: 'unknown', weight: 50, record: 5 }),
          ],
        ],
      ]),
    );

    const exercisesById = new Map([
      ['ex-1', makeExercise({ id: 'ex-1', name: '벤치프레스', unit: 'kg' })],
    ]);

    const result = buildExerciseSummaries(log, exercisesById);
    assert.equal(result.length, 1);
    assert.equal(result[0].exercise.id, 'ex-1');
  });

  test('sorts summaries by latest log date then exercise name', () => {
    const log1 = buildLogSummaries(
      [makeWorkoutLog({ id: 'log-1', start_time: '2026-05-29T10:00:00.000Z' })],
      new Map([['log-1', [makeSetRecord({ exercise_id: 'ex-1' }), makeSetRecord({ exercise_id: 'ex-2' })]]]),
    );

    const exercisesById = new Map([
      ['ex-1', makeExercise({ id: 'ex-1', name: '데드리프트', unit: 'kg' })],
      ['ex-2', makeExercise({ id: 'ex-2', name: '벤치프레스', unit: 'kg' })],
    ]);

    const result = buildExerciseSummaries(log1, exercisesById);
    assert.equal(result.length, 2);
    // same date => sort by name (ko locale)
    assert.equal(result[0].exercise.name, '데드리프트');
    assert.equal(result[1].exercise.name, '벤치프레스');
  });

  test('handles bodyweight exercises (reps unit) correctly', () => {
    const log = buildLogSummaries(
      [makeWorkoutLog({ id: 'log-1', start_time: '2026-05-29T10:00:00.000Z' })],
      new Map([
        ['log-1', [makeSetRecord({ exercise_id: 'ex-1', weight: 0, record: 15 })],
      ]]),
    );

    const exercisesById = new Map([
      ['ex-1', makeExercise({ id: 'ex-1', name: '푸시업', unit: 'reps' })],
    ]);

    const result = buildExerciseSummaries(log, exercisesById);
    assert.equal(result.length, 1);
    // reps: returns record directly (not weight * record)
    assert.equal(result[0].totalMetric, 15);
  });
});

// ─── buildRoutineSummaries ───────────────────────────────────

describe('buildRoutineSummaries', () => {
  test('returns empty array given empty routines', () => {
    const result = buildRoutineSummaries([], [], [], new Map(), []);
    assert.deepEqual(result, []);
  });

  test('builds routine summary with sessions, exercises, and logs', () => {
    const routine = makeRoutine({ id: 'routine-1', name: '루틴 A' });
    const session = makeSession({
      id: 'session-1',
      routine_id: 'routine-1',
      session_order: 1,
      name: '가슴',
    });
    const exercise = makeExercise({ id: 'ex-1', name: '벤치프레스' });
    const se = makeSessionExercise({
      session_id: 'session-1',
      exercise_id: 'ex-1',
      order: 1,
    });

    const logs = buildLogSummaries(
      [makeWorkoutLog({ id: 'log-1', session_id: 'session-1', start_time: '2026-05-29T10:00:00.000Z' })],
      new Map([['log-1', [makeSetRecord({ exercise_id: 'ex-1' })]],
    ]));

    const result = buildRoutineSummaries(
      [routine],
      [session],
      [se],
      new Map([['ex-1', exercise]]),
      logs,
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'routine-1');
    assert.equal(result[0].name, '루틴 A');
    assert.equal(result[0].logCount, 1);
    assert.equal(result[0].exerciseCount, 1);
    assert.equal(result[0].sessions.length, 1);

    const sessionSummary = result[0].sessions[0];
    assert.equal(sessionSummary.id, 'session-1');
    assert.equal(sessionSummary.logCount, 1);
    assert.equal(sessionSummary.exercises.length, 1);
    assert.equal(sessionSummary.exercises[0].id, 'ex-1');
    assert.ok(sessionSummary.firstDate instanceof Date);
    assert.ok(sessionSummary.lastDate instanceof Date);
  });

  test('includes temporary session when present', () => {
    const routine = makeRoutine({ id: 'routine-1', name: '루틴 A' });
    const regularSession = makeSession({
      id: 'session-1',
      routine_id: 'routine-1',
      session_order: 1,
      name: '가슴',
    });
    const tempSession = makeSession({
      id: 'session-temp',
      routine_id: 'routine-1',
      session_order: 0, // temporary
      name: '임시',
    });
    const exercise = makeExercise({ id: 'ex-1' });

    const result = buildRoutineSummaries(
      [routine],
      [regularSession, tempSession],
      [makeSessionExercise({ session_id: 'session-1', exercise_id: 'ex-1' })],
      new Map([['ex-1', exercise]]),
      [],
    );

    assert.equal(result[0].sessions.length, 2);
  });

  test('computes activity ratio relative to max session log count', () => {
    const routine = makeRoutine({ id: 'routine-1' });
    const sessionA = makeSession({
      id: 'session-a',
      routine_id: 'routine-1',
      session_order: 1,
      name: 'A',
    });
    const sessionB = makeSession({
      id: 'session-b',
      routine_id: 'routine-1',
      session_order: 2,
      name: 'B',
    });

    const logs = buildLogSummaries(
      [
        makeWorkoutLog({ id: 'log-1', session_id: 'session-a', start_time: '2026-05-28T10:00:00.000Z' }),
        makeWorkoutLog({ id: 'log-2', session_id: 'session-a', start_time: '2026-05-29T10:00:00.000Z' }),
        makeWorkoutLog({ id: 'log-3', session_id: 'session-b', start_time: '2026-05-29T10:00:00.000Z' }),
      ],
      new Map(),
    );

    const result = buildRoutineSummaries(
      [routine],
      [sessionA, sessionB],
      [],
      new Map(),
      logs,
    );

    assert.equal(result[0].sessions.length, 2);
    // session-a has 2 logs, session-b has 1 log, max = 2
    // session-a ratio: (2/2)*100 = 100
    // session-b ratio: (1/2)*100 = 50
    const sA = result[0].sessions.find((s) => s.id === 'session-a');
    const sB = result[0].sessions.find((s) => s.id === 'session-b');
    assert.equal(sA.activityRatio, 100);
    assert.equal(sB.activityRatio, 50);
  });

  test('activity ratio has minimum of 8', () => {
    const routine = makeRoutine({ id: 'routine-1' });
    const session = makeSession({
      id: 'session-1',
      routine_id: 'routine-1',
      session_order: 1,
    });

    // No logs at all => ratio should still be at least 8
    const result = buildRoutineSummaries(
      [routine],
      [session],
      [],
      new Map(),
      [],
    );

    assert.equal(result[0].sessions[0].activityRatio, 8);
  });

  test('sets firstDate and lastDate correctly', () => {
    const routine = makeRoutine({ id: 'routine-1' });
    const session = makeSession({
      id: 'session-1',
      routine_id: 'routine-1',
      session_order: 1,
      created_at: '2026-01-15T00:00:00.000Z',
    });

    const logs = buildLogSummaries(
      [
        makeWorkoutLog({ id: 'log-1', session_id: 'session-1', start_time: '2026-05-28T10:00:00.000Z' }),
        makeWorkoutLog({ id: 'log-2', session_id: 'session-1', start_time: '2026-05-29T10:00:00.000Z' }),
      ],
      new Map(),
    );

    const result = buildRoutineSummaries(
      [routine],
      [session],
      [],
      new Map(),
      logs,
    );

    const s = result[0].sessions[0];
    assert.equal(s.firstDate.toISOString().slice(0, 10), '2026-05-28');
    assert.equal(s.lastDate.toISOString().slice(0, 10), '2026-05-29');
  });

  test('falls back to session.created_at when firstDate has no logs', () => {
    const routine = makeRoutine({ id: 'routine-1' });
    const session = makeSession({
      id: 'session-1',
      routine_id: 'routine-1',
      created_at: '2026-03-15T00:00:00.000Z',
    });

    const result = buildRoutineSummaries(
      [routine],
      [session],
      [],
      new Map(),
      [],
    );

    // No logs, should fall back to session.created_at
    assert.equal(
      result[0].sessions[0].firstDate.toISOString().slice(0, 10),
      '2026-03-15',
    );
    // lastDate should be null
    assert.equal(result[0].sessions[0].lastDate, null);
  });

  test('sorts routines by firstDate descending', () => {
    const routineA = makeRoutine({ id: 'routine-a', name: '루틴 A', created_at: '2026-01-01T00:00:00.000Z' });
    const routineB = makeRoutine({ id: 'routine-b', name: '루틴 B', created_at: '2026-01-01T00:00:00.000Z' });
    const sessionA = makeSession({
      id: 'session-a',
      routine_id: 'routine-a',
      session_order: 1,
      created_at: '2026-01-01T00:00:00.000Z',
    });
    const sessionB = makeSession({
      id: 'session-b',
      routine_id: 'routine-b',
      session_order: 1,
      created_at: '2026-01-01T00:00:00.000Z',
    });

    const logs = buildLogSummaries(
      [
        makeWorkoutLog({ id: 'log-1', session_id: 'session-a', start_time: '2026-05-30T10:00:00.000Z' }),
        makeWorkoutLog({ id: 'log-2', session_id: 'session-b', start_time: '2026-05-29T10:00:00.000Z' }),
      ],
      new Map(),
    );

    const result = buildRoutineSummaries(
      [routineA, routineB],
      [sessionA, sessionB],
      [],
      new Map(),
      logs,
    );

    // routine-a has newest log -> should be first
    assert.equal(result[0].id, 'routine-a');
    assert.equal(result[1].id, 'routine-b');
  });
});
