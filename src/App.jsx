import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navigation from './components/Navigation'
import ExerciseInfo from './components/ExerciseInfo'
import SetGrid from './components/SetGrid'
import PastLogs from './components/PastLogs'
import RoutineDetail from './components/RoutineDetail'
import LogPage from './components/LogPage'
import RestTimer from './components/RestTimer'
import AuthModal from './components/AuthModal'
import { supabase } from './utils/supabaseClient'
import { useWorkoutStore } from './store/useWorkoutStore'
import { useTabNavigation } from './hooks/useTabNavigation'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useSessionRotation } from './hooks/useSessionRotation'
import { User, LogOut, RefreshCw, UserCheck, Sparkles, Trash2 } from 'lucide-react'
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  // Ref for SetGrid imperative focus methods (C-key toggle)
  const setGridRef = useRef(null);
  const routineDetailRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const currentUser = useWorkoutStore(state => state.currentUser);
  const isSyncing = useWorkoutStore(state => state.isSyncing);
  const setAuthSession = useWorkoutStore(state => state.setAuthSession);
  const fetchUserData = useWorkoutStore(state => state.fetchUserData);
  const generateDummyData = useWorkoutStore(state => state.generateDummyData);
  const clearAllData = useWorkoutStore(state => state.clearAllData);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);

  // Supabase Auth State listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuthSession]);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

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
    focusScopeSelector: NAV_FOCUS_SCOPE_SELECTOR,
    focusTargetSelector: getNavFocusTargetSelector,
  });

  // ── Miscellaneous global shortcuts (Escape, Backquote, Cmd+Arrow, retired 1/2/3) ──
  useGlobalShortcuts({
    NAV_TAB_IDS,
    activeTab,
    setActiveTab,
    setGridRef,
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
      <div ref={dropdownRef} style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999, display: 'flex', alignItems: 'center' }}>
        {/* Profile/Guest Badge Button */}
        <button
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: currentUser.isGuest ? 'rgba(122, 162, 247, 0.06)' : 'rgba(158, 206, 106, 0.08)',
            border: currentUser.isGuest ? '1px solid rgba(122, 162, 247, 0.15)' : '1px solid rgba(158, 206, 106, 0.25)',
            borderRadius: '8px',
            color: currentUser.isGuest ? 'var(--accent)' : '#9ece6a',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '-0.02em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
          }}
        >
          <User size={13} />
          {currentUser.isGuest ? '로컬 게스트 모드' : `${currentUser.name} 님`}
        </button>

        {/* Premium macOS-style Dropdown Menu */}
        {isProfileDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '38px',
              right: 0,
              width: '220px',
              background: 'rgba(18, 22, 36, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              animation: 'dropdownFade 0.15s ease-out',
            }}
          >
            <style>{`
              @keyframes dropdownFade {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .dropdown-item {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 8px 12px;
                background: transparent;
                border: none;
                border-radius: 6px;
                color: var(--text-main);
                font-size: 13px;
                font-weight: 500;
                text-align: left;
                cursor: pointer;
                transition: all 0.15s;
              }
              .dropdown-item:hover {
                background: rgba(255, 255, 255, 0.06);
              }
              .dropdown-divider {
                height: 1px;
                background: rgba(255, 255, 255, 0.06);
                margin: 4px 6px;
              }
            `}</style>
            
            {/* Header info */}
            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentUser.isGuest ? (
                '로그인 후 데이터를 동기화하세요'
              ) : (
                <div style={{ wordBreak: 'break-all' }}>
                  연동 계정:<br />
                  <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{currentUser.email}</span>
                </div>
              )}
            </div>

            <div className="dropdown-divider" />

            {/* Auth Action */}
            {currentUser.isGuest ? (
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setIsAuthModalOpen(true);
                }}
                style={{ color: 'var(--accent)' }}
              >
                <UserCheck size={14} />
                로그인 / 회원가입
              </button>
            ) : (
              <>
                <button
                  className="dropdown-item"
                  disabled={isSyncing}
                  onClick={async () => {
                    await fetchUserData();
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  {isSyncing ? '동기화 중...' : '데이터 수동 동기화'}
                </button>
                
                <button
                  className="dropdown-item"
                  style={{ color: '#f7768e' }}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <LogOut size={14} />
                  로그아웃
                </button>
              </>
            )}

            <div className="dropdown-divider" />

            {/* Utility actions */}
            <button
              className="dropdown-item"
              onClick={() => {
                handleGenerateDummyData();
                setIsProfileDropdownOpen(false);
              }}
            >
              <Sparkles size={14} />
              더미 데이터 생성 🚀
            </button>

            <button
              className="dropdown-item"
              onClick={() => {
                handleClearAllData();
                setIsProfileDropdownOpen(false);
              }}
            >
              <Trash2 size={14} />
              초기화 🗑️
            </button>
          </div>
        )}

        {/* AuthModal component */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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
