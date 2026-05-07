import '../styles/TaskResult.css'

export default function TaskResult({ task, onReopen }) {
  return (
    <div className="result">
      {/* Top label */}
      <div className="result__header">
        <span className="result__header-badge">ВЫПАЛО ЗАДАНИЕ</span>
      </div>

      {/* Task image card */}
      <div className="result__card">
        {/* Corner accents */}
        <span className="result__corner result__corner--tl" />
        <span className="result__corner result__corner--tr" />
        <span className="result__corner result__corner--bl" />
        <span className="result__corner result__corner--br" />

        <img
          src={task.image}
          alt={`Задание ${task.id}`}
          className="result__img"
          draggable={false}
        />
      </div>

      {/* Motivating message */}
      <div className="result__message">
        <div className="result__message-icon">✦</div>
        <p className="result__message-text">{task.message}</p>
      </div>

      {/* Replay button */}
      <button className="result__replay" onClick={onReopen}>
        <span className="result__replay-icon">↺</span>
        Открыть снова
      </button>
    </div>
  )
}
