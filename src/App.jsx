import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navigation from './components/Navigation'
import ExerciseInfo from './components/ExerciseInfo'
import WorkoutGrid from './components/WorkoutGrid'
import ExercisePastLogs from './components/ExercisePastLogs'
import RoutineDetail from './components/RoutineDetail'
import LogPage from './components/LogPage'
import RestTimer from './components/RestTimer'
import AccountMenu from './components/AccountMenu'
import { useWorkoutStore } from './store/useWorkoutStore'
import { useTabNavigation } from './hooks/useTabNavigation'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useWorkoutSessionRotation } from './hooks/useWorkoutSessionRotation'
import { useAuthSessionBridge } from './hooks/useAuthSessionBridge'
import './index.css'

const NAV_TAB_IDS = ['R', 'S', 'L'];
const NAV_SHORTCUTS = {
  KeyQ: 'R',
  KeyW: 'S',
  KeyE: 'L',
};
const NAV_FOCUS_SCOPE_SELECTOR = '[data-tab-navigation="main"]';
const getNavFocusTargetSelector = (tabId) =>
  `${NAV_FOCUS_SCOPE_SELECTOR} [data-tab-id="${tabId}"]`;

function App() {
  const [activeTab, setActiveTab] = useState('S')
  const [activeExerciseId, setActiveExerciseId] = useState(null)
  const [restTimer, setRestTimer] = useState(null)

  // Ref for WorkoutGrid imperative focus methods (C-key toggle)
  const workoutGridRef = useRef(null);
  const routineDetailRef = useRef(null);
  
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);

  useAuthSessionBridge();

  const {
    latestRoutineSessions,
    selectedSession,
    setSelectedSessionId,
  } = useWorkoutSessionRotation();

  const defaultExerciseId = useMemo(() => {
    if (!selectedSession) return null;
    return sessionExercises.find(se => se.session_id === selectedSession.id)?.exercise_id || null;
  }, [selectedSession, sessionExercises]);

  const effectiveActiveExerciseId = activeExerciseId || defaultExerciseId;

  const handleDataReset = useCallback(() => {
    setSelectedSessionId(null);
    setActiveExerciseId(null);
    setRestTimer(null);
  }, [setSelectedSessionId]);

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
    focusScopeSelector: NAV_FOCUS_SCOPE_SELECTOR,
    focusTargetSelector: getNavFocusTargetSelector,
  });

  // ── Miscellaneous global shortcuts (Escape, Backquote, Cmd+Arrow, retired 1/2/3) ──
  useGlobalShortcuts({
    NAV_TAB_IDS,
    activeTab,
    setActiveTab,
    workoutGridRef,
    routineDetailRef,
    focusScopeSelector: NAV_FOCUS_SCOPE_SELECTOR,
    focusTargetSelector: getNavFocusTargetSelector,
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
      <AccountMenu onDataReset={handleDataReset} />
      
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
          <WorkoutGrid 
            ref={workoutGridRef}
            key={setGridKey}
            session={selectedSession} 
            latestRoutineSessions={latestRoutineSessions}
            onSessionChange={setSelectedSessionId}
            onExerciseFocus={setActiveExerciseId} 
            onRestStart={handleRestStart}
            onSaveSuccess={handleSaveSuccess}
          />
          <ExercisePastLogs activeExerciseId={effectiveActiveExerciseId} />
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
