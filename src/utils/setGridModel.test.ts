// @ts-nocheck
import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildInitialBlocks,
  computeNewGlobalIndex,
  fillExerciseWeightsFromFirstSet,
  flattenBlocks,
  getRestTimerPayloadForCompletedSet,
  getSetCompletionKey,
  isCommittedNumericGridValue,
  isCompletedRepsValue,
  isNumericGridValue,
} from './setGridModel.js';

describe('setGridModel: Grid Initialization & Transformation', () => {
  test('buildInitialBlocks maps a session template into sorted set blocks', () => {
    let nextId = 0;
    const blocks = buildInitialBlocks(
      { id: 'session-a' },
      [
        { id: 'link-b', session_id: 'session-a', exercise_id: 'bench', order: 2, target_sets: 1 },
        { id: 'link-a', session_id: 'session-a', exercise_id: 'squat', order: 1, target_sets: 2 },
        { id: 'link-other', session_id: 'session-b', exercise_id: 'pullup', order: 1, target_sets: 5 },
      ],
      [
        { id: 'bench', name: 'Bench Press' },
        { id: 'squat', name: 'Squat' },
      ],
      () => `set-${nextId += 1}`,
    );

    assert.equal(blocks.length, 2);
    assert.deepEqual(blocks.map((block) => block.exercise_name), ['Squat', 'Bench Press']);
    assert.deepEqual(blocks[0].sets.map((set) => set.id), ['set-1', 'set-2']);
    assert.deepEqual(blocks[0].sets.map((set) => set.set_number), [1, 2]);
    assert.equal(blocks[1].sets.length, 1);
  });

  test('flattenBlocks assigns stable global row metadata', () => {
    const rows = flattenBlocks([
      {
        id: 'block-a',
        exercise_id: 'squat',
        sets: [
          { id: 'a-1', set_number: 1, weight: '', reps: '' },
          { id: 'a-2', set_number: 2, weight: '', reps: '' },
        ],
      },
      {
        id: 'block-b',
        exercise_id: 'bench',
        sets: [
          { id: 'b-1', set_number: 1, weight: '', reps: '' },
        ],
      },
    ]);

    assert.deepEqual(
      rows.map(({ id, blockIndex, rowIndex, globalIndex, isLastSet, exerciseId }) => ({
        id,
        blockIndex,
        rowIndex,
        globalIndex,
        isLastSet,
        exerciseId,
      })),
      [
        { id: 'a-1', blockIndex: 0, rowIndex: 0, globalIndex: 0, isLastSet: false, exerciseId: 'squat' },
        { id: 'a-2', blockIndex: 0, rowIndex: 1, globalIndex: 1, isLastSet: true, exerciseId: 'squat' },
        { id: 'b-1', blockIndex: 1, rowIndex: 0, globalIndex: 2, isLastSet: true, exerciseId: 'bench' },
      ],
    );
  });

  test('computeNewGlobalIndex returns the inserted row position before mutation', () => {
    const blocks = [
      { sets: [{}, {}] },
      { sets: [{}] },
      { sets: [{}, {}, {}] },
    ];

    assert.equal(computeNewGlobalIndex(blocks, 0), 2);
    assert.equal(computeNewGlobalIndex(blocks, 1), 3);
    assert.equal(computeNewGlobalIndex(blocks, 2), 6);
  });
});

