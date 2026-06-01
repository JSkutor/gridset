import type { Id, Routine, Session } from '../types/workout';

type SessionSummary = Pick<Session, 'id' | 'name' | 'routine_id' | 'session_order'>;
type RoutineSummary = Pick<Routine, 'id'>;

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

export function isTemporarySession(session?: Pick<Session, 'session_order'> | null): boolean {
  return session?.session_order !== null &&
    session?.session_order !== undefined &&
    Number(session.session_order) === TEMPORARY_SESSION_ORDER;
}

export function getRegularRoutineSessions<T extends Pick<Session, 'routine_id' | 'session_order'>>(
  allSessions: T[] | null | undefined,
  routineId: Id | null | undefined,
): T[] {
  if (!allSessions || !routineId) return [];
  return allSessions
    .filter((session) => session.routine_id === routineId && !isTemporarySession(session))
    .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));
}

export function getRoutineTemporarySession<T extends Pick<Session, 'routine_id' | 'session_order'>>(
  allSessions: T[] | null | undefined,
  routineId: Id | null | undefined,
): T | null {
  if (!allSessions || !routineId) return null;
  return allSessions.find((session) => session.routine_id === routineId && isTemporarySession(session)) || null;
}

export function getSessionColor(session?: Pick<Session, 'session_order'> | null): string {
  if (isTemporarySession(session)) return TEMPORARY_SESSION_COLOR;
  const order = Number(session?.session_order) || 1;
  return SESSION_COLORS[Math.max(1, order) - 1] || '#6B7394';
}

export function getSessionDayLetter(
  session: SessionSummary | null | undefined,
  allSessions: SessionSummary[] | null | undefined,
): string {
  if (!session || !allSessions) return '';
  if (isTemporarySession(session)) return '';
  const routineSessions = getRegularRoutineSessions(allSessions, session.routine_id);
  
  const index = routineSessions.findIndex(s => s.id === session.id);
  if (index === -1) return '';
  return String.fromCharCode(65 + (index % 26));
}

export function getFormattedSessionName(
  session: SessionSummary | null | undefined,
  allSessions: SessionSummary[] | null | undefined,
): string {
  if (!session) return '';
  if (isTemporarySession(session)) return `임시 : ${session.name}`;
  const dayLetter = getSessionDayLetter(session, allSessions);
  return dayLetter ? `Day ${dayLetter} : ${session.name}` : session.name;
}

export function isRoutineReadOnly(
  routineId: Id | null | undefined,
  sortedRoutines: RoutineSummary[],
): boolean {
  if (!routineId || sortedRoutines.length === 0) return false;
  return routineId !== sortedRoutines[0].id;
}
