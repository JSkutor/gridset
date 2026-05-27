import { useState } from 'react'
import Navigation from './components/Navigation'
import ExerciseInfo from './components/ExerciseInfo'
import SetGrid from './components/SetGrid'
import PastLogs from './components/PastLogs'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('S')

  return (
    <div className="app-container">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'S' && (
        <main className="main-grid">
          <ExerciseInfo />
          <SetGrid />
          <PastLogs />
        </main>
      )}

      {activeTab === 'R' && <main style={{ flex: 1 }}></main>}
      {activeTab === 'L' && <main style={{ flex: 1 }}></main>}
    </div>
  )
}

export default App
