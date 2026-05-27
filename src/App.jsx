import { useState } from 'react'
import Navigation from './components/Navigation'
import ExerciseInfo from './components/ExerciseInfo'
import SetGrid from './components/SetGrid'
import PastLogs from './components/PastLogs'
import { useWorkoutStore } from './store/useWorkoutStore'
import { useEffect } from 'react'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('S')
  const [activeExerciseId, setActiveExerciseId] = useState(null)
  
  const generateDummyData = useWorkoutStore(state => state.generateDummyData);
  const clearAllData = useWorkoutStore(state => state.clearAllData);
  const routines = useWorkoutStore(state => state.routines);
  const routineExercises = useWorkoutStore(state => state.routineExercises);

  const selectedRoutine = routines[0] || null;

  useEffect(() => {
    if (selectedRoutine && !activeExerciseId) {
      const firstRoutineExercise = routineExercises.find(re => re.routine_id === selectedRoutine.id);
      if (firstRoutineExercise) {
        setActiveExerciseId(firstRoutineExercise.exercise_id);
      }
    }
  }, [selectedRoutine, routineExercises, activeExerciseId]);

  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999 }}>
        <button onClick={generateDummyData} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}>
          더미 데이터 생성 🚀
        </button>
        <button onClick={clearAllData} style={{ padding: '4px 8px', cursor: 'pointer' }}>
          데이터 초기화 🗑️
        </button>
      </div>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'S' && (
        <main className="main-grid">
          <ExerciseInfo activeExerciseId={activeExerciseId} />
          <SetGrid 
            routine={selectedRoutine} 
            onExerciseFocus={setActiveExerciseId} 
          />
          <PastLogs activeExerciseId={activeExerciseId} />
        </main>
      )}

      {activeTab === 'R' && <main style={{ flex: 1 }}></main>}
      {activeTab === 'L' && <main style={{ flex: 1 }}></main>}
    </div>
  )
}

export default App
