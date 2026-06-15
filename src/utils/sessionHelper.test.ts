// @ts-nocheck
import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import {
  getFormattedSessionName,
  getRegularRoutineSessions,
  getRoutineTemporarySession,
  getSessionColor,
  getSessionDayLetter,
  isTemporarySession,
  MAX_SESSIONS_PER_ROUTINE,
  SESSION_COLORS,
  TEMPORARY_SESSION_COLOR,
  TEMPORARY_SESSION_ORDER,
  isRoutineReadOnly,
} from './sessionHelper.js';

const sessions = [
  { id: 'push', routine_id: 'ppl', name: 'Push', session_order: 2 },
  { id: 'pull', routine_id: 'ppl', name: 'Pull', session_order: 1 },
  { id: 'legs', routine_id: 'ppl', name: 'Legs', session_order: 3 },
  { id: 'upper', routine_id: 'upper-lower', name: 'Upper', session_order: 1 },
  { id: 'temp', routine_id: 'ppl', name: '오늘 보강', session_order: TEMPORARY_SESSION_ORDER },
];

describe('sessionHelper: Day Lettering & Palette Styling', () => {
  test('getSessionDayLetter uses routine-local ordering', () => {
    assert.equal(getSessionDayLetter(sessions[1], sessions), 'A');
    assert.equal(getSessionDayLetter(sessions[0], sessions), 'B');
    assert.equal(getSessionDayLetter(sessions[2], sessions), 'C');
    assert.equal(getSessionDayLetter(sessions[3], sessions), 'A');
  });

  test('getFormattedSessionName prefixes the derived day label', () => {
    assert.equal(getFormattedSessionName(sessions[0], sessions), 'Day B : Push');
    assert.equal(getFormattedSessionName(null, sessions), '');
  });

  test('getSessionDayLetter handles missing sessions defensively', () => {
    assert.equal(getSessionDayLetter(null, sessions), '');
    assert.equal(getSessionDayLetter({ id: 'missing', routine_id: 'ppl' }, sessions), '');
  });

  test('getSessionColor follows session order without cycling after the palette ends', () => {
    assert.equal(getSessionColor({ session_order: 1 }), SESSION_COLORS[0]);
    assert.equal(getSessionColor({ session_order: MAX_SESSIONS_PER_ROUTINE }), SESSION_COLORS[6]);
    assert.equal(getSessionColor({ session_order: MAX_SESSIONS_PER_ROUTINE + 1 }), '#6B7394');
  });

  test('temporary sessions sit outside day ordering', () => {
    const temporarySession = sessions.find((session) => session.id === 'temp');

    assert.equal(isTemporarySession(temporarySession), true);
    assert.equal(getSessionDayLetter(temporarySession, sessions), '');
    assert.equal(getFormattedSessionName(temporarySession, sessions), '임시 : 오늘 보강');
    assert.equal(getSessionColor(temporarySession), TEMPORARY_SESSION_COLOR);
    assert.deepEqual(
      getRegularRoutineSessions(sessions, 'ppl').map((session) => session.id),
      ['pull', 'push', 'legs'],
    );
    assert.equal(getRoutineTemporarySession(sessions, 'ppl').id, temporarySession.id);
  });

  test('isRoutineReadOnly correctly determines read-only status', () => {
    const sortedRoutines = [
      { id: 'routine-1', name: 'Routine 1' },
      { id: 'routine-2', name: 'Routine 2' },
      { id: 'routine-3', name: 'Routine 3' },
    ];

    // Under normal circumstances, any routine except the first (latest) is read-only.
    assert.equal(isRoutineReadOnly('routine-1', sortedRoutines), false);
    assert.equal(isRoutineReadOnly('routine-2', sortedRoutines), true);
    assert.equal(isRoutineReadOnly('routine-3', sortedRoutines), true);

    // Edge cases
    assert.equal(isRoutineReadOnly(null, sortedRoutines), false);
    assert.equal(isRoutineReadOnly('routine-1', []), false);
  });
});
