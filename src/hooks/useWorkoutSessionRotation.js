import { useMemo, useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { getRegularRoutineSessions, getRoutineTemporarySession } from '../utils/sessionHelper';

export function useWorkoutSessionRotation() {
  const routines = useWorkoutStore(state => state.routines);
  const sessions = useWorkoutStore(state => state.sessions);
  const workoutLogs = useWorkoutStore(state => state.workoutLogs);

  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // 1. 최신 루틴 (생성일이 가장 최신인 루틴)
  const latestRoutine = useMemo(() => {
    if (routines.length === 0) return null;

    return [...routines].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    })[0];
  }, [routines]);

  // 2. 최신 루틴에 포함된 정규 세션들 (session_order 기준 순서 정렬)
  const latestRoutineRegularSessions = useMemo(() => {
    if (!latestRoutine) return [];
    return getRegularRoutineSessions(sessions, latestRoutine.id);
  }, [latestRoutine, sessions]);

  const latestRoutineTemporarySession = useMemo(() => {
    if (!latestRoutine) return null;
    return getRoutineTemporarySession(sessions, latestRoutine.id);
  }, [latestRoutine, sessions]);

  const latestRoutineSessions = useMemo(() => {
    if (!latestRoutineTemporarySession) return latestRoutineRegularSessions;
    return [...latestRoutineRegularSessions, latestRoutineTemporarySession];
  }, [latestRoutineRegularSessions, latestRoutineTemporarySession]);

  // 3. 최근 수행한 세션의 다음 세션 로테이션 (기본값은 첫 세션인 Day A)
  const nextDefaultSession = useMemo(() => {
    if (latestRoutineRegularSessions.length === 0) return null;

    const sessionIds = new Set(latestRoutineRegularSessions.map(s => s.id));
    
    // 최신 루틴의 정규 세션들 중 최근 수행한 로그 조회. 임시 세션 기록은 순서를 넘기지 않는다.
    const routineLogs = workoutLogs
      .filter(log => log.session_id && sessionIds.has(log.session_id))
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    if (routineLogs.length > 0) {
      const lastSessionId = routineLogs[0].session_id;
      const lastIndex = latestRoutineRegularSessions.findIndex(s => s.id === lastSessionId);
      if (lastIndex !== -1) {
        const nextIndex = (lastIndex + 1) % latestRoutineRegularSessions.length;
        return latestRoutineRegularSessions[nextIndex];
      }
    }

    return latestRoutineRegularSessions[0] || null;
  }, [latestRoutineRegularSessions, workoutLogs]);

  // 4. 활성화할 세션 결정
  const selectedSession = useMemo(() => {
    if (selectedSessionId) {
      const found = latestRoutineSessions.find(s => s.id === selectedSessionId);
      if (found) return found;
    }
    return nextDefaultSession || latestRoutineRegularSessions[0] || latestRoutineTemporarySession || null;
  }, [selectedSessionId, latestRoutineSessions, latestRoutineRegularSessions, latestRoutineTemporarySession, nextDefaultSession]);

  return {
    latestRoutineSessions,
    selectedSession,
    setSelectedSessionId,
  };
}
