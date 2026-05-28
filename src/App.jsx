import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import ExerciseInfo from './components/ExerciseInfo'
import SetGrid from './components/SetGrid'
import PastLogs from './components/PastLogs'
import RoutineDetail from './components/RoutineDetail'
import { useWorkoutStore } from './store/useWorkoutStore'
import { User } from 'lucide-react'
import { getFormattedSessionName } from './utils/sessionHelper'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('S')
  const [activeExerciseId, setActiveExerciseId] = useState(null)
  
  const generateDummyData = useWorkoutStore(state => state.generateDummyData);
  const clearAllData = useWorkoutStore(state => state.clearAllData);
  const routines = useWorkoutStore(state => state.routines);
  const sessions = useWorkoutStore(state => state.sessions);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);

  // 현재 활성화 및 훈련 진행할 세션 ID 상태 관리
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // 세션 목록이 로드되거나 변경될 때 기본값 설정
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0] || null;

  useEffect(() => {
    if (selectedSession && !activeExerciseId) {
      const firstSessionExercise = sessionExercises.find(se => se.session_id === selectedSession.id);
      if (firstSessionExercise) {
        setActiveExerciseId(firstSessionExercise.exercise_id);
      }
    }
  }, [selectedSession, sessionExercises, activeExerciseId]);

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

        {/* 'S' 탭일 때 루틴을 즉시 바꿀 수 있는 선택 드롭다운 */}
        {activeTab === 'S' && sessions.length > 0 && (
          <select
            value={selectedSessionId || ''}
            onChange={(e) => {
              setSelectedSessionId(e.target.value);
              setActiveExerciseId(null); // 운동 타겟 리셋하여 첫 번째 운동 활성화 유도
            }}
            style={{
              padding: '6px 12px',
              background: 'rgba(12, 14, 24, 0.85)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              color: 'var(--accent)',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {sessions.map(s => {
              const r = routines.find(rt => rt.id === s.routine_id);
              const formattedName = getFormattedSessionName(s, sessions);
              return (
                <option key={s.id} value={s.id}>
                  {r ? `[${r.name}] ${formattedName}` : formattedName}
                </option>
              );
            })}
          </select>
        )}
        
        <button onClick={generateDummyData} style={{ padding: '6px 10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)' }}>
          더미 데이터 생성 🚀
        </button>
        <button onClick={clearAllData} style={{ padding: '6px 10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)' }}>
          초기화 🗑️
        </button>
      </div>
      
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'S' && (
        <main className="main-grid">
          <ExerciseInfo activeExerciseId={activeExerciseId} />
          <SetGrid 
            session={selectedSession} 
            onExerciseFocus={setActiveExerciseId} 
          />
          <PastLogs activeExerciseId={activeExerciseId} />
        </main>
      )}

      {activeTab === 'R' && (
        <main style={{ flex: 1, padding: '0 32px 32px 32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RoutineDetail />
        </main>
      )}
      
      {activeTab === 'L' && <main style={{ flex: 1 }}></main>}
    </div>
  )
}

export default App
