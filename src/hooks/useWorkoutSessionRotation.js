import { useMemo, useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';

export function useWorkoutSessionRotation() {
  const routines = useWorkoutStore(state => state.routines);
  const sessions = useWorkoutStore(state => state.sessions);
  const workoutLogs = useWorkoutStore(state => state.workoutLogs);

  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // 1. 최신 루틴 (완료된 수행 로그의 세션 기준 -> 없으면 수정일/생성일 최신 루틴)
  const latestRoutine = useMemo(() => {
    if (routines.length === 0) return null;

    // session_id가 매핑된 운동 로그를 수행 시작 최신순으로 정렬
    const completedLogs = [...workoutLogs]
      .filter(log => log.session_id)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    if (completedLogs.length > 0) {
      const latestSessionId = completedLogs[0].session_id;
      const latestSession = sessions.find(s => s.id === latestSessionId);
      if (latestSession) {
        const routineOfLatestSession = routines.find(r => r.id === latestSession.routine_id);
        if (routineOfLatestSession) return routineOfLatestSession;
      }
    }

    // 수행 로그가 없는 경우: 생성/수정일이 가장 최신인 루틴
    return [...routines].sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.updated_at || b.created_at).getTime();
      return timeB - timeA;
    })[0];
  }, [routines, sessions, workoutLogs]);

  // 2. 최신 루틴에 포함된 세션들 (session_order 기준 순서 정렬)
  const latestRoutineSessions = useMemo(() => {
    if (!latestRoutine) return [];
    return sessions
      .filter(s => s.routine_id === latestRoutine.id)
      .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));
  }, [latestRoutine, sessions]);

  // 3. 최근 수행한 세션의 다음 세션 로테이션 (기본값은 첫 세션인 Day A)
  const nextDefaultSession = useMemo(() => {
    if (latestRoutineSessions.length === 0) return null;

    const sessionIds = new Set(latestRoutineSessions.map(s => s.id));
    
    // 최신 루틴 세션들 중 최근 수행한 로그 조회
    const routineLogs = workoutLogs
      .filter(log => log.session_id && sessionIds.has(log.session_id))
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    if (routineLogs.length > 0) {
      const lastSessionId = routineLogs[0].session_id;
      const lastIndex = latestRoutineSessions.findIndex(s => s.id === lastSessionId);
      if (lastIndex !== -1) {
        const nextIndex = (lastIndex + 1) % latestRoutineSessions.length;
        return latestRoutineSessions[nextIndex];
      }
    }

    return latestRoutineSessions[0] || null;
  }, [latestRoutineSessions, workoutLogs]);

  // 4. 활성화할 세션 결정
  const selectedSession = useMemo(() => {
    if (selectedSessionId) {
      const found = latestRoutineSessions.find(s => s.id === selectedSessionId);
      if (found) return found;
    }
    return nextDefaultSession || latestRoutineSessions[0] || null;
  }, [selectedSessionId, latestRoutineSessions, nextDefaultSession]);

  return {
    latestRoutineSessions,
    selectedSession,
    setSelectedSessionId,
  };
}
