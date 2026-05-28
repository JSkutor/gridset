import test from 'node:test';
import assert from 'node:assert/strict';
import { getFormattedSessionName, getSessionDayLetter } from './sessionHelper.js';

const sessions = [
  { id: 'push', routine_id: 'ppl', name: 'Push', session_order: 2 },
  { id: 'pull', routine_id: 'ppl', name: 'Pull', session_order: 1 },
  { id: 'legs', routine_id: 'ppl', name: 'Legs', session_order: 3 },
  { id: 'upper', routine_id: 'upper-lower', name: 'Upper', session_order: 1 },
];

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
