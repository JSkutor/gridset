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

export function getSessionColor(session) {
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
  const routineSessions = allSessions
    .filter(s => s.routine_id === session.routine_id)
    .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));
  
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
  const dayLetter = getSessionDayLetter(session, allSessions);
  return dayLetter ? `Day ${dayLetter} : ${session.name}` : session.name;
}
