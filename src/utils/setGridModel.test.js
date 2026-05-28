import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInitialBlocks,
  computeNewGlobalIndex,
  flattenBlocks,
  isNumericGridValue,
} from './setGridModel.js';

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

test('isNumericGridValue allows grid-friendly decimal input only', () => {
  assert.equal(isNumericGridValue(''), true);
  assert.equal(isNumericGridValue('80.5'), true);
  assert.equal(isNumericGridValue('80kg'), false);
  assert.equal(isNumericGridValue('-1'), false);
});
