import '../styles/TaskResult.css'

const RARITY_LABELS = {
  common:    'Базовое',
  rare:      'Сложное',
  epic:      'Экзаменационное',
  legendary: 'Легенда ЕГЭ',
}

export default function TaskResult({ task, onReopen }) {
  const rarity = task.rarity ?? 'common'

  return (
    <div className={`result result--${rarity}`}>
      {/* Rarity badge header */}
      <div className="result__header">
        <span className={`result__rarity-badge result__rarity-badge--${rarity}`}>
          {RARITY_LABELS[rarity]}
        </span>
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
