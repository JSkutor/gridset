import { test, describe, beforeEach } from 'vitest';
import assert from 'node:assert/strict';

const { useWorkoutStore } = await import('../useWorkoutStore.js');

beforeEach(() => {
  window.localStorage.clear();
  useWorkoutStore.getState().clearAllData();
});

describe('authSlice: runRemoteSync', () => {
  test('serializes tasks with same dedupKey (cancel should win over create)', async () => {
    const order = [];

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    useWorkoutStore.getState().runRemoteSync(
      'addSession (simulated)',
      async () => {
        await wait(30);
        order.push('add');
      },
      { dedupKey: 'session:test-id' },
    );

    useWorkoutStore.getState().runRemoteSync(
      'deleteSession (simulated)',
      async () => {
        order.push('delete');
      },
      { dedupKey: 'session:test-id' },
    );

    await wait(80);
    assert.deepEqual(order, ['add', 'delete']);
  });
});

