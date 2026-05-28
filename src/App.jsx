import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navigation from './components/Navigation'
import ExerciseInfo from './components/ExerciseInfo'
import SetGrid from './components/SetGrid'
import PastLogs from './components/PastLogs'
import RoutineDetail from './components/RoutineDetail'
import LogPage from './components/LogPage'
import RestTimer from './components/RestTimer'
import { useWorkoutStore } from './store/useWorkoutStore'
import { useTabNavigation } from './hooks/useTabNavigation'
import { User } from 'lucide-react'
import { getFormattedSessionName } from './utils/sessionHelper'
import './index.css'

const NAV_TAB_IDS = ['R', 'S', 'L'];
const NAV_SHORTCUTS = {
  KeyQ: 'R',
  KeyW: 'S',
  KeyE: 'L',
};

// Retired number-key shortcuts (silenced to avoid accidental browser actions)
const RETIRED_NAV_SHORTCUT_KEYS = new Set(['1', '2', '3']);


function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('S')
  const [activeExerciseId, setActiveExerciseId] = useState(null)
  const [restTimer, setRestTimer] = useState(null)

  // Ref for SetGrid imperative focus methods (C-key toggle)
  const setGridRef = useRef(null);
  const routineDetailRef = useRef(null);
  
  const generateDummyData = useWorkoutStore(state => state.generateDummyData);
  const clearAllData = useWorkoutStore(state => state.clearAllData);
  const routines = useWorkoutStore(state => state.routines);
  const sessions = useWorkoutStore(state => state.sessions);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);
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

  const defaultExerciseId = useMemo(() => {
    if (!selectedSession) return null;
    return sessionExercises.find(se => se.session_id === selectedSession.id)?.exercise_id || null;
  }, [selectedSession, sessionExercises]);

  const effectiveActiveExerciseId = activeExerciseId || defaultExerciseId;

  const handleGenerateDummyData = () => {
    generateDummyData();
    setSelectedSessionId(null);
    setActiveExerciseId(null);
    setRestTimer(null);
  };

  const handleClearAllData = () => {
    clearAllData();
    setSelectedSessionId(null);
    setActiveExerciseId(null);
    setRestTimer(null);
  };

  const handleRestStart = useCallback((payload) => {
    const durationSeconds = Math.max(0, Math.round(Number(payload.durationSeconds) || 0));

    if (durationSeconds <= 0) {
      setRestTimer(null);
      return;
    }

    setRestTimer({
      ...payload,
      id: `${Date.now()}-${payload.mode}-${payload.exerciseId || 'rest'}`,
      durationSeconds,
      remainingSeconds: durationSeconds,
      endsAt: Date.now() + durationSeconds * 1000,
      isPaused: false,
    });
  }, []);

  const handleToggleRestPause = useCallback(() => {
    setRestTimer((currentTimer) => {
      if (!currentTimer || currentTimer.remainingSeconds <= 0) return currentTimer;

      if (currentTimer.isPaused) {
        return {
          ...currentTimer,
          isPaused: false,
          endsAt: Date.now() + currentTimer.remainingSeconds * 1000,
        };
      }

      return {
        ...currentTimer,
        isPaused: true,
        remainingSeconds: Math.max(0, Math.ceil((currentTimer.endsAt - Date.now()) / 1000)),
      };
    });
  }, []);

  const handleDismissRestTimer = useCallback(() => {
    setRestTimer(null);
  }, []);

  useEffect(() => {
    if (!restTimer?.id || restTimer.isPaused || restTimer.remainingSeconds <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      setRestTimer((currentTimer) => {
        if (!currentTimer || currentTimer.isPaused) return currentTimer;

        const remainingSeconds = Math.max(0, Math.ceil((currentTimer.endsAt - Date.now()) / 1000));
        if (remainingSeconds === currentTimer.remainingSeconds) return currentTimer;

        return {
          ...currentTimer,
          remainingSeconds,
        };
      });
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [restTimer]);

  // ── Q / W / E: switch top-level tabs ────────────────────────────────────
  useTabNavigation({
    tabIds: NAV_TAB_IDS,
    shortcuts: NAV_SHORTCUTS,
    setActiveTab,
  });

  // ── Miscellaneous global shortcuts (Escape, Backquote, Cmd+Arrow, retired 1/2/3) ──
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // ESC: blur any focused element so shortcuts become available again.
      if (event.key === 'Escape') {
        if (document.activeElement && document.activeElement !== document.body) {
          event.preventDefault();
          document.activeElement.blur();
        }
        return;
      }

      // ` / ₩ key: focus into grid / toggle grid ↔ memo / routine focus.
      // event.code 'Backquote' captures both ` (en) and ₩ (ko) regardless of IME.
      // This key is never a normal text input so we always intercept it safely.
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
      if (!hasModifier && event.code === 'Backquote') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const grid = setGridRef.current;
        const routineDetail = routineDetailRef.current;
        if (grid) {
          const activeEl = document.activeElement;
          const isInGrid = activeEl && activeEl.closest && activeEl.closest('.spreadsheet');
          const isInNote = grid.isNoteFocused();
          if (isInNote) {
            grid.focusGrid();
          } else if (isInGrid) {
            grid.focusNote();
          } else {
            grid.focusGrid();
          }
        } else if (routineDetail) {
          routineDetail.focusFirstSessionFirstExercise();
        }
        return;
      }

      if (event.defaultPrevented || isEditableTarget(event.target)) return;

      // Silence retired 1 / 2 / 3 shortcuts.
      if (!hasModifier && RETIRED_NAV_SHORTCUT_KEYS.has(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      // Cmd/Ctrl + Arrow: cycle through top-level tabs.
      if ((event.metaKey || event.ctrlKey) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setActiveTab((currentTab) => {
          const currentIndex = Math.max(0, NAV_TAB_IDS.indexOf(currentTab));
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const nextIndex = (currentIndex + direction + NAV_TAB_IDS.length) % NAV_TAB_IDS.length;
          return NAV_TAB_IDS[nextIndex];
        });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, []);

  const setGridKey = useMemo(() => {
    if (!selectedSession) return 'empty-session';
    const exerciseSignature = sessionExercises
      .filter(se => se.session_id === selectedSession.id)
      .sort((a, b) => a.order - b.order)
      .map(se => `${se.id}:${se.exercise_id}:${se.order}:${se.target_sets}:${se.target_record}`)
      .join('|');
    return `${selectedSession.id}:${exerciseSignature}`;
  }, [selectedSession, sessionExercises]);

  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Guest Mode Indicator Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(122, 162, 247, 0.08)',
          border: '1px solid rgba(122, 162, 247, 0.2)',
          borderRadius: '6px',
          color: 'var(--accent)',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '-0.02em',
          boxShadow: '0 2px 8px rgba(122, 162, 247, 0.05)',
          cursor: 'default',
          userSelect: 'none'
        }}>
          <User size={12} />
          로컬 게스트 모드
        </div>

        
        <button onClick={handleGenerateDummyData} style={{ padding: '6px 10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)' }}>
          더미 데이터 생성 🚀
        </button>
        <button onClick={handleClearAllData} style={{ padding: '6px 10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)' }}>
          초기화 🗑️
        </button>
      </div>
      
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <RestTimer
        timer={restTimer}
        isVisible={activeTab === 'S'}
        onTogglePause={handleToggleRestPause}
        onDismiss={handleDismissRestTimer}
      />

      {activeTab === 'S' && (
        <main className="main-grid">
          <ExerciseInfo activeExerciseId={effectiveActiveExerciseId} />
          <SetGrid 
            ref={setGridRef}
            key={setGridKey}
            session={selectedSession} 
            latestRoutineSessions={latestRoutineSessions}
            onSessionChange={setSelectedSessionId}
            onExerciseFocus={setActiveExerciseId} 
            onRestStart={handleRestStart}
          />
          <PastLogs activeExerciseId={effectiveActiveExerciseId} />
        </main>
      )}

      {activeTab === 'R' && (
        <main style={{ flex: 1, padding: '24px 32px 32px 32px', overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
          <RoutineDetail ref={routineDetailRef} />
        </main>
      )}
      
      {activeTab === 'L' && (
        <main style={{ flex: 1, minHeight: 0, padding: '24px 32px 32px 32px', overflowX: 'hidden', overflowY: 'auto' }}>
          <LogPage />
        </main>
      )}
    </div>
  )
}

export default App
