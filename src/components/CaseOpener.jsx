import { useEffect, useRef, useMemo, useState } from 'react'
import '../styles/CaseOpener.css'

const ITEM_WIDTH = 200   // px width of each task card in the strip (desktop default)
const ITEM_GAP = 8       // px gap between cards
const STRIP_COUNT = 50   // total items in the strip
const WINNER_INDEX = 40  // winner stops here (near end)
const ANIM_DURATION = 7000 // ms

function buildStrip(tasks, winnerId) {
  const result = []
  for (let i = 0; i < STRIP_COUNT; i++) {
    if (i === WINNER_INDEX) {
      result.push(tasks.find(t => t.id === winnerId) || tasks[0])
    } else {
      result.push(tasks[i % tasks.length])
    }
  }
  return result
}

export default function CaseOpener({ tasks, winnerId, onFinished }) {
  const stripRef      = useRef(null) // inner layer (sharp, clipped to lens)
  const stripOuterRef = useRef(null) // outer layer (scaled-down, blurred)
  const hasStarted    = useRef(false)
  const [animDone, setAnimDone] = useState(false)

  const strip = useMemo(() => buildStrip(tasks, winnerId), [tasks, winnerId])

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const el      = stripRef.current
    const elOuter = stripOuterRef.current
    if (!el || !elOuter) return

    const container     = el.parentElement.parentElement // track → viewport
    const containerWidth = container.offsetWidth
    const viewCenter    = containerWidth / 2

    // Measure actual rendered item width from DOM (respects CSS responsive breakpoints)
    const firstItem      = el.querySelector('.opener__item')
    const actualItemWidth = firstItem ? firstItem.offsetWidth : ITEM_WIDTH
    const actualItemStep  = actualItemWidth + ITEM_GAP

    // Both strips have identical layout (transform: scale on items doesn't affect layout)
    // so the same finalTranslate aligns the winner card in both layers.
    const winnerCenter   = WINNER_INDEX * actualItemStep + actualItemWidth / 2
    const finalTranslate = -(winnerCenter - viewCenter)

    const applyAnim = (target) => {
      target.style.transition = 'none'
      target.style.transform  = 'translateX(0px)'
      void target.offsetWidth
      target.style.transition = `transform ${ANIM_DURATION}ms cubic-bezier(0.05, 0.8, 0.15, 1)`
      target.style.transform  = `translateX(${finalTranslate}px)`
    }

    applyAnim(el)
    applyAnim(elOuter)

    const timer       = setTimeout(() => setAnimDone(true), ANIM_DURATION + 100)
    const finishTimer = setTimeout(() => onFinished(),      ANIM_DURATION + 1000)

    return () => {
      clearTimeout(timer)
      clearTimeout(finishTimer)
      hasStarted.current = false
    }
  }, [onFinished])

  const renderItems = (isOuter) =>
    strip.map((task, i) => (
      <div
        key={i}
        className={[
          'opener__item',
          `opener__item--${task.rarity ?? 'common'}`,
          !isOuter && i === WINNER_INDEX && animDone ? 'opener__item--winner' : '',
        ].filter(Boolean).join(' ')}
      >
        <img
          src={task.image}
          alt={`Задание ${task.id}`}
          className="opener__item-img"
          draggable={false}
        />
        <div className="opener__item-overlay" />
      </div>
    ))

  return (
    <div className="opener">
      <div className="opener__header">
        <span className="opener__header-text">ОТКРЫВАЕМ КЕЙС</span>
      </div>

      <div className="opener__viewport">
        {/* Outer layer: scaled-down + blurred cards fill the background */}
        <div className="opener__track opener__track--outer">
          <div className="opener__strip" ref={stripOuterRef}>
            {renderItems(true)}
          </div>
        </div>

        {/* Inner layer: normal-size sharp cards, clipped to the lens circle */}
        <div className="opener__track opener__track--inner">
          <div className="opener__strip" ref={stripRef}>
            {renderItems(false)}
          </div>
        </div>

        {/* Neon lens ring with top/bottom chevron notches */}
        <div className="opener__lens-ring">
          <span className="opener__lens-notch opener__lens-notch--top" />
          <span className="opener__lens-notch opener__lens-notch--bottom" />
        </div>
      </div>

      <p className="opener__hint">Ждите результата…</p>
    </div>
  )
}
