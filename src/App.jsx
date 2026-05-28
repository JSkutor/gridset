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
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useSessionRotation } from './hooks/useSessionRotation'
import { User } from 'lucide-react'
import './index.css'

const NAV_TAB_IDS = ['R', 'S', 'L'];
const NAV_SHORTCUTS = {
  KeyQ: 'R',
  KeyW: 'S',
  KeyE: 'L',
};

function App() {
  const [activeTab, setActiveTab] = useState('S')
  const [activeExerciseId, setActiveExerciseId] = useState(null)
  const [restTimer, setRestTimer] = useState(null)

  // Ref for SetGrid imperative focus methods (C-key toggle)
  const setGridRef = useRef(null);
  const routineDetailRef = useRef(null);
  
  const generateDummyData = useWorkoutStore(state => state.generateDummyData);
  const clearAllData = useWorkoutStore(state => state.clearAllData);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);

  const {
    latestRoutineSessions,
    selectedSession,
    setSelectedSessionId,
  } = useSessionRotation();

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
  useGlobalShortcuts({
    NAV_TAB_IDS,
    setActiveTab,
    setGridRef,
    routineDetailRef,
  });

  const handleSaveSuccess = useCallback(() => {
    setSelectedSessionId(null);
    setActiveExerciseId(null);
    setActiveTab('L');
  }, [setSelectedSessionId]);

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
            onSaveSuccess={handleSaveSuccess}
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