describe('setGridModel: Input Validation & Metric Fillers', () => {
  test('isNumericGridValue allows grid-friendly decimal input only', () => {
    assert.equal(isNumericGridValue(''), true);
    assert.equal(isNumericGridValue('80.5'), true);
    assert.equal(isNumericGridValue('80kg'), false);
    assert.equal(isNumericGridValue('-1'), false);
  });

  test('isCompletedRepsValue requires a non-empty numeric value', () => {
    assert.equal(isCompletedRepsValue('8'), true);
    assert.equal(isCompletedRepsValue('0'), true);
    assert.equal(isCompletedRepsValue(''), false);
    assert.equal(isCompletedRepsValue('.'), false);
    assert.equal(isCompletedRepsValue('8회'), false);
  });

  test('isCommittedNumericGridValue accepts committed numeric cell values', () => {
    assert.equal(isCommittedNumericGridValue('80'), true);
    assert.equal(isCommittedNumericGridValue('80.'), true);
    assert.equal(isCommittedNumericGridValue(''), false);
    assert.equal(isCommittedNumericGridValue('.'), false);
    assert.equal(isCommittedNumericGridValue('80kg'), false);
  });

  test('fillExerciseWeightsFromFirstSet fills empty weights in the same exercise block', () => {
    const blocks = [
      {
        id: 'block-a',
        sets: [
          { id: 'a-1', set_number: 1, weight: '', reps: '' },
          { id: 'a-2', set_number: 2, weight: '', reps: '' },
          { id: 'a-3', set_number: 3, weight: '82.5', reps: '' },
        ],
      },
      {
        id: 'block-b',
        sets: [
          { id: 'b-1', set_number: 1, weight: '', reps: '' },
        ],
      },
    ];

    const updated = fillExerciseWeightsFromFirstSet(blocks, 0, 0, '80');

    assert.deepEqual(
      updated[0].sets.map((set) => set.weight),
      ['80', '80', '82.5'],
    );
    assert.deepEqual(
      updated[1].sets.map((set) => set.weight),
      [''],
    );
  });

  test('fillExerciseWeightsFromFirstSet only runs from the first set with a committed number', () => {
    const blocks = [
      {
        id: 'block-a',
        sets: [
          { id: 'a-1', set_number: 1, weight: '', reps: '' },
          { id: 'a-2', set_number: 2, weight: '', reps: '' },
        ],
      },
    ];

    assert.equal(fillExerciseWeightsFromFirstSet(blocks, 0, 1, '80'), blocks);
    assert.equal(fillExerciseWeightsFromFirstSet(blocks, 0, 0, '.'), blocks);
  });

  test('fillExerciseWeightsFromFirstSet isolates grouped exercises (only fills matching exercise)', () => {
    const blocks = [
      {
        id: 'block-group',
        is_group: true,
        sets: [
          { id: 'g-1', set_number: 1, weight: '', reps: '', exercise_id: 'exA' },
          { id: 'g-2', set_number: 1, weight: '', reps: '', exercise_id: 'exB' },
          { id: 'g-3', set_number: 2, weight: '', reps: '', exercise_id: 'exA' },
          { id: 'g-4', set_number: 2, weight: '', reps: '', exercise_id: 'exB' },
        ],
      },
    ];

    // Trigger autocomplete on Exercise A's first set (index 0)
    const updatedA = fillExerciseWeightsFromFirstSet(blocks, 0, 0, '50');
    assert.deepEqual(
      updatedA[0].sets.map((set) => set.weight),
      ['50', '', '50', ''],
    );

    // Trigger autocomplete on Exercise B's first set (index 1)
    const updatedB = fillExerciseWeightsFromFirstSet(blocks, 0, 1, '60');
    assert.deepEqual(
      updatedB[0].sets.map((set) => set.weight),
      ['', '60', '', '60'],
    );
  });

  test('fillExerciseWeightsFromFirstSet works from any row of the first set (e.g. unilateral Side R)', () => {
    const blocks = [
      {
        id: 'block-uni',
        sets: [
          { id: 'u-1', set_number: 1, side: 'L', weight: '', reps: '', exercise_id: 'exA' },
          { id: 'u-2', set_number: 1, side: 'R', weight: '', reps: '', exercise_id: 'exA' },
          { id: 'u-3', set_number: 2, side: 'L', weight: '', reps: '', exercise_id: 'exA' },
          { id: 'u-4', set_number: 2, side: 'R', weight: '', reps: '', exercise_id: 'exA' },
        ],
      },
    ];

    // Trigger autocomplete from index 1 (Set 1, R)
    const updated = fillExerciseWeightsFromFirstSet(blocks, 0, 1, '15');
    assert.deepEqual(
      updated[0].sets.map((set) => set.weight),
      ['15', '15', '15', '15'],
    );
  });
});

