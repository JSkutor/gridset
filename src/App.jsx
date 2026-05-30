import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Navigation from "./components/Navigation";
import ExerciseInfo from "./components/ExerciseInfo";
import WorkoutGrid from "./components/WorkoutGrid";
import ExercisePastLogs from "./components/ExercisePastLogs";
import RoutineDetail from "./components/RoutineDetail";
import LogPage from "./components/LogPage";
import RestTimer from "./components/RestTimer";
import AccountMenu from "./components/AccountMenu";
import HelpModal from "./components/HelpModal";
import DemoClearAction from "./components/DemoClearAction";
import SyncStatusBanner from "./components/SyncStatusBanner";
import WorkoutCompletionModal from "./components/WorkoutCompletionModal";
import { HelpCircle } from "lucide-react";
import { useWorkoutStore } from "./store/useWorkoutStore";
import { useTabNavigation } from "./hooks/useTabNavigation";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useWorkoutSessionRotation } from "./hooks/useWorkoutSessionRotation";
import { useAuthSessionBridge } from "./hooks/useAuthSessionBridge";
import {
  APP_NAV_TAB,
  APP_NAV_TAB_IDS,
  APP_NAV_SHORTCUTS,
} from "./constants/appNavTabs";
const NAV_FOCUS_SCOPE_SELECTOR = '[data-tab-navigation="main"]';
const getNavFocusTargetSelector = (tabId) =>
  `${NAV_FOCUS_SCOPE_SELECTOR} [data-tab-id="${tabId}"]`;
const subscribeToWorkoutStoreHydration = (callback) => {
  const unsubscribeHydrate = useWorkoutStore.persist.onHydrate(callback);
  const unsubscribeFinishHydration =
    useWorkoutStore.persist.onFinishHydration(callback);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinishHydration();
  };
};
const getWorkoutStoreHydrationSnapshot = () =>
  useWorkoutStore.persist.hasHydrated();

