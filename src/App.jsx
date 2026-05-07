import { useState, useEffect, useCallback } from 'react'
import CaseDisplay from './components/CaseDisplay'
import CaseOpener from './components/CaseOpener'
import TaskResult from './components/TaskResult'

// State machine: 'idle' → 'opening' → 'result'

function pickWinner(tasks, lastId) {
  const available = tasks.length > 1 ? tasks.filter(t => t.id !== lastId) : tasks
  return available[Math.floor(Math.random() * available.length)]
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [phase, setPhase] = useState('idle')    // 'idle' | 'opening' | 'result'
  const [winner, setWinner] = useState(null)
  const [lastId, setLastId] = useState(null)
  const [openKey, setOpenKey] = useState(0)     // remount CaseOpener on each open

  useEffect(() => {
    fetch('tasks/tasks.json')
      .then(r => r.json())
      .then(data => setTasks(data))
      .catch(() => console.error('Failed to load tasks.json'))
  }, [])

  const handleOpen = useCallback(() => {
    if (!tasks.length || phase !== 'idle') return
    const w = pickWinner(tasks, lastId)
    setWinner(w)
    setOpenKey(k => k + 1)
    setPhase('opening')
  }, [tasks, phase, lastId])

  const handleFinished = useCallback(() => {
    setLastId(winner?.id ?? null)
    setPhase('result')
  }, [winner])

  const handleReopen = useCallback(() => {
    setPhase('idle')
  }, [])

  return (
    <main className="app">
      {/* Animated background grid */}
      <div className="app__bg" aria-hidden="true">
        <div className="app__bg-grid" />
        <div className="app__bg-vignette" />
      </div>

      <div className="app__content">
        {phase === 'idle' && (
          <CaseDisplay onOpen={handleOpen} />
        )}

        {phase === 'opening' && winner && (
          <CaseOpener
            key={openKey}
            tasks={tasks}
            winnerId={winner.id}
            onFinished={handleFinished}
          />
        )}

        {phase === 'result' && winner && (
          <TaskResult
            task={winner}
            onReopen={handleReopen}
          />
        )}
      </div>
    </main>
  )
}
