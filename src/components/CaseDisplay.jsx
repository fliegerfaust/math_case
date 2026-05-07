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

            {/* Center emblem */}
            <div className="case__emblem">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="case__emblem-svg">
                {/* Outer hex ring */}
                <polygon
                  points="40,4 72,22 72,58 40,76 8,58 8,22"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                />
                {/* Inner hex */}
                <polygon
                  points="40,14 64,28 64,52 40,66 16,52 16,28"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.4"
                />
                {/* Math symbol */}
                <text
                  x="40"
                  y="47"
                  textAnchor="middle"
                  fontFamily="serif"
                  fontSize="28"
                  fill="currentColor"
                  fontWeight="bold"
                >
                  ∑
                </text>
              </svg>
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
