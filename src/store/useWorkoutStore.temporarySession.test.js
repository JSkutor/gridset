import { beforeEach, describe, test } from 'vitest';
import assert from 'node:assert/strict';
import {
  MAX_SESSIONS_PER_ROUTINE,
  TEMPORARY_SESSION_ORDER,
  getRegularRoutineSessions,
  getRoutineTemporarySession,
} from '../utils/sessionHelper.js';

const { useWorkoutStore } = await import('./useWorkoutStore.js');

const guestUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: '게스트',
  isGuest: true,
};

beforeEach(() => {
  window.localStorage.clear();
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

describe('Workout Store: Temporary Sessions', () => {
  test('createTemporarySession creates at most one temporary session per routine', () => {
    const routine = useWorkoutStore.getState().addRoutine('PPL');
    const temporary = useWorkoutStore.getState().createTemporarySession(routine.id, '오늘 보강');
    const duplicate = useWorkoutStore.getState().createTemporarySession(routine.id, '다른 이름');

    assert.equal(temporary.session_order, TEMPORARY_SESSION_ORDER);
    assert.equal(duplicate.id, temporary.id);
    assert.equal(getRoutineTemporarySession(useWorkoutStore.getState().sessions, routine.id).id, temporary.id);
  });

  test('temporary sessions do not count toward the regular session cap', () => {
    const routine = useWorkoutStore.getState().addRoutine('Capped');
    const temporary = useWorkoutStore.getState().createTemporarySession(routine.id);
    const created = Array.from({ length: MAX_SESSIONS_PER_ROUTINE }, (_, index) =>
      useWorkoutStore.getState().addSession(routine.id, `Day ${index + 1}`),
    );
    const overflow = useWorkoutStore.getState().addSession(routine.id, 'Overflow');
    const regularSessions = getRegularRoutineSessions(useWorkoutStore.getState().sessions, routine.id);

    assert.equal(created.every(Boolean), true);
    assert.equal(overflow, null);
    assert.equal(regularSessions.length, MAX_SESSIONS_PER_ROUTINE);
    assert.equal(useWorkoutStore.getState().sessions.some((session) => session.id === temporary.id), true);
  });

  test('regular deletion and reorder leave the temporary session outside ordering', () => {
    const routine = useWorkoutStore.getState().addRoutine('Order');
    const first = useWorkoutStore.getState().addSession(routine.id, 'A');
    const second = useWorkoutStore.getState().addSession(routine.id, 'B');
    const third = useWorkoutStore.getState().addSession(routine.id, 'C');
    const temporary = useWorkoutStore.getState().createTemporarySession(routine.id);

    useWorkoutStore.getState().deleteSession(second.id);
    useWorkoutStore.getState().reorderSessions(routine.id, [third.id, first.id, temporary.id]);

    const stateSessions = useWorkoutStore.getState().sessions;
    const regularSessions = getRegularRoutineSessions(stateSessions, routine.id);
    const storedTemporary = getRoutineTemporarySession(stateSessions, routine.id);

    assert.deepEqual(
      regularSessions.map(({ id, session_order }) => ({ id, session_order })),
      [
        { id: third.id, session_order: 1 },
        { id: first.id, session_order: 2 },
      ],
    );
    assert.equal(storedTemporary.id, temporary.id);
    assert.equal(storedTemporary.session_order, TEMPORARY_SESSION_ORDER);
  });
});