function App() {
  const [activeTab, setActiveTab] = useState(APP_NAV_TAB.SET);
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const [restTimer, setRestTimer] = useState(null);
  const [completedWorkoutLog, setCompletedWorkoutLog] = useState(null);

  useSyncExternalStore(
    subscribeToWorkoutStoreHydration,
    getWorkoutStoreHydrationSnapshot,
    () => true,
  );

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Ref for WorkoutGrid imperative focus methods (C-key toggle)
  const workoutGridRef = useRef(null);
  const routineDetailRef = useRef(null);
  const appContainerRef = useRef(null);

  useEffect(() => {
    appContainerRef.current?.focus();
  }, []);

  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);
  const currentUser = useWorkoutStore((state) => state.currentUser);
  const hasClearedDemoData = useWorkoutStore(
    (state) => state.hasClearedDemoData,
  );
  const clearAllData = useWorkoutStore((state) => state.clearAllData);

  const showDemoClearButton = currentUser.isGuest && !hasClearedDemoData;

  useAuthSessionBridge();

  const { latestRoutineSessions, selectedSession, setSelectedSessionId } =
    useWorkoutSessionRotation();

  const defaultExerciseId = useMemo(() => {
    if (!selectedSession) return null;
    return (
      sessionExercises.find((se) => se.session_id === selectedSession.id)
        ?.exercise_id || null
    );
  }, [selectedSession, sessionExercises]);

  const effectiveActiveExerciseId = activeExerciseId || defaultExerciseId;

  const handleDataReset = useCallback(() => {
    setSelectedSessionId(null);
    setActiveExerciseId(null);
    setRestTimer(null);
  }, [setSelectedSessionId]);

  const handleClearDemoData = useCallback(() => {
    clearAllData();
    handleDataReset();
  }, [clearAllData, handleDataReset]);

  const handleRestStart = useCallback((payload) => {
    const durationSeconds = Math.max(
      0,
      Math.round(Number(payload.durationSeconds) || 0),
    );

    if (durationSeconds <= 0) {
      setRestTimer(null);
      return;
    }

    setRestTimer({
      ...payload,
      id: `${Date.now()}-${payload.mode}-${payload.exerciseId || "rest"}`,
      durationSeconds,
      remainingSeconds: durationSeconds,
      endsAt: Date.now() + durationSeconds * 1000,
      isPaused: false,
    });
  }, []);

  const handleToggleRestPause = useCallback(() => {
    setRestTimer((currentTimer) => {
      if (!currentTimer || currentTimer.remainingSeconds <= 0)
        return currentTimer;

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
        remainingSeconds: Math.max(
          0,
          Math.ceil((currentTimer.endsAt - Date.now()) / 1000),
        ),
      };
    });
  }, []);

  const handleDismissRestTimer = useCallback(() => {
    setRestTimer(null);
  }, []);

  useEffect(() => {
    if (!restTimer?.id || restTimer.isPaused || restTimer.remainingSeconds <= 0)
      return undefined;

    const intervalId = window.setInterval(() => {
      setRestTimer((currentTimer) => {
        if (!currentTimer || currentTimer.isPaused) return currentTimer;

        const remainingSeconds = Math.max(
          0,
          Math.ceil((currentTimer.endsAt - Date.now()) / 1000),
        );
        if (remainingSeconds === currentTimer.remainingSeconds)
          return currentTimer;

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

  // Global listener to remove hover effects when keyboard navigating
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(
          e.key,
        )
      ) {
        document.body.classList.add("keyboard-navigating");
      }
    };

    const handleMouseInteraction = () => {
      document.body.classList.remove("keyboard-navigating");
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousemove", handleMouseInteraction, true);
    window.addEventListener("mousedown", handleMouseInteraction, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousemove", handleMouseInteraction, true);
      window.removeEventListener("mousedown", handleMouseInteraction, true);
    };
  }, []);

  // ── Q / W / E: switch top-level tabs ────────────────────────────────────
  useTabNavigation({
    tabIds: APP_NAV_TAB_IDS,
    shortcuts: APP_NAV_SHORTCUTS,
    activeTab,
    setActiveTab,
    focusScopeSelector: NAV_FOCUS_SCOPE_SELECTOR,
    focusTargetSelector: getNavFocusTargetSelector,
  });

  // ── Miscellaneous global shortcuts (Escape, Backquote, Cmd+Arrow, retired 1/2/3) ──
  useGlobalShortcuts({ workoutGridRef, routineDetailRef });

  const handleSaveSuccess = useCallback((newLog) => {
    setCompletedWorkoutLog(newLog);
  }, []);

  const setGridKey = useMemo(() => {
    if (!selectedSession) return "empty-session";
    const exerciseSignature = sessionExercises
      .filter((se) => se.session_id === selectedSession.id)
      .sort((a, b) => a.order - b.order)
      .map(
        (se) =>
          `${se.id}:${se.exercise_id}:${se.order}:${se.target_sets}:${se.target_record}`,
      )
      .join("|");
    return `${selectedSession.id}:${exerciseSignature}`;
  }, [selectedSession, sessionExercises]);

  return (
    <div ref={appContainerRef} className="app-container" tabIndex={-1}>
      <div className="top-right-header-actions">
        {showDemoClearButton && <DemoClearAction onConfirm={handleClearDemoData} />}
        <button
          className="help-trigger-btn"
          onClick={() => setIsHelpOpen(true)}
          title="도움말"
          aria-label="도움말 열기"
        >
          <HelpCircle size={14} />
          <span>도움말</span>
        </button>
        <AccountMenu />
      </div>
      <SyncStatusBanner />

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <RestTimer
        timer={restTimer}
        isVisible={activeTab === APP_NAV_TAB.SET}
        onTogglePause={handleToggleRestPause}
        onDismiss={handleDismissRestTimer}
      />

      <div
        className={`page-content-frame ${activeTab === APP_NAV_TAB.ROUTINE ? "page-content-frame--routine" : ""}`}
      >
        {activeTab === APP_NAV_TAB.SET && (
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

        {activeTab === APP_NAV_TAB.ROUTINE && (
          <main className="page-main page-main--routine">
            <RoutineDetail ref={routineDetailRef} />
          </main>
        )}

        {activeTab === APP_NAV_TAB.LOG && (
          <main className="page-main page-main--log">
            <LogPage />
          </main>
        )}
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <WorkoutCompletionModal
        isOpen={Boolean(completedWorkoutLog)}
        workoutLog={completedWorkoutLog}
        onClose={() => {
          setCompletedWorkoutLog(null);
          setSelectedSessionId(null);
          setActiveExerciseId(null);
          setActiveTab(APP_NAV_TAB.LOG);
        }}
      />
    </div>
  );
}

export default App;
