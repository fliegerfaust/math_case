import '../styles/CaseDisplay.css'

export default function CaseDisplay({ onOpen }) {
  return (
    <div className="case-scene">
      <div className="case-title">
        <span className="case-title__label">МАТЕМАТИЧЕСКИЙ КЕЙС</span>
        <span className="case-title__subtitle">ЕГЭ · ПРОФИЛЬНЫЙ УРОВЕНЬ</span>
      </div>

      <button className="case-wrapper" onClick={onOpen} aria-label="Открыть кейс">
        <div className="case">
          {/* Corner accents */}
          <span className="case__corner case__corner--tl" />
          <span className="case__corner case__corner--tr" />
          <span className="case__corner case__corner--bl" />
          <span className="case__corner case__corner--br" />

          {/* Top edge scan line */}
          <span className="case__scan" />

          {/* Body */}
          <div className="case__body">
            {/* Side stripe decorations */}
            <div className="case__stripe case__stripe--left" />
            <div className="case__stripe case__stripe--right" />

            {/* Center emblem — логотип преподавателя */}
            <div className="case__emblem">
              <img
                src="logo.png"
                alt="ДенВал научит"
                className="case__emblem-logo"
              />
            </div>

            {/* Bottom label */}
            <div className="case__label">НАЖМИ ЧТОБЫ ОТКРЫТЬ</div>
          </div>

          {/* Bottom edge bar */}
          <div className="case__bottom-bar">
            <span className="case__bottom-bar-dot" />
            <span className="case__bottom-bar-line" />
            <span className="case__bottom-bar-dot" />
          </div>
        </div>

        {/* Glow ring under case */}
        <div className="case-glow" />
      </button>

      <p className="case-hint">Открой кейс, чтобы получить своё задание</p>
    </div>
  )
}