describe('setGridModel: Rest Timer Payload Computations', () => {
  test('getSetCompletionKey identifies one rendered set row', () => {
    assert.equal(
      getSetCompletionKey({ id: 'link-a' }, { set_number: 2, side: 'R' }),
      'link-a:2:R',
    );
    assert.equal(
      getSetCompletionKey({ id: 'link-a' }, { set_number: 2 }),
      'link-a:2:both',
    );
  });

  test('getSetCompletionKey includes exercise_id if present to isolate grouped exercises', () => {
    assert.equal(
      getSetCompletionKey({ id: 'group-1' }, { set_number: 1, side: 'both', exercise_id: 'exA' }),
      'group-1:1:both:exA',
    );
  });

  test('getRestTimerPayloadForCompletedSet uses set rest before the final set', () => {
    const payload = getRestTimerPayloadForCompletedSet({
      blocks: [
        {
          id: 'link-a',
          exercise_id: 'bench',
          exercise_name: 'Bench Press',
          sets: [
            { set_number: 1, side: 'both' },
            { set_number: 2, side: 'both' },
          ],
        },
        {
          id: 'link-b',
          exercise_id: 'row',
          exercise_name: 'Row',
          sets: [{ set_number: 1, side: 'both' }],
        },
      ],
      sessionExercises: [{ id: 'link-a', rest_between_sets: 75, rest_after_exercise: 150 }],
      blockIndex: 0,
      rowIndex: 0,
    });

    assert.deepEqual(payload, {
      mode: 'set',
      durationSeconds: 75,
      exerciseId: 'bench',
      exerciseName: 'Bench Press',
      setNumber: 1,
    });
  });

  test('getRestTimerPayloadForCompletedSet uses exercise rest after the final set when another exercise follows', () => {
    const payload = getRestTimerPayloadForCompletedSet({
      blocks: [
        {
          id: 'link-a',
          exercise_id: 'bench',
          exercise_name: 'Bench Press',
          sets: [{ set_number: 1, side: 'both' }],
        },
        {
          id: 'link-b',
          exercise_id: 'row',
          exercise_name: 'Row',
          sets: [{ set_number: 1, side: 'both' }],
        },
      ],
      sessionExercises: [{ id: 'link-a', rest_between_sets: 75, rest_after_exercise: 150 }],
      blockIndex: 0,
      rowIndex: 0,
    });

    assert.deepEqual(payload, {
      mode: 'exercise',
      durationSeconds: 150,
      exerciseId: 'bench',
      exerciseName: 'Bench Press',
      nextExerciseId: 'row',
      nextExerciseName: 'Row',
      setNumber: 1,
    });
  });

  test('getRestTimerPayloadForCompletedSet waits for the final side of unilateral sets', () => {
    const blocks = [
      {
        id: 'link-a',
        exercise_id: 'lunge',
        exercise_name: 'Lunge',
        sets: [
          { set_number: 1, side: 'L' },
          { set_number: 1, side: 'R' },
          { set_number: 2, side: 'L' },
          { set_number: 2, side: 'R' },
        ],
      },
    ];
    const sessionExercises = [{ id: 'link-a', rest_between_sets: 60, rest_after_exercise: 120 }];

    assert.equal(
      getRestTimerPayloadForCompletedSet({ blocks, sessionExercises, blockIndex: 0, rowIndex: 0 }),
      null,
    );
    assert.deepEqual(
      getRestTimerPayloadForCompletedSet({ blocks, sessionExercises, blockIndex: 0, rowIndex: 1 }),
      {
        mode: 'set',
        durationSeconds: 60,
        exerciseId: 'lunge',
        exerciseName: 'Lunge',
        setNumber: 1,
      },
    );
  });

  test('getRestTimerPayloadForCompletedSet skips after the final exercise', () => {
    const payload = getRestTimerPayloadForCompletedSet({
      blocks: [
        {
          id: 'link-a',
          exercise_id: 'bench',
          exercise_name: 'Bench Press',
          sets: [{ set_number: 1, side: 'both' }],
        },
      ],
      sessionExercises: [{ id: 'link-a', rest_after_exercise: 150 }],
      blockIndex: 0,
      rowIndex: 0,
    });

    assert.equal(payload, null);
  });

  test('getRestTimerPayloadForCompletedSet triggers rest between rounds (sets) in a group block', () => {
    const blocks = [
      {
        id: 'group-a',
        is_group: true,
        group_name: 'Superset A',
        exercise_name: 'Superset A (Bench + Row)',
        group_exercises: [
          { exercise_id: 'bench', name: 'Bench Press', target_sets: 2 },
          { exercise_id: 'row', name: 'Row', target_sets: 2 },
        ],
        sets: [
          { set_number: 1, side: 'both', exercise_id: 'bench', session_exercise_id: 'link-bench' },
          { set_number: 1, side: 'both', exercise_id: 'row', session_exercise_id: 'link-row' },
          { set_number: 2, side: 'both', exercise_id: 'bench', session_exercise_id: 'link-bench' },
          { set_number: 2, side: 'both', exercise_id: 'row', session_exercise_id: 'link-row' },
        ],
      },
    ];
    const sessionExercises = [
      { id: 'link-bench', rest_between_sets: 60, rest_after_exercise: 120 },
      { id: 'link-row', rest_between_sets: 90, rest_after_exercise: 150 },
    ];

    // Finishing bench in round 1 should NOT trigger rest
    const payloadBenchRound1 = getRestTimerPayloadForCompletedSet({
      blocks,
      sessionExercises,
      blockIndex: 0,
      rowIndex: 0, // bench set 1
    });
    assert.equal(payloadBenchRound1, null);

    // Finishing row in round 1 should trigger rest using row's rest_between_sets
    const payloadRowRound1 = getRestTimerPayloadForCompletedSet({
      blocks,
      sessionExercises,
      blockIndex: 0,
      rowIndex: 1, // row set 1
    });
    assert.deepEqual(payloadRowRound1, {
      mode: 'set',
      durationSeconds: 90,
      exerciseId: 'group-a',
      exerciseName: 'Superset A (Bench + Row)',
      setNumber: 1,
    });
  });
});
