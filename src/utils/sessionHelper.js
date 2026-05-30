export const SESSION_COLORS = [
  '#8BD5CA',
  '#A6DA95',
  '#EED49F',
  '#F5A97F',
  '#F0A6CA',
  '#C6A0F6',
  '#E78284',
];

export const MAX_SESSIONS_PER_ROUTINE = SESSION_COLORS.length;
export const TEMPORARY_SESSION_ORDER = 0;
export const TEMPORARY_SESSION_COLOR = '#9ECE6A';

export function isTemporarySession(session) {
  return session?.session_order !== null &&
    session?.session_order !== undefined &&
    Number(session.session_order) === TEMPORARY_SESSION_ORDER;
}

export function getRegularRoutineSessions(allSessions, routineId) {
  if (!allSessions || !routineId) return [];
  return allSessions
    .filter((session) => session.routine_id === routineId && !isTemporarySession(session))
    .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));
}

export function getRoutineTemporarySession(allSessions, routineId) {
  if (!allSessions || !routineId) return null;
  return allSessions.find((session) => session.routine_id === routineId && isTemporarySession(session)) || null;
}

export function getSessionColor(session) {
  if (isTemporarySession(session)) return TEMPORARY_SESSION_COLOR;
  const order = Number(session?.session_order) || 1;
  return SESSION_COLORS[Math.max(1, order) - 1] || '#6B7394';
}

/**
 * Calculates the Day letter (A, B, C...) for a session based on its order in the routine.
 * 
 * @param {object} session The session object
 * @param {array} allSessions All sessions from the store
 * @returns {string} The day letter (e.g., 'A', 'B') or empty string if not found
 */
export function getSessionDayLetter(session, allSessions) {
  if (!session || !allSessions) return '';
  if (isTemporarySession(session)) return '';
  const routineSessions = getRegularRoutineSessions(allSessions, session.routine_id);
  
  const index = routineSessions.findIndex(s => s.id === session.id);
  if (index === -1) return '';
  return String.fromCharCode(65 + (index % 26));
}

/**
 * Returns the fully formatted session name with the "Day X : " prefix.
 * 
 * @param {object} session The session object
 * @param {array} allSessions All sessions from the store
 * @returns {string} Formatted session name (e.g., "Day A : 상체 (Push & Pull)")
 */
export function getFormattedSessionName(session, allSessions) {
  if (!session) return '';
  if (isTemporarySession(session)) return `임시 : ${session.name}`;
  const dayLetter = getSessionDayLetter(session, allSessions);
  return dayLetter ? `Day ${dayLetter} : ${session.name}` : session.name;
}

export function isRoutineReadOnly(routineId, sortedRoutines) {
  if (!routineId || sortedRoutines.length === 0) return false;
  return routineId !== sortedRoutines[0].id;
}

